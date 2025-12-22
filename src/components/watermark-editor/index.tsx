"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUploadStore } from "@/store/uploadStore";
import { toast } from "react-hot-toast";
import { RiCloseCircleLine, RiImageAddLine, RiMagicLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import ImageUploader from "./ImageUploader";
import ImagePreview from "./ImagePreview";
import ProcessingOptions, { ProcessingMode } from "./ProcessingOptions";
import ResultDisplay from "./ResultDisplay";

interface ProcessOptions {
  mode: ProcessingMode;
  prompt?: string;
}

interface ApiResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  details?: string;
  processingTime?: number;
}

export default function WatermarkEditor() {
  // State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingOptions, setProcessingOptions] = useState<ProcessOptions>({
    mode: "auto",
  });

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

      toast.success('图片加载成功！');
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

      console.log("Sending request to /api/seededit...");
      const response = await fetch("/api/seededit", {
        method: "POST",
        body: formData,
        // Set timeout at fetch level (2 minutes)
        signal: AbortSignal.timeout(120000),
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
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
        toast.success("水印移除成功！");
      } else {
        throw new Error(data.error || "处理失败");
      }
    } catch (error) {
      console.error("Processing failed:", error);

      let errorMessage = "处理失败";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // 根据错误消息提供更多上下文
      if (errorMessage.includes("timeout")) {
        errorMessage = "处理超时，图片可能过大或网络连接较慢。";
      } else if (errorMessage.includes("Rate limit")) {
        errorMessage = "请求频率过高，请稍后再试。";
      } else if (errorMessage.includes("Unsupported format")) {
        errorMessage = "不支持的图片格式，请使用 JPG、PNG 或 WebP。";
      }

      setError(errorMessage);
      toast.error("水印移除失败");
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, isProcessing, processingOptions]);

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
          error={error}
          setError={setError}
        />
      ) : (
        <>
          {/* 图片预览 */}
          <ImagePreview
            imageUrl={imagePreviewUrl!}
            file={imageFile}
            metadata={{
              width: imageMetadata?.width || 0,
              height: imageMetadata?.height || 0,
              size: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
              type: imageFile.type,
            }}
            onRemove={handleRemoveImage}
          />

          {/* 处理选项 */}
          <div className="transition-all duration-300">
            <ProcessingOptions
              value={processingOptions}
              onChange={setProcessingOptions}
              compact={false}
            />
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-4 bg-destructive/10 border-destructive rounded-lg">
              <div className="flex items-start gap-3">
                <RiCloseCircleLine className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-destructive-foreground text-sm">
                  <p className="font-medium mb-1">处理失败</p>
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
                  上传新图片
                </Button>
              </div>

              <Button
                size="lg"
                onClick={handleProcess}
                disabled={isProcessing || !imageFile}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 px-8 min-w-[200px]"
              >
                {isProcessing ? (
                  <>
                    <RiLoader4Line className="w-5 h-5 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <RiMagicLine className="w-5 h-5 mr-2" />
                    开始去水印
                  </>
                )}
              </Button>
            </div>

            {/* 处理提示 */}
            {isProcessing && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-primary flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                  正在使用AI智能识别并移除水印，请稍候...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  处理时间取决于图片大小，一般在30秒到2分钟之间
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
