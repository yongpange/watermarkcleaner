'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('convert.dropzone');

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
      const file = files[0];
      handleFile(file);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // 验证文件类型
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      alert(t('unsupported_file_format', { formats: acceptedFormats.join(', ') }));
      return;
    }

    // 验证文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`${t('file_too_large')}: ${t('max_size')} ${maxSize}MB`);
      return;
    }

    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 回调函数
    onFileSelect(file);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative mx-auto max-w-2xl">
      {/* 背景装饰效果 */}
      <div className={cn(
        "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600",
        "opacity-0 group-hover:opacity-75 blur transition-all duration-300",
        isDragging && "opacity-100 blur-md"
      )} />

      {/* 主上传区域 */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
          "bg-gradient-to-br from-primary/5 via-background to-violet-50/30 dark:from-primary/10 dark:via-background dark:to-indigo-950/20",
          "hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02]",
          isDragging && "border-primary/80 scale-[1.02] shadow-2xl shadow-primary/30",
          isHovered && "border-primary/60",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-500/5 before:to-indigo-500/5",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-100",
          "after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]",
          "after:opacity-0 after:transition-opacity after:duration-500",
          isDragging && "after:opacity-100"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 动态光效 */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-violet-400/20 via-transparent to-indigo-400/20",
          "translate-x-[-100%] transition-transform duration-700 ease-in-out",
          (isDragging || isHovered) && "translate-x-[100%]"
        )} />

        {/* 粒子效果 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-1 h-1 bg-violet-400 rounded-full opacity-0",
                "animate-pulse",
                isDragging && "opacity-60"
              )}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + i * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* 内容区域 */}
        <div className="relative flex flex-col items-center gap-6 p-8 lg:p-12">
          {/* 图标区域 */}
          <div className={cn(
            "relative flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-full",
            "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
            "shadow-lg shadow-violet-500/30",
            "transition-all duration-300",
            (isDragging || isHovered) && "scale-110 shadow-2xl shadow-violet-500/50"
          )}>
            {/* 背景光环 */}
            <div className={cn(
              "absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400",
              "blur-xl opacity-0 transition-opacity duration-300",
              (isDragging || isHovered) && "opacity-60"
            )} />

            {/* 主图标 */}
            {preview ? (
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearPreview();
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <RiCloseLine className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <RiUploadCloud2Line className={cn(
                  "w-10 h-10 lg:w-12 lg:h-12 transition-all duration-300",
                  (isDragging || isHovered) && "scale-110"
                )} />

                {/* 上传动画指示器 */}
                {isDragging && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-white text-xs">+</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 文本内容 */}
          <div className="text-center space-y-2">
            <h3 className={cn(
              "text-xl lg:text-2xl font-bold text-foreground transition-all duration-300",
              (isDragging || isHovered) && "text-violet-600 dark:text-violet-400"
            )}>
              {isDragging ? t('release_to_upload') : preview ? t('file_selected') : t('upload_image_file')}
            </h3>

            <p className="text-muted-foreground text-sm lg:text-base">
              {preview
                ? t('file_ready')
                : t('drag_or_click')
              }
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
              <span className="px-2 py-1 bg-muted/50 rounded">
                {acceptedFormats.join(' ')}
              </span>
              <span>•</span>
              <span>{t('max_size')}: {maxSize}MB</span>
            </div>
          </div>

          {/* 按钮区域 */}
          {!preview && (
            <Button
              size="lg"
              className={cn(
                "relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600",
                "hover:from-violet-700 hover:to-indigo-700",
                "text-white shadow-lg shadow-violet-500/25",
                "px-8 py-6 text-lg font-semibold",
                "transition-all duration-300",
                "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent",
                "before:translate-x-[-100%] before:transition-transform before:duration-700",
                "hover:before:translate-x-[100%]",
                (isDragging || isHovered) && "scale-105 shadow-2xl shadow-violet-500/40"
              )}
            >
              <RiImageLine className="w-5 h-5 mr-2" />
              {t('select_file')}
            </Button>
          )}

          {/* 拖拽提示 */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-violet-500/90 text-white px-6 py-3 rounded-lg font-medium animate-in fade-in duration-300">
                {t('release_to_start_upload')}
              </div>
            </div>
          )}
        </div>

        {/* 波纹效果 */}
        <div className={cn(
          "absolute inset-0 pointer-events-none",
          "bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.2)_0%,transparent_70%)]",
          "opacity-0 transition-opacity duration-300",
          isDragging && "opacity-100"
        )} />
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.map(format => `image/${format.slice(1)}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* CSS 动画 */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(124, 58, 237, 0.4),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

// 添加一些辅助动画效果
export function UploadEffects() {
  return (
    <style jsx global>{`
      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      @keyframes pulse-ring {
        0% {
          transform: scale(0.8);
          opacity: 1;
        }
        100% {
          transform: scale(1.2);
          opacity: 0;
        }
      }

      .float-animation {
        animation: float 3s ease-in-out infinite;
      }

      .pulse-ring {
        animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
      }
    `}</style>
  );
}