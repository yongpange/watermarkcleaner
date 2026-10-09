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
import ProcessingOptions from "./ProcessingOptions";
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

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const API_ENDPOINT = USE_MOCK_API ? '/api/mock-seededit' : '/api/seededit';

export default function WatermarkEditor({ onProcessingComplete }: WatermarkEditorProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [processingOptions, setProcessingOptions] = useState<ProcessOptions>({ mode: "auto" });
  const [selectedRatio, setSelectedRatio] = useState<string>("default");

  const t = useTranslations("convert.watermark_removal");
  const processingT = useTranslations("convert.processing");
  const imageT = useTranslations("convert.image");

  const autoProcessRef = useRef(false);
  const sampleProcessedRef = useRef(false);

  const searchParams = useSearchParams();
  const isFromUpload = searchParams.get('fromUpload') === 'true';
  const isFromSample = searchParams.get('fromSample') === 'true';
  const pendingImage = useUploadStore(state => state.pendingImage);
  const clearPendingImage = useUploadStore(state => state.clearPendingImage);
  const sampleId = useUploadStore(state => state.sampleId);
  const clearSampleId = useUploadStore(state => state.clearSampleId);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[WatermarkEditor] API mode: ${USE_MOCK_API ? 'MOCK' : 'REAL'} (${API_ENDPOINT})`);
  }

  const getTimestamp = () => new Date().toISOString();

  const handleImageLoad = useCallback((img: HTMLImageElement, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setImageFile(file);
    setImageMetadata({ width: img.width, height: img.height });
    setResultImageUrl(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (isFromUpload && pendingImage) {
      handleImageLoad(pendingImage.image, pendingImage.file);
      clearPendingImage();

      const shouldAutoProcess = searchParams.get('autoProcess') === 'true';
      if (shouldAutoProcess) {
        autoProcessRef.current = true;
      }

      window.history.replaceState({}, '', '/convert');
      toast.success(imageT('image_load_success'));
    }
  }, [isFromUpload, pendingImage, handleImageLoad, clearPendingImage, searchParams, imageT]);

  useEffect(() => {
    if (isFromSample && sampleId && !sampleProcessedRef.current) {
      sampleProcessedRef.current = true;
      const sample = getSampleImageById(sampleId);
      if (!sample) {
        clearSampleId();
        return;
      }

      setImagePreviewUrl(sample.before);
      fetch(sample.before)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `sample-${sample.id}.webp`, { type: 'image/webp' });
          setImageFile(file);
          setImageMetadata({ width: 800, height: 600 });

          setIsProcessing(true);
          setError(null);

          setTimeout(() => {
            setResultImageUrl(sample.after);
            setIsProcessing(false);
            toast.success(t('watermark_removed_success'));
          }, 10000);
        })
        .catch(() => {
          setIsProcessing(false);
        });

      window.history.replaceState({}, '', '/convert');
      clearSampleId();
    }
  }, [isFromSample, sampleId, clearSampleId, t]);

  const handleRemoveImage = useCallback(() => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setImageFile(null);
    setImageMetadata(null);
    setResultImageUrl(null);
  }, [imagePreviewUrl]);

  const handleReset = useCallback(() => {
    handleRemoveImage();
    setProcessingOptions({ mode: "auto" });
  }, [handleRemoveImage]);

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
        buffer = lines.pop() || '';

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

  const handleProcess = useCallback(async (useStreaming = true) => {
    if (!imageFile || isProcessing) return;

    let targetSize = selectedRatio;
    if (selectedRatio === 'default' && imageMetadata) {
      targetSize = `${imageMetadata.width}x${imageMetadata.height}`;
    } else if (selectedRatio === 'default') {
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
      const formData = new FormData();
      formData.append("image", imageFile, imageFile.name);
      formData.append("mode", processingOptions.mode);
      formData.append("size", targetSize);
      formData.append("stream", useStreaming ? "true" : "false");

      if (processingOptions.prompt) {
        formData.append("prompt", processingOptions.prompt);
      }

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
        credentials: 'include',
        signal: AbortSignal.timeout(120000),
      });

      const contentType = response.headers.get('content-type') || '';
      const isStreaming = contentType.includes('text/event-stream');

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const text = await response.text();
          errorData = { error: "Failed to parse API response", details: text, raw: text };
        }

        if (response.status === 403 && errorData.code === 'CREDIT_LIMIT_EXCEEDED') {
          toast.error(errorData.error, {
            duration: 8000,
            icon: '⚠️',
            style: {
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
            },
          });

          setError(
            <div className="space-y-4">
              <div>
                <p className="font-medium text-destructive mb-2">{errorData.details}</p>
                <div className="text-sm text-destructive/80">
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
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium shadow-glow"
                >
                  {t("upgrade_to_pro_button")}
                </button>
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition font-medium text-foreground"
                >
                  {t("try_again_later")}
                </button>
              </div>
            </div>
          );

          setIsProcessing(false);
          return;
        }

        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      if (isStreaming) {
        let finalImageUrl: string | null = null;
        let finalUsage: any = null;

        await parseSSEStream(response, (event) => {
          switch (event.type) {
            case 'image_generation.partial_succeeded':
              if (event.url) {
                finalImageUrl = event.url;
              } else if (event.b64_json) {
                finalImageUrl = `data:image/jpeg;base64,${event.b64_json}`;
              }
              break;
            case 'image_generation.completed':
              if (event.usage) {
                finalUsage = event.usage;
              }
              break;
            case 'error':
              throw new Error(event.message || 'Stream processing error');
          }
        });

        if (finalImageUrl) {
          setResultImageUrl(finalImageUrl);
          toast.success(t("watermark_removed_success"));
          onProcessingComplete?.();
        } else {
          throw new Error('No image generated from stream');
        }

        setIsProcessing(false);
        return;
      }

      const data: ApiResponse = await response.json();
      if (data.success && data.imageUrl) {
        setResultImageUrl(data.imageUrl);
        toast.success(t("watermark_removed_success"));
        onProcessingComplete?.();
      } else {
        throw new Error(data.error || processingT("processing_failed"));
      }
    } catch (error) {
      let errorMessage = processingT("processing_failed");
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.includes("timeout")) errorMessage = t("timeout_error");
      else if (errorMessage.includes("Rate limit")) errorMessage = t("rate_limit_error");
      else if (errorMessage.includes("Unsupported format")) errorMessage = t("unsupported_format_error");

      setError(errorMessage);
      toast.error(t("watermark_removal_failed"));
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, isProcessing, imageMetadata, processingOptions, selectedRatio, t, processingT, onProcessingComplete, parseSSEStream]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (autoProcessRef.current && imageFile && !isProcessing && !resultImageUrl) {
      autoProcessRef.current = false;
      handleProcess(true);
    }
  }, [imageFile, isProcessing, resultImageUrl, handleProcess]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  if (resultImageUrl) {
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

            {isProcessing && (
              <div className="absolute inset-0 rounded-2xl bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-10">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" style={{ animationDuration: '2s' }} />
                </div>
                <p className="text-lg font-medium text-foreground">{t("generating")}</p>
                <p className="text-sm text-muted-foreground mt-1">{processingT("please_wait")}</p>

                {/* Scanning line */}
                <div className="absolute inset-x-8 top-8 bottom-8 overflow-hidden rounded-xl pointer-events-none">
                  <div
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
                    style={{
                      animation: 'scan 2s ease-in-out infinite',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <RiCloseCircleLine className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-destructive-foreground text-sm">
                  <p className="font-medium mb-1">{processingT("processing_failed")}</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          <ProcessingOptions
            value={processingOptions}
            onChange={setProcessingOptions}
            compact
          />

          <div className="pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isProcessing}
              >
                <RiImageAddLine className="w-4 h-4 mr-2" />
                {imageT("upload_new_image")}
              </Button>

              <Button
                size="lg"
                variant="glow"
                onClick={() => handleProcess(true)}
                disabled={isProcessing || !imageFile}
                className="px-8 min-w-[200px] disabled:cursor-not-allowed"
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

            {isProcessing && (
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
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

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
