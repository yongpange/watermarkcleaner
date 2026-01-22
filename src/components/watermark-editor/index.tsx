"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUploadStore } from "@/store/uploadStore";
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

  // 显示当前 API 模式（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log(`[WatermarkEditor] API mode: ${USE_MOCK_API ? 'MOCK' : 'REAL'} (${API_ENDPOINT})`);
  }

  // Zustand store for uploaded images (from homepage)
  const searchParams = useSearchParams();
  const isFromUpload = searchParams.get('fromUpload') === 'true';
  const pendingImage = useUploadStore(state => state.pendingImage);
  const clearPendingImage = useUploadStore(state => state.clearPendingImage);

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

      // Clean URL parameter
      window.history.replaceState({}, '', '/convert');

      toast.success(imageT('image_load_success'));
    }
  }, [isFromUpload, pendingImage, handleImageLoad, clearPendingImage]);

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

  // Process image
  const handleProcess = useCallback(async () => {
    if (!imageFile || isProcessing) {
      console.log("Cannot process:", { hasFile: !!imageFile, isProcessing });
      return;
    }

    console.log("Starting image processing...", {
      file: imageFile.name,
      size: imageFile.size,
      mode: processingOptions.mode,
    });

    setIsProcessing(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("image", imageFile, imageFile.name);
      formData.append("mode", processingOptions.mode);

      if (processingOptions.prompt) {
        formData.append("prompt", processingOptions.prompt);
      }

      console.log(`Sending request to ${API_ENDPOINT}...`);
      console.log(`[WatermarkEditor] API mode: ${USE_MOCK_API ? 'MOCK' : 'REAL'}`);
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
        // Set timeout at fetch level (2 minutes)
        signal: AbortSignal.timeout(120000),
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));

        // 额度用完特殊处理（Toast + 内联错误）
        if (response.status === 403 && errorData.code === 'CREDIT_LIMIT_EXCEEDED') {
          console.log('[WatermarkEditor] Credit limit exceeded, showing special error UI');

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

      const data: ApiResponse = await response.json();
      console.log("API response:", data);

      if (data.success && data.imageUrl) {
        console.log("Processing successful:", {
          processingTime: data.processingTime,
          url: data.imageUrl,
        });
        setResultImageUrl(data.imageUrl);
        toast.success(t("watermark_removed_success"));

        // Notify parent component to refresh credits
        if (onProcessingComplete) {
          onProcessingComplete();
        }
      } else {
        throw new Error(data.error || processingT("processing_failed"));
      }
    } catch (error) {
      console.error("Processing failed:", error);

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
  }, [imageFile, isProcessing, processingOptions, t, processingT]);

  // 处理错误警告
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
          {/* 图片预览 */}
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
                onClick={handleProcess}
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
