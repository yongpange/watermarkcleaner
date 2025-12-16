"use client";

import { useState } from "react";
import { RiCloseLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getImageDimensions = (): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* 图片预览 */}
      <div className="relative w-full">
        {imageError ? (
          <div className="flex flex-col items-center justify-center w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 mb-2">Failed to load image</div>
            <button
              onClick={() => setImageError(false)}
              className="text-violet-600 hover:text-violet-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-auto max-h-96 object-contain rounded-lg shadow-md bg-gray-100 dark:bg-gray-800"
            onError={() => setImageError(true)}
          />
        )}

        {/* 移除按钮 */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 rounded-full shadow-lg transition-colors"
            title="Remove image"
          >
            <RiCloseLine className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* 图片信息 */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {file && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">文件名:</span>
              <span className="font-medium text-foreground truncate">{file.name}</span>
            </div>
          )}

          {file && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">大小:</span>
              <span className="font-medium text-foreground">{formatFileSize(file.size)}</span>
            </div>
          )}

          {metadata && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">尺寸:</span>
                <span className="font-medium text-foreground">
                  {metadata.width} × {metadata.height}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">类型:</span>
                <span className="font-medium text-foreground">
                  {metadata.type.split("/")[1]?.toUpperCase()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
