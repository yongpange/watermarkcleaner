"use client";

import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { validateFile } from "@/lib/conversion-utils";
import { toast } from "sonner";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // in bytes
  multiple?: boolean;
  className?: string;
}

export default function DropZone({
  onFilesSelected,
  maxSize = 20 * 1024 * 1024, // 20MB default
  multiple = true,
  className,
}: DropZoneProps) {
  const t = useTranslations("convert");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback((files: File[]) => {
    console.log('Processing files:', files.length);

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      console.log('Validating file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const validation = validateFile(file, maxSize);
      if (validation.valid) {
        validFiles.push(file);
        console.log('File is valid:', file.name);
      } else {
        console.error('File validation failed:', file.name, validation.error);
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Show errors
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    // Pass valid files to parent
    if (validFiles.length > 0) {
      console.log('Passing valid files to parent:', validFiles.length);
      onFilesSelected(validFiles);
    } else {
      console.warn('No valid files to process');
    }
  }, [maxSize, onFilesSelected]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      processFiles(files);
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [processFiles]
  );

  const handleClick = () => {
    const input = document.getElementById("file-input") as HTMLInputElement;
    input?.click();
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-gray-300 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-900/50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        id="file-input"
        type="file"
        multiple={multiple}
        accept=".pdf,.docx,.doc,.txt,.md"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center py-16 px-4">
        {/* Icon */}
        <div
          className={cn(
            "mb-6 p-6 rounded-full transition-all duration-200",
            isDragOver
              ? "bg-primary/20 scale-110"
              : "bg-gray-100 dark:bg-gray-800"
          )}
        >
          {isDragOver ? (
            <FileText className="w-12 h-12 text-primary" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          )}
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {isDragOver ? t("dropzone.dragover") : t("dropzone.idle")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("dropzone.supported")}
          </p>
        </div>

        {/* Visual indicator when dragging */}
        {isDragOver && (
          <div className="absolute inset-0 border-4 border-primary rounded-lg pointer-events-none animate-pulse" />
        )}
      </div>
    </div>
  );
}

