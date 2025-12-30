'use client';

import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RiUploadCloud2Line, RiImageLine, RiCloseLine, RiFlashlightLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number;
}

// 文件类型图标映射
const fileTypeIcons = {
  '.jpg': '🖼️',
  '.jpeg': '🖼️',
  '.png': '🎨',
  '.webp': '⚡'
};

export function UploadArea({ onFileSelect, acceptedFormats = ['.jpg', '.jpeg', '.png', '.webp'], maxSize = 20 }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 鼠标跟踪效果
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.currentTarget as Element)?.getBoundingClientRect();
      if (rect) {
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        });
      }
    };

    const element = document.getElementById('upload-area');
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      return () => element.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

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

    setIsProcessing(true);

    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);

    // 调用回调函数
    onFileSelect(file);
  };

  const clearPreview = () => {
    setPreview(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative mx-auto max-w-2xl">
      {/* 背景装饰效果 - 带有鼠标跟踪 */}
      <div
        className={cn(
          "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600",
          "opacity-0 group-hover:opacity-75 blur transition-all duration-300",
          isDragging && "opacity-100 blur-md"
        )}
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(124, 58, 237, 0.3), transparent 70%)`,
        }}
      />

      {/* 主上传区域 */}
      <div
        id="upload-area"
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
            <motion.div
              key={i}
              className={cn(
                "absolute w-1 h-1 bg-violet-400 rounded-full",
                isDragging && "opacity-60"
              )}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                opacity: isDragging ? [0.6, 0.2, 0.6] : 0,
                scale: isDragging ? [1, 1.5, 1] : 0,
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="upload"
              className="relative flex flex-col items-center gap-6 p-8 lg:p-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
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
                <motion.div
                  className="relative z-10"
                  animate={{
                    rotate: isDragging ? [0, 10, -10, 0] : 0,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <RiUploadCloud2Line className={cn(
                    "w-10 h-10 lg:w-12 lg:h-12 transition-all duration-300",
                    (isDragging || isHovered) && "scale-110"
                  )} />

                  {/* 上传动画指示器 */}
                  {isDragging && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <span className="text-white text-xs">+</span>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* 文本内容 */}
              <div className="text-center space-y-2">
                <motion.h3
                  className={cn(
                    "text-xl lg:text-2xl font-bold text-foreground",
                    isDragging && "text-violet-600 dark:text-violet-400"
                  )}
                  animate={{ scale: isDragging ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDragging ? '释放文件以上传' : '上传图片文件'}
                </motion.h3>

                <p className="text-muted-foreground text-sm lg:text-base">
                  {isDragging
                    ? '即将开始处理您的图片...'
                    : '拖拽文件到此处，或点击选择文件'
                  }
                </p>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
                  {acceptedFormats.map((format, index) => (
                    <React.Fragment key={format}>
                      <span className="px-2 py-1 bg-muted/50 rounded transition-all hover:bg-muted/70">
                        {fileTypeIcons[format as keyof typeof fileTypeIcons]} {format.toUpperCase()}
                      </span>
                      {index < acceptedFormats.length - 1 && <span>•</span>}
                    </React.Fragment>
                  ))}
                  <span>•</span>
                  <span>最大 {maxSize}MB</span>
                </div>
              </div>

              {/* 按钮区域 */}
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
                选择文件
              </Button>

              {/* 拖拽提示 */}
              <AnimatePresence>
                {isDragging && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="bg-violet-500/90 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2">
                      <RiFlashlightLine className="w-5 h-5" />
                      释放文件开始上传
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              className="relative flex flex-col items-center gap-6 p-8 lg:p-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* 预览区域 */}
              <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-violet-500/30">
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
                  className="absolute -top-2 -right-2 w-8 h-8 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors shadow-lg"
                >
                  <RiCloseLine className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl lg:text-2xl font-bold text-violet-600 dark:text-violet-400">
                  文件已选择
                </h3>
                <p className="text-muted-foreground">
                  准备开始处理您的图片
                </p>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  正在处理...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
    </div>
  );
}

// 额外的动画效果
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

// 添加扫描线效果
export function ScanLineEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-pulse"
        style={{
          animation: 'scan-line 3s linear infinite',
          top: '50%'
        }}
      />
      <style jsx>{`
        @keyframes scan-line {
          0% {
            transform: translateY(-100vh);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// 添加文件类型图标组件
export function FileTypeBadge({ format }: { format: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs transition-all hover:bg-muted/70">
      <span>{fileTypeIcons[format as keyof typeof fileTypeIcons] || '📄'}</span>
      <span className="font-medium">{format.toUpperCase()}</span>
    </div>
  );
}

// 添加波纹动画组件
export function RippleEffect({ isActive }: { isActive: boolean }) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", isActive ? 'block' : 'hidden')}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-2xl border-2 border-violet-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.05 + i * 0.05, opacity: 0 }}
          transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// 添加文件大小显示组件
export function FileSizeIndicator({ size, maxSize }: { size: number; maxSize: number }) {
  const percentage = (size / (maxSize * 1024 * 1024)) * 100;
  const isLarge = percentage > 80;

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isLarge ? 'bg-red-500' : 'bg-violet-500'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={cn(isLarge && 'text-red-500 font-medium')}>
        {(size / (1024 * 1024)).toFixed(1)}MB
      </span>
    </div>
  );
}

// 添加文件统计组件
export function UploadStats({ files = 0, totalSize = 0 }: { files?: number; totalSize?: number }) {
  return (
    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-violet-500 rounded-full" />
        <span>{files} 个文件</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
        <span>{(totalSize / (1024 * 1024)).toFixed(1)}MB</span>
      </div>
    </div>
  );
}

// 添加进度条组件
export function UploadProgress({ progress, status }: { progress: number; status: 'uploading' | 'processing' | 'complete' }) {
  const statusColors = {
    uploading: 'bg-blue-500',
    processing: 'bg-violet-500',
    complete: 'bg-green-500'
  };

  const statusTexts = {
    uploading: '正在上传...',
    processing: '正在处理...',
    complete: '上传完成！'
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{statusTexts[status]}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full transition-all duration-300", statusColors[status])}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default UploadArea;