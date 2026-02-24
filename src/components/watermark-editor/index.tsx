"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useUploadStore } from "@/store/uploadStore";
import { getSampleImageById } from "@/config/sampleImages";
import { toast } from "react-hot-toast";
import { RiCloseCircleLine, RiImageAddLine, RiMagicLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import ImageUploader from "./ImageUploader";
import ImagePreview from "./ImagePreview";
import ResultDisplay from "./ResultDisplay";
import { useTranslations } from "next-intl";

interface ProcessOptions {
  mode: "auto" | "conservative" | "aggressive";
  prompt?: string;
}

interface ApiResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  details?: string;
  processingTime?: number;
  tokensUsed?: any;
  metadata?: any;
}

interface WatermarkEditorProps {
  onProcessingComplete?: () => void;
}

// API 端点配置
// 开发环境可以启用 Mock API 以节省成本
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const API_ENDPOINT = USE_MOCK_API ? '/api/mock-seededit' : '/api/seededit';

export default function WatermarkEditor({ onProcessingComplete }: WatermarkEditorProps) {
  // State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [processingOptions, setProcessingOptions] = useState<ProcessOptions>({
    mode: "auto",
  });
  const t = useTranslations("convert.watermark_removal");
  const processingT = useTranslations("convert.processing");
  const imageT = useTranslations("convert.image");

  // Image ratio state
  const [selectedRatio, setSelectedRatio] = useState<string>("default");

  // Auto processing ref
  const autoProcessRef = useRef(false);

  // 格式化当前时间的辅助函数
  const getTimestamp = () => new Date().toISOString();

  // 显示当前 API 模式（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log(`[WatermarkEditor] API mode: ${USE_MOCK_API ? 'MOCK' : 'REAL'} (${API_ENDPOINT})`);
  }

  // Zustand store for uploaded images (from homepage)
  const searchParams = useSearchParams();
  const isFromUpload = searchParams.get('fromUpload') === 'true';
  const isFromSample = searchParams.get('fromSample') === 'true';
  const pendingImage = useUploadStore(state => state.pendingImage);
  const clearPendingImage = useUploadStore(state => state.clearPendingImage);
  const sampleId = useUploadStore(state => state.sampleId);
  const clearSampleId = useUploadStore(state => state.clearSampleId);

  // 示例模式处理 ref
  const sampleProcessedRef = useRef(false);

  // Image upload
  const handleImageLoad = useCallback((img: HTMLImageElement, file: File) => {
    console.log("Loading image:", file.name, file.size);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setImageFile(file);
    setImageMetadata({ width: img.width, height: img.height });
    setResultImageUrl(null);
    setError(null);
  }, []);

  // Auto-load image from store if coming from homepage upload
  useEffect(() => {
    if (isFromUpload && pendingImage) {
      console.log('Loading pending image from store');
      handleImageLoad(pendingImage.image, pendingImage.file);
      clearPendingImage();

      // 检查是否需要自动处理
      const shouldAutoProcess = searchParams.get('autoProcess') === 'true';
      if (shouldAutoProcess) {
        autoProcessRef.current = true;
      }

      // Clean URL parameter
      window.history.replaceState({}, '', '/convert');

      toast.success(imageT('image_load_success'));
    }
  }, [isFromUpload, pendingImage, handleImageLoad, clearPendingImage, searchParams]);

  // 示例模式：加载预存图片并模拟处理过程
  useEffect(() => {
    if (isFromSample && sampleId && !sampleProcessedRef.current) {
      sampleProcessedRef.current = true;
      const sample = getSampleImageById(sampleId);
      if (!sample) {
        console.error('[WatermarkEditor] Sample not found:', sampleId);
        clearSampleId();
        return;
      }

      console.log('[WatermarkEditor] Sample mode activated:', sample.id);

      // 设置 before 图片作为预览（使用公共路径）
      setImagePreviewUrl(sample.before);
      // 创建一个虚拟 File 对象以满足 UI 条件
      fetch(sample.before)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `sample-${sample.id}.webp`, { type: 'image/webp' });
          setImageFile(file);
          setImageMetadata({ width: 800, height: 600 });

          // 立即开始模拟处理
          setIsProcessing(true);
          setError(null);

          // 延迟 10 秒，模拟真实 API 调用
          const delay = 10000;
          setTimeout(() => {
            setResultImageUrl(sample.after);
            setIsProcessing(false);
            toast.success(t('watermark_removed_success'));
            // 不调用 onProcessingComplete —— 不扣积分
          }, delay);
        })
        .catch(err => {
          console.error('[WatermarkEditor] Failed to load sample image:', err);
          setIsProcessing(false);
        });

      // 清理 URL 和 store
      window.history.replaceState({}, '', '/convert');
      clearSampleId();
    }
  }, [isFromSample, sampleId, clearSampleId, t]);

  // Remove image
  const handleRemoveImage = useCallback(() => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setImageFile(null);
    setImageMetadata(null);
    setResultImageUrl(null);
  }, [imagePreviewUrl]);

  // Reset editor
  const handleReset = useCallback(() => {
    handleRemoveImage();
    setProcessingOptions({ mode: "auto" });
  }, [handleRemoveImage]);

  // Ratio options configuration
  // Note: Values must be supported by the API (standard resolutions)
  // Refactored to include visual aspect ratio data for UI
  const RATIO_OPTIONS = [
    { label: processingT("ratio_default"), value: "default", aspect: "aspect-[auto]", iconClass: "w-6 h-6 border-dashed border-2 rounded-sm" }, 
    { label: processingT("ratio_square"), value: "1024x1024", aspect: "aspect-square", iconClass: "w-5 h-5 border-2 rounded-sm bg-current/20" },
    { label: "3:4", value: "768x1024", aspect: "aspect-[3/4]", iconClass: "w-4 h-5 border-2 rounded-sm" },
    { label: "4:3", value: "1024x768", aspect: "aspect-[4/3]", iconClass: "w-5 h-4 border-2 rounded-sm" },
    { label: "9:16", value: "720x1280", aspect: "aspect-[9/16]", iconClass: "w-3.5 h-6 border-2 rounded-sm" },
    { label: "16:9", value: "1280x720", aspect: "aspect-[16/9]", iconClass: "w-6 h-3.5 border-2 rounded-sm" },
    { label: "2:3", value: "704x1056", aspect: "aspect-[2/3]", iconClass: "w-4 h-6 border-2 rounded-sm" },
    { label: "3:2", value: "1056x704", aspect: "aspect-[3/2]", iconClass: "w-6 h-4 border-2 rounded-sm" },
    { label: "21:9", value: "1536x640", aspect: "aspect-[21/9]", iconClass: "w-7 h-3 border-2 rounded-sm" },
  ];

  // 解析 SSE 流式响应
  const parseSSEStream = useCallback(async (response: Response, onEvent: (event: any) => void) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留未完成的行

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const eventData = JSON.parse(dataStr);
              onEvent(eventData);
            } catch (e) {
              console.error('[SSE] Failed to parse event data:', dataStr);
            }
          }
        }
      }

      // 处理剩余缓冲区
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr !== '[DONE]') {
            try {
              const eventData = JSON.parse(dataStr);
              onEvent(eventData);
            } catch (e) {
              console.error('[SSE] Failed to parse final event data:', dataStr);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }, []);

  // Process image with streaming support
  const handleProcess = useCallback(async (useStreaming = true) => {
    if (!imageFile || isProcessing) {
      console.log("Cannot process:", { hasFile: !!imageFile, isProcessing });
      return;
    }

    // Determine target size
    let targetSize = selectedRatio;
    if (selectedRatio === 'default' && imageMetadata) {
       // Use original dimensions to preserve aspect ratio
       // Depending on API requirements, we might need to scale this if it's too large or small,
       // but for "maintaining proportion", sending exact or scaled-down dimensions is best.
       // Let's send the original dimensions (formatted as string) and let the backend/model handle scaling if needed,
       // OR we can cap it here if we want to be safe (e.g. max 2048 on long side).
       // Doubao Seedream usually handles reasonable resolutions well.
       targetSize = `${imageMetadata.width}x${imageMetadata.height}`;
    } else if (selectedRatio === 'default') {
       // Fallback if no metadata (shouldn't happen if image is loaded)
       targetSize = "1024x1024";
    }

    const timestamp = getTimestamp();
    console.log(`[Watermark Editor] [${timestamp}] Starting image processing...`, {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      mode: processingOptions.mode,
      selectedRatio,
      actualTargetSize: targetSize,
      hasCustomPrompt: !!processingOptions.prompt,
      useStreaming
    });

    setIsProcessing(true);
    setError(null);

    try {
      // Create form data
      console.log(`[Watermark Editor] [${getTimestamp()}] Building FormData...`);
      const formData = new FormData();
      formData.append("image", imageFile, imageFile.name);
      formData.append("mode", processingOptions.mode);
      formData.append("size", targetSize); // Use calculated size
      formData.append("stream", useStreaming ? "true" : "false"); // 启用流式输出

      if (processingOptions.prompt) {
        formData.append("prompt", processingOptions.prompt);
        console.log(`[Watermark Editor] [${getTimestamp()}] Custom prompt added:`, processingOptions.prompt.substring(0, 100) + '...');
      }

      console.log(`[Watermark Editor] [${getTimestamp()}] Sending fetch request...`, {
        endpoint: API_ENDPOINT,
        method: 'POST',
        useStreaming,
        timeout: '120s'
      });

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
        // Ensure cookies are sent even if same-origin (safer)
        credentials: 'include',
        // Set timeout at fetch level (2 minutes)
        signal: AbortSignal.timeout(120000),
      });

      const contentType = response.headers.get('content-type') || '';
      const isStreaming = contentType.includes('text/event-stream');

      console.log(`[Watermark Editor] [${getTimestamp()}] Fetch response received:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        isStreaming,
        contentType
      });

      // Handle response
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const text = await response.text();
          errorData = { error: "Failed to parse API response", details: text, raw: text };
        }

        console.error(`[Watermark Editor] [${getTimestamp()}] HTTP error response:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          rawResponse: response
        });

        // 额度用完特殊处理（Toast + 内联错误）
        if (response.status === 403 && errorData.code === 'CREDIT_LIMIT_EXCEEDED') {
          console.log(`[Watermark Editor] [${getTimestamp()}] Credit limit exceeded, showing special error UI`);

          // 1. Toast 通知（顶部弹出，红色错误样式）
          toast.error(errorData.error, {
            duration: 8000,
            icon: '⚠️',
            style: {
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
            },
          });

          // 2. 内联错误详情（保留在编辑器内，包含操作按钮）
          setError(
            <div className="space-y-4">
              <div>
                <p className="font-medium text-red-800 mb-2">{errorData.details}</p>
                <div className="text-sm text-red-700">
                  <p className="mb-2">💡 {t("you_can:")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>{t("upgrade_to_pro")}</li>
                    <li>{t("wait_for_reset")}</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => window.location.href = '/pricing'}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg
                    hover:from-red-600 hover:to-red-700 transition font-medium shadow-sm"
                >
                  {t("upgrade_to_pro_button")}
                </button>
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50
                    transition font-medium text-gray-700"
                >
                  {t("try_again_later")}
                </button>
              </div>
            </div>
          );

          // 不抛出错误，直接返回（避免进入通用错误处理）
          setIsProcessing(false);
          return;
        }

        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      // 处理流式响应
      if (isStreaming) {
        console.log(`[Watermark Editor] [${getTimestamp()}] Processing streaming response...`);

        let finalImageUrl: string | null = null;
        let finalUsage: any = null;

        await parseSSEStream(response, (event) => {
          console.log(`[Watermark Editor] [${getTimestamp()}] Received SSE event:`, {
            type: event.type,
            hasUrl: !!event.url,
            hasB64: !!event.b64_json
          });

          switch (event.type) {
            case 'image_generation.partial_succeeded':
              // 部分成功，获取图片 URL
              if (event.url) {
                finalImageUrl = event.url;
              } else if (event.b64_json) {
                finalImageUrl = `data:image/jpeg;base64,${event.b64_json}`;
              }
              break;

            case 'image_generation.completed':
              // 全部完成
              if (event.usage) {
                finalUsage = event.usage;
              }
              break;

            case 'error':
              // 错误事件
              console.error(`[Watermark Editor] [${getTimestamp()}] Stream error event:`, event);
              throw new Error(event.message || 'Stream processing error');
          }
        });

        console.log(`[Watermark Editor] [${getTimestamp()}] Stream processing completed:`, {
          hasImageUrl: !!finalImageUrl,
          hasUsage: !!finalUsage
        });

        if (finalImageUrl) {
          setResultImageUrl(finalImageUrl);
          toast.success(t("watermark_removed_success"));

          // Notify parent component to refresh credits
          if (onProcessingComplete) {
            console.log(`[Watermark Editor] [${getTimestamp()}] Notifying parent component of completion`);
            onProcessingComplete();
          }
        } else {
          throw new Error('No image generated from stream');
        }

        setIsProcessing(false);
        return;
      }

      // 非流式响应（回退方案）
      const data: ApiResponse = await response.json();
      console.log(`[Watermark Editor] [${getTimestamp()}] API response parsed:`, {
        success: data.success,
        hasImageUrl: !!data.imageUrl,
        processingTime: data.processingTime,
        error: data.error,
        fullData: data
      });

      if (data.success && data.imageUrl) {
        console.log(`[Watermark Editor] [${getTimestamp()}] Processing successful:`, {
          processingTime: data.processingTime,
          imageUrl: data.imageUrl,
          tokensUsed: data.tokensUsed,
          metadata: data.metadata
        });
        setResultImageUrl(data.imageUrl);
        toast.success(t("watermark_removed_success"));

        // Notify parent component to refresh credits
        if (onProcessingComplete) {
          console.log(`[Watermark Editor] [${getTimestamp()}] Notifying parent component of completion`);
          onProcessingComplete();
        }
      } else {
        console.error(`[Watermark Editor] [${getTimestamp()}] Processing failed in response:`, {
          error: data.error,
          details: data.details,
          fullData: data
        });
        throw new Error(data.error || processingT("processing_failed"));
      }
    } catch (error) {
      console.error(`[Watermark Editor] [${getTimestamp()}] Processing failed:`, {
        error: error,
        errorType: error instanceof Error ? error.name : typeof error,
        errorStack: error instanceof Error ? error.stack : 'N/A',
        imageFile: imageFile ? {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type
        } : null
      });

      let errorMessage = processingT("processing_failed");
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Provide more context based on error message
      if (errorMessage.includes("timeout")) {
        errorMessage = t("timeout_error");
      } else if (errorMessage.includes("Rate limit")) {
        errorMessage = t("rate_limit_error");
      } else if (errorMessage.includes("Unsupported format")) {
        errorMessage = t("unsupported_format_error");
      }

      setError(errorMessage);
      toast.error(t("watermark_removal_failed"));
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, isProcessing, imagePreviewUrl, processingOptions, t, processingT, onProcessingComplete, parseSSEStream, selectedRatio, imageMetadata]);

  // 处理错误警告
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 图片加载完成后自动开始处理（使用流式输出）
  useEffect(() => {
    if (autoProcessRef.current && imageFile && !isProcessing && !resultImageUrl) {
      autoProcessRef.current = false;
      console.log('[WatermarkEditor] Auto-starting processing after upload (with streaming)');
      handleProcess(true); // 启用流式输出
    }
  }, [imageFile, isProcessing, resultImageUrl, handleProcess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // If we have a result, show it
  if (resultImageUrl) {
    // 创建原图的临时URL
    const originalImageUrl = imagePreviewUrl || URL.createObjectURL(imageFile!);

    return (
      <div className="w-full max-w-5xl mx-auto">
        <ResultDisplay
          originalImageUrl={originalImageUrl}
          resultImageUrl={resultImageUrl}
          onReset={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {!imageFile ? (
        <ImageUploader
          onImageLoad={handleImageLoad}
          isDragging={false}
          setIsDragging={() => {}}
          error={typeof error === 'string' ? error : null}
          setError={(err) => setError(err)}
        />
      ) : (
        <>
          {/* 图片预览 - 带处理中遮罩 */}
          <div className="relative">
            <ImagePreview
              imageUrl={imagePreviewUrl!}
              file={imageFile}
              metadata={{
                width: imageMetadata?.width ?? 0,
                height: imageMetadata?.height ?? 0,
                size: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
                type: imageFile.type,
              }}
              onRemove={handleRemoveImage}
            />

            {/* 处理中遮罩 */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white font-medium text-lg">{t("generating")}</p>
                <p className="text-white/70 text-sm mt-2">{processingT("please_wait")}</p>
              </div>
            )}
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-4 bg-destructive/10 border-destructive rounded-lg">
              <div className="flex items-start gap-3">
                <RiCloseCircleLine className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-destructive-foreground text-sm">
                  <p className="font-medium mb-1">{processingT("processing_failed")}</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isProcessing}
                >
                  <RiImageAddLine className="w-4 h-4 mr-2" />
                  {imageT("upload_new_image")}
                </Button>
              </div>

              <Button
                size="lg"
                onClick={() => handleProcess(true)}
                disabled={isProcessing || !imageFile}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 px-8 min-w-[200px] cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RiLoader4Line className="w-5 h-5 mr-2 animate-spin" />
                    {t("processing")}
                  </>
                ) : (
                  <>
                    <RiMagicLine className="w-5 h-5 mr-2" />
                    {t("start_watermark_removal")}
                  </>
                )}
              </Button>
            </div>

            {/* 处理提示 */}
            {isProcessing && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-primary flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                  {processingT("ai_recognition")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {processingT("processing_time_info")}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
