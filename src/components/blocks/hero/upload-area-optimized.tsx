'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { RiUploadCloud2Line, RiImageLine, RiCloseLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number;
}

// 轻量级动画，使用CSS类而非JavaScript动画
export function UploadArea({ onFileSelect, acceptedFormats = ['.jpg', '.jpeg', '.png', '.webp'], maxSize = 20 }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = async (file: File) => {
    // 验证文件类型
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      alert(`不支持的文件格式。请上传 ${acceptedFormats.join(', ')} 格式的文件。`);
      return;
    }

    // 验证文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`文件大小超过限制。最大支持 ${maxSize}MB。`);
      return;
    }

    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 调用回调函数
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
      {/* 主上传区域 - 优化版本 */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
          "bg-gradient-to-br from-primary/5 via-background to-violet-50/30 dark:from-primary/10 dark:via-background dark:to-indigo-950/20",
          "hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01]",
          isDragging && "border-primary/80 scale-[1.01] shadow-2xl shadow-primary/30",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-500/5 before:to-indigo-500/5 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
          "active:scale-[0.99]"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* 内容区域 */}
        <div className="relative flex flex-col items-center gap-6 p-8 lg:p-12">
          {/* 图标区域 - 简化动画 */}
          <div className={cn(
            "relative flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-full",
            "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
            "shadow-lg shadow-violet-500/30",
            "transition-all duration-300 ease-out",
            "group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-violet-500/50",
            isDragging && "scale-110 shadow-2xl shadow-violet-500/50"
          )}>
            {/* 背景光环 - 简化版 */}
            <div className={cn(
              "absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 blur-xl opacity-0 transition-opacity duration-300",
              "group-hover:opacity-40",
              isDragging && "opacity-60"
            )} />

            {/* 主图标 */}
            <div className="relative z-10 transition-transform duration-300 group-hover:rotate-3">
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
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                  >
                    <RiCloseLine className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <RiUploadCloud2Line className="w-10 h-10 lg:w-12 lg:h-12 transition-transform duration-300 group-hover:scale-110" />
              )}

              {/* 拖拽指示器 - 简化版 */}
              {isDragging && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                  <span className="text-white text-xs font-bold">+</span>
                </div>
              )}
            </div>
          </div>

          {/* 文本内容 */}
          <div className="text-center space-y-2">
            <h3 className={cn(
              "text-xl lg:text-2xl font-bold text-foreground transition-colors duration-300",
              isDragging && "text-violet-600 dark:text-violet-400"
            )}>
              {preview ? '文件已选择' : (isDragging ? '释放文件以上传' : '上传图片文件')}
            </h3>

            <p className="text-muted-foreground text-sm lg:text-base">
              {preview
                ? '文件准备就绪'
                : (isDragging ? '即将开始处理您的图片...' : '拖拽文件到此处，或点击选择文件')
              }
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
              {acceptedFormats.map((format, index) => (
                <React.Fragment key={format}>
                  <span className="px-2 py-1 bg-muted/50 rounded transition-all hover:bg-muted/70">
                    {format.toUpperCase()}
                  </span>
                  {index < acceptedFormats.length - 1 && <span>•</span>}
                </React.Fragment>
              ))}
              <span>•</span>
              <span>最大 {maxSize}MB</span>
            </div>
          </div>

          {/* 按钮区域 - 简化版 */}
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
                "group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-violet-500/40",
                isDragging && "scale-105 shadow-xl shadow-violet-500/40"
              )}
            >
              <RiImageLine className="w-5 h-5 mr-2" />
              选择文件
            </Button>
          )}

          {/* 拖拽提示 - 简化版 */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
            isDragging ? 'opacity-100' : 'opacity-0'
          )}>
            <div className="bg-violet-500/90 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 animate-pulse">
              <span>✨</span> 释放文件开始上传
            </div>
          </div>
        </div>

        {/* 波纹效果 - 简化版 */}
        <div className={cn(
          "absolute inset-0 pointer-events-none",
          "bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.2)_0%,transparent_70%)]",
          "opacity-0 transition-opacity duration-300",
          isDragging && "opacity-100"
        )} />

        {/* 扫描线效果 */}
        <div className={cn(
          "absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent",
          "opacity-0 transition-opacity duration-300",
          isDragging && "opacity-60 animate-pulse"
        )}
          style={{ top: '50%' }}
        />
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.map(format => `image/${format.slice(1)}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* CSS 动画 - 使用 CSS 类而非内联样式 */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulse-ring {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        .float-animation {
          animation: float 3s ease-in-out infinite;
        }

        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        /* 移动端优化 */
        @media (max-width: 768px) {
          .group:hover {
            transform: none;
          }

          .group:hover .group-hover\:scale-110 {
            transform: none;
          }

          .group:hover .group-hover\:shadow-2xl {
            box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.1), 0 4px 6px -2px rgba(124, 58, 237, 0.05);
          }
        }

        /* 减少动画偏好 */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

// 添加额外的效果组件
export function UploadSparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-violet-400 rounded-full animate-pulse"
          style={{
            left: `${20 + i * 30}%`,
            top: `${20 + (i % 2) * 40}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${2 + i * 0.5}s`
          }}
        />
      ))}
    </div>
  );
}

// 添加文件验证提示
export function FileValidationHint({ show, message }: { show: boolean; message: string }) {
  return (
    <div className={cn(
      "absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300",
      show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
    )}>
      {message}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-500" />
    </div>
  );
}

export default UploadArea;