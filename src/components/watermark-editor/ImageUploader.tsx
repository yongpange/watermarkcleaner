"use client";

import { useCallback, useState } from "react";
import { RiUploadCloud2Line, RiImageLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement, file: File) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function ImageUploader({
  onImageLoad,
  isDragging,
  setIsDragging,
  error,
  setError,
}: ImageUploaderProps) {
  const t = useTranslations("convert.image");
  const [isHovered, setIsHovered] = useState(false);

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
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        onImageLoad(img, file);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setError(t("image_load_failed"));
      };

      img.src = objectUrl;
    },
    [onImageLoad, setError, validateFile, t]
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[420px] rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden group",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/5",
        "shadow-sm hover:shadow-md"
      )}
    >
      {/* Animated dashed border glow on drag */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          isDragging ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: "radial-gradient(circle at center, oklch(0.55 0.12 255 / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5 p-10 text-center">
        <motion.div
          animate={{
            scale: isDragging ? 1.1 : isHovered ? 1.05 : 1,
            y: isDragging ? -4 : 0,
          }}
          transition={{ duration: 0.25 }}
          className={cn(
            "flex items-center justify-center w-20 h-20 rounded-2xl transition-colors duration-300",
            isDragging
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          )}
        >
          <RiUploadCloud2Line className="w-9 h-9" />
        </motion.div>

        <div className="space-y-2">
          <p className="text-xl font-semibold text-foreground">
            {isDragging ? t("drag_image_here") : t("click_or_drag")}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            {t("supports_jpeg_png_webp")}
          </p>
        </div>

        <button
          type="button"
          className={cn(
            "mt-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0"
          )}
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
