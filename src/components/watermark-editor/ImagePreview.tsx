"use client";

import { useState } from "react";
import { RiCloseLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

interface ImagePreviewProps {
  imageUrl: string;
  file?: File;
  metadata?: {
    width: number;
    height: number;
    size: string;
    type: string;
  };
  onRemove?: () => void;
  className?: string;
}

export default function ImagePreview({
  imageUrl,
  file,
  metadata,
  onRemove,
  className,
}: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const t = useTranslations("convert.image");

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Canvas workspace */}
      <div className="relative w-full rounded-2xl border border-border bg-muted/50 p-4 lg:p-8">
        {imageError ? (
          <div className="flex flex-col items-center justify-center w-full h-64 rounded-xl bg-card">
            <div className="text-muted-foreground mb-2">{t("image_load_failed")}</div>
            <button
              onClick={() => setImageError(false)}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <div className="relative flex items-center justify-center min-h-[280px]">
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-full h-auto max-h-[480px] object-contain rounded-xl shadow-lg"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {onRemove && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRemove}
            className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-background backdrop-blur-md rounded-full border border-border shadow-sm transition-colors"
            title={t("remove_image")}
          >
            <RiCloseLine className="w-4 h-4 text-foreground" />
          </motion.button>
        )}
      </div>

      {/* Metadata pills */}
      {(file || metadata) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {file && (
            <div className="px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground">
              <span className="text-foreground font-medium truncate max-w-[160px] inline-block align-bottom">
                {file.name}
              </span>
            </div>
          )}
          {file && (
            <div className="px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </div>
          )}
          {metadata && (
            <>
              <div className="px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground font-mono">
                {metadata.width} × {metadata.height}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground uppercase">
                {metadata.type.split("/")[1]}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
