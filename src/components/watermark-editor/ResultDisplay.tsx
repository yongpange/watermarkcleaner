"use client";

import { useState } from "react";
import { RiDownloadLine, RiRefreshLine, RiZoomInLine, RiZoomOutLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";

interface ResultDisplayProps {
  imageUrl: string;
  onReset: () => void;
}

export default function ResultDisplay({ imageUrl, onReset }: ResultDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watermark-removed-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-green-500">✓</span>
          Watermark Removed Successfully!
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

      {/* Result Image */}
      <div className="relative w-full overflow-auto bg-gray-100 dark:bg-gray-900 rounded-xl border border-border/50">
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
              src={imageUrl}
              alt="Result"
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <RiRefreshLine className="w-5 h-5" />
          Process Another Image
        </Button>
        <Button
          size="lg"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25"
        >
          <RiDownloadLine className="w-5 h-5" />
          {isDownloading ? "Downloading..." : "Download Image"}
        </Button>
      </div>
    </div>
  );
}

