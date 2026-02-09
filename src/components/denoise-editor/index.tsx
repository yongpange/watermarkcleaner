"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUploadStore } from "@/store/uploadStore";
import { toast } from "react-hot-toast";
import { RiCloseCircleLine, RiImageAddLine, RiMagicLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import ImageUploader from "@/components/watermark-editor/ImageUploader";
import ImagePreview from "@/components/watermark-editor/ImagePreview";
import ResultDisplay from "@/components/watermark-editor/ResultDisplay";
import { useTranslations } from "next-intl";

interface ProcessOptions {
  mode: "auto";
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

interface DenoiseEditorProps {
  onProcessingComplete?: () => void;
}

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const API_ENDPOINT = USE_MOCK_API ? '/api/mock-seededit' : '/api/seededit';

export default function DenoiseEditor({ onProcessingComplete }: DenoiseEditorProps) {
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

  // Translations namespace for denoise
  const t = useTranslations("denoise");
  const commonT = useTranslations("convert.image");
  const processingT = useTranslations("convert.processing");

  // Format timestamp helper
  const getTimestamp = () => new Date().toISOString();

  // Zustand store for uploaded images
  const searchParams = useSearchParams();
  const isFromUpload = searchParams.get('fromUpload') === 'true';
  const pendingImage = useUploadStore(state => state.pendingImage);
  const clearPendingImage = useUploadStore(state => state.clearPendingImage);

  // Image upload handler
  const handleImageLoad = useCallback((img: HTMLImageElement, file: File) => {
    console.log("Loading image:", file.name, file.size);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setImageFile(file);
    setImageMetadata({ width: img.width, height: img.height });
    setResultImageUrl(null);
    setError(null);
  }, []);

  // Auto-load image from store
  useEffect(() => {
    if (isFromUpload && pendingImage) {
      handleImageLoad(pendingImage.image, pendingImage.file);
      clearPendingImage();
      window.history.replaceState({}, '', '/denoise'); // Clean URL
      toast.success(commonT('image_load_success'));
    }
  }, [isFromUpload, pendingImage, handleImageLoad, clearPendingImage, commonT]);

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
    if (!imageFile || isProcessing) return;

    // Default to preserving original size for Denoise
    let targetSize = "1024x1024";
    if (imageMetadata) {
       targetSize = `${imageMetadata.width}x${imageMetadata.height}`;
    }

    const timestamp = getTimestamp();
    console.log(`[Denoise Editor] [${timestamp}] Starting image processing...`, {
      fileName: imageFile.name,
      targetSize
    });

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile, imageFile.name);
      formData.append("mode", processingOptions.mode);
      formData.append("feature", "denoise"); // Set feature to denoise
      formData.append("size", targetSize);

      if (processingOptions.prompt) {
        formData.append("prompt", processingOptions.prompt);
      }

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));

        if (response.status === 403 && errorData.code === 'CREDIT_LIMIT_EXCEEDED') {
          toast.error(errorData.error);
          setIsProcessing(false);
          return;
        }

        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.imageUrl) {
        setResultImageUrl(data.imageUrl);
        toast.success(t("process_success"));
        if (onProcessingComplete) onProcessingComplete();
      } else {
        throw new Error(data.error || processingT("processing_failed"));
      }
    } catch (error) {
      console.error(`[Denoise Editor] Processing failed:`, error);
      let errorMessage = processingT("processing_failed");
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(t("process_failed"));
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, isProcessing, imageMetadata, processingOptions, t, processingT, onProcessingComplete]);

  // Cleanup
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
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

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between gap-4">
              <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
                <RiImageAddLine className="w-4 h-4 mr-2" />
                {commonT("upload_new_image")}
              </Button>

              <Button
                size="lg"
                onClick={handleProcess}
                disabled={isProcessing || !imageFile}
                className="bg-primary text-primary-foreground shadow-lg px-8 min-w-[200px]"
              >
                {isProcessing ? (
                  <>
                    <RiLoader4Line className="w-5 h-5 mr-2 animate-spin" />
                    {t("processing")}
                  </>
                ) : (
                  <>
                    <RiMagicLine className="w-5 h-5 mr-2" />
                    {t("start_denoise")}
                  </>
                )}
              </Button>
            </div>

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
