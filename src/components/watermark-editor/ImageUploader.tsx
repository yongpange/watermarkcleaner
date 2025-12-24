"use client";

import { useCallback } from "react";
import { RiUploadCloud2Line, RiImageLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement, file: File) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function ImageUploader({
  onImageLoad,
  isDragging,
  setIsDragging,
  error,
  setError,
}: ImageUploaderProps) {
  const t = useTranslations("convert.image");
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return t("invalid_file_type");
    }
    if (file.size > MAX_FILE_SIZE) {
      return t("file_too_large", { size: "20MB" });
    }
    return null;
  }, [t]);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          onImageLoad(img, file);
        };
        img.onerror = () => {
          setError(t("image_load_failed"));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        setError(t("file_read_failed"));
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad, setError, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile, setIsDragging]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [setIsDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    },
    [setIsDragging]
  );

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_TYPES.join(",");
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFile(file);
      }
    };
    input.click();
  }, [handleFile]);

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[400px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/10 dark:bg-primary/20"
          : "border-muted bg-card/50 hover:border-primary hover:bg-accent/50"
      )}
    >
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div
          className={cn(
            "flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300",
            isDragging
              ? "bg-violet-500 text-white scale-110"
              : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
          )}
        >
          <RiUploadCloud2Line className="w-8 h-8" />
        </div>

        <div>
          <p className="text-lg font-semibold text-foreground mb-1">
            {isDragging ? t("drag_image_here") : t("click_or_drag")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("supports_jpeg_png_webp")}
          </p>
        </div>

        <button
          type="button"
          className="mt-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-violet-500/25 transition-all duration-200 flex items-center gap-2"
        >
          <RiImageLine className="w-5 h-5" />
          {t("upload_image")}
        </button>

        {error && (
          <p className="text-sm text-error mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}

