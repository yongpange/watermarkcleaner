"use client";

import { useState, useRef } from "react";
import { RiDownloadLine, RiRefreshLine, RiZoomInLine, RiZoomOutLine, RiImageAddLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import ComparisonSlider from "@/components/ui/comparison-slider";
import { motion } from "framer-motion";

interface ResultDisplayProps {
  originalImageUrl: string;
  resultImageUrl: string;
  onReset: () => void;
}

export default function ResultDisplay({
  originalImageUrl,
  resultImageUrl,
  onReset,
}: ResultDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'result' | 'compare'>('result');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("convert.watermark_removal");
  const imageT = useTranslations("convert.image");

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const a = document.createElement("a");
      a.href = resultImageUrl;
      a.download = `watermark-removed-${Date.now()}.png`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      alert("直接下载失败。请尝试右键点击图片并选择\"图片另存为\"来保存图片。");
      window.open(resultImageUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUploadNew = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = () => {
    onReset();
    window.location.reload();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Main display */}
      <div className="bg-card rounded-3xl border border-border p-4 lg:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10 text-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {viewMode === 'result' ? t('watermark_removed_successfully') : imageT('compare_result')}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('result')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'result' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('processed')}
              </button>
              <button
                onClick={() => setViewMode('compare')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'compare' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {imageT('compare')}
              </button>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                disabled={zoom <= 0.5}
                className="h-8 w-8 rounded-lg"
              >
                <RiZoomOutLine className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                disabled={zoom >= 2}
                className="h-8 w-8 rounded-lg"
              >
                <RiZoomInLine className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative w-full overflow-auto rounded-2xl bg-muted/30 min-h-[400px] flex items-center justify-center p-4">
          {viewMode === 'compare' ? (
            <ComparisonSlider
              beforeImage={originalImageUrl}
              afterImage={resultImageUrl}
              beforeLabel={imageT('original_image')}
              afterLabel={t('processed')}
              className="w-full max-w-3xl shadow-xl"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center",
                transition: "transform 0.2s ease",
              }}
            >
              <img
                src={resultImageUrl}
                alt="Result"
                className="max-w-full h-auto rounded-xl shadow-2xl"
                style={{ maxHeight: '500px' }}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Filmstrip thumbnails */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          onClick={() => setViewMode('compare')}
          className={cn(
            "flex flex-col items-center gap-2 group",
            viewMode === 'compare' ? "opacity-100" : "opacity-70 hover:opacity-100"
          )}
        >
          <div className={cn(
            "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
            viewMode === 'compare' ? "border-primary shadow-glow" : "border-transparent group-hover:border-border"
          )}>
            <img src={originalImageUrl} alt="Original" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs text-muted-foreground">{imageT('compare')}</span>
        </button>

        <button
          onClick={() => setViewMode('result')}
          className={cn(
            "flex flex-col items-center gap-2 group",
            viewMode === 'result' ? "opacity-100" : "opacity-70 hover:opacity-100"
          )}
        >
          <div className={cn(
            "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
            viewMode === 'result' ? "border-primary shadow-glow" : "border-transparent group-hover:border-border"
          )}>
            <img src={resultImageUrl} alt="Result" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs text-muted-foreground">{t('processed')}</span>
        </button>

        <button
          onClick={handleUploadNew}
          className="flex flex-col items-center gap-2 group opacity-70 hover:opacity-100"
        >
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-border group-hover:border-primary/50 flex items-center justify-center bg-card transition-all">
            <div className="flex flex-col items-center">
              <RiImageAddLine className="w-6 h-6 text-primary mb-1" />
              <span className="text-xs text-primary font-medium">{t('new')}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{t('upload_new_image')}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className="flex items-center gap-2 min-w-[180px] justify-center"
        >
          <RiRefreshLine className="w-5 h-5" />
          {t('process_another_image')}
        </Button>

        <Button
          size="lg"
          variant="glow"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 min-w-[180px] justify-center"
        >
          <RiDownloadLine className="w-5 h-5" />
          {isDownloading ? t('downloading') : t('download_image')}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
