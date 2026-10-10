'use client';

import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RiUploadCloud2Line, RiImageLine, RiCloseLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number;
}

export function UploadArea({ onFileSelect, acceptedFormats = ['.jpg', '.jpeg', '.png', '.webp'], maxSize = 20 }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('convert.dropzone');

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      alert(t('unsupported_file_format', { formats: acceptedFormats.join(', ') }));
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`${t('file_too_large')}: ${t('max_size')} ${maxSize}MB`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onFileSelect(file);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-dashed cursor-pointer transition-all duration-300",
          "bg-muted/30 hover:bg-muted/50",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/50 hover:border-primary/50",
          "active:scale-[0.99]"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="relative flex flex-col items-center gap-4 p-6 lg:p-8">
          <div
            className={cn(
              "relative flex items-center justify-center w-16 h-16 rounded-2xl",
              "bg-gradient-to-br from-primary to-accent text-primary-foreground",
              "transition-all duration-300 ease-out",
              "group-hover:scale-110 group-hover:shadow-glow",
              isDragging && "scale-110 shadow-glow"
            )}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-accent blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
            <div className="relative z-10">
              {preview ? (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPreview();
                    }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-foreground/70 text-background rounded-full flex items-center justify-center hover:bg-foreground transition-colors z-10"
                  >
                    <RiCloseLine className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <RiUploadCloud2Line className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className={cn(
              "text-lg font-semibold text-foreground transition-colors duration-300",
              isDragging && "text-primary"
            )}>
              {preview ? t('file_selected') : (isDragging ? t('release_to_upload') : t('upload_image_file'))}
            </h3>
            <p className="text-muted-foreground text-sm">
              {preview ? t('file_ready') : (isDragging ? t('about_to_process') : t('drag_or_click'))}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70 mt-2">
              {acceptedFormats.map((format, index) => (
                <React.Fragment key={format}>
                  <span className="px-2 py-0.5 bg-muted/60 rounded">{format.toUpperCase()}</span>
                  {index < acceptedFormats.length - 1 && <span>•</span>}
                </React.Fragment>
              ))}
              <span>•</span>
              <span>{t('max_size')} {maxSize}MB</span>
            </div>
          </div>

          {!preview && (
            <Button
              size="default"
              className="relative overflow-hidden rounded-full px-6"
              variant="glow"
            >
              <RiImageLine className="w-4 h-4 mr-2" />
              {t('select_file')}
            </Button>
          )}
        </div>

        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-300",
            isDragging ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            background: 'radial-gradient(circle at center, oklch(0.55 0.12 255 / 0.12) 0%, transparent 70%)',
          }}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.map(format => `image/${format.slice(1)}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default UploadArea;
