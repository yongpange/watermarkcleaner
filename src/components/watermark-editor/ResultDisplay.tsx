"use client";

import { useState, useRef } from "react";
import { RiDownloadLine, RiRefreshLine, RiZoomInLine, RiZoomOutLine, RiImageAddLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ImageUploader from "./ImageUploader";

interface ResultDisplayProps {
  originalImageUrl: string;  // 新增：原图URL
  resultImageUrl: string;    // 修改：从imageUrl改为resultImageUrl
  onReset: () => void;
  onUploadNew?: () => void;  // 新增：上传新图片的回调
}

export default function ResultDisplay({
  originalImageUrl,
  resultImageUrl,
  onReset,
}: ResultDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeImage, setActiveImage] = useState<'original' | 'result'>('result');  // 新增：当前显示的图片
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeImageUrl = activeImage === 'result' ? resultImageUrl : originalImageUrl;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // 创建a标签直接下载（绕过CORS限制）
      const a = document.createElement("a");
      a.href = activeImageUrl;
      a.download = `watermark-removed-${Date.now()}.png`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // 清理
      setTimeout(() => {
        URL.revokeObjectURL(activeImageUrl);
      }, 100);
    } catch (error) {
      console.error("Download failed:", error);

      // 提供备用方案
      alert("直接下载失败。请尝试右键点击图片并选择\"图片另存为\"来保存图片。");

      // 打开新窗口让用户可以右键保存
      window.open(activeImageUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUploadNew = () => {
    // 触发隐藏的file input
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // 调用onReset清除当前状态
          onReset();

          // 创建一个模拟的ImageLoad事件
          // 由于组件结构限制，这里直接触发上传逻辑
          const fakeEvent = {
            target: {
              files: [file]
            }
          } as any;

          // 触发父组件的图片加载逻辑
          // 由于组件层级，我们需要重新加载页面或使用状态管理
          // 这里使用最简单的方式：刷新页面
          window.location.reload();
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* 主图片显示区域 */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-success">✓</span>
            {activeImage === 'result' ? 'Watermark Removed Successfully!' : 'Original Image'}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              disabled={zoom <= 0.5}
            >
              <RiZoomOutLine className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
              disabled={zoom >= 2}
            >
              <RiZoomInLine className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative w-full overflow-auto">
          <div
            className="flex items-center justify-center p-4"
            style={{ minHeight: 400 }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center",
                transition: "transform 0.2s ease",
              }}
            >
              <img
                src={activeImageUrl}
                alt={activeImage === 'result' ? 'Result' : 'Original'}
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: '500px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 缩略图和按钮区域 */}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {/* 原图缩略图 */}
        <div className="flex flex-col items-center gap-2">
          <div
            onClick={() => setActiveImage('original')}
            className={cn(
              "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
              "hover:shadow-lg",
              activeImage === 'original'
                ? "border-primary shadow-primary/20 shadow-md"
                : "border-transparent hover:border-border",
              "w-24 h-24"  // 固定尺寸，确保一致
            )}
          >
            <img
              src={originalImageUrl}
              alt="Original Thumbnail"
              className="w-full h-full object-cover"
            />
            <div className={cn(
              "absolute inset-0 bg-primary/20 transition-opacity",
              activeImage === 'original' ? "opacity-100" : "opacity-0"
            )} />
          </div>
          <span className="text-xs text-muted-foreground">原图</span>
        </div>

        {/* 处理后的图片缩略图 */}
        <div className="flex flex-col items-center gap-2">
          <div
            onClick={() => setActiveImage('result')}
            className={cn(
              "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
              "hover:shadow-lg",
              activeImage === 'result'
                ? "border-primary shadow-primary/20 shadow-md"
                : "border-transparent hover:border-border",
              "w-24 h-24"  // 固定尺寸，确保一致
            )}
          >
            <img
              src={resultImageUrl}
              alt="Result Thumbnail"
              className="w-full h-full object-cover"
            />
            <div className={cn(
              "absolute inset-0 bg-primary/20 transition-opacity",
              activeImage === 'result' ? "opacity-100" : "opacity-0"
            )} />
          </div>
          <span className="text-xs text-muted-foreground">处理后</span>
        </div>

        {/* 上传新图片按钮（与缩略图同大小） */}
        <div className="flex flex-col items-center gap-2">
          <div
            onClick={handleUploadNew}
            className={cn(
              "cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
              "hover:shadow-lg hover:border-primary/50",
              "w-24 h-24",  // 与缩略图相同尺寸
              "flex items-center justify-center",
              "bg-muted border-border hover:bg-primary/10"
            )}
          >
            <div className="flex flex-col items-center justify-center">
              <RiImageAddLine className="w-6 h-6 text-primary mb-1" />
              <span className="text-xs text-primary font-medium">新图片</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">上传新图</span>
        </div>

        {/* 隐藏的file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 操作按钮区域 */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
        {/* 重置按钮 */}
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className="flex items-center gap-2 min-w-[180px] justify-center"
        >
          <RiRefreshLine className="w-5 h-5" />
          Process Another Image
        </Button>

        {/* 下载按钮 */}
        <Button
          size="lg"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 min-w-[180px] justify-center"
        >
          <RiDownloadLine className="w-5 h-5" />
          {isDownloading ? "Downloading..." : "Download Image"}
        </Button>
      </div>
    </div>
  );
}
