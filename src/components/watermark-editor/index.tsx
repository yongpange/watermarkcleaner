"use client";

import { useState, useRef, useCallback } from "react";
import { RiDeleteBinLine, RiArrowGoBackLine, RiMagicLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { ToolType, InpaintResponse } from "./types";
import ImageUploader from "./ImageUploader";
import ToolSelector from "./ToolSelector";
import CanvasEditor from "./CanvasEditor";
import ResultDisplay from "./ResultDisplay";

export default function WatermarkEditor() {
  // State
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tool, setTool] = useState<ToolType>("brush");
  const [brushSize, setBrushSize] = useState(30);
  const [hasMask, setHasMask] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Canvas refs
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  // Handle image load
  const handleImageLoad = useCallback((img: HTMLImageElement, file: File) => {
    setImage(img);
    setImageFile(file);
    setResultImageUrl(null);
    setError(null);
    setHasMask(false);
  }, []);

  // Clear mask
  const handleClearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    setHasMask(false);
  }, []);

  // Reset editor
  const handleReset = useCallback(() => {
    setImage(null);
    setImageFile(null);
    setResultImageUrl(null);
    setError(null);
    setHasMask(false);
  }, []);

  // Export mask as black and white PNG
  const exportMask = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) {
        reject(new Error("Mask canvas not found"));
        return;
      }

      // Create a temporary canvas for black/white conversion
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = maskCanvas.width;
      tempCanvas.height = maskCanvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) {
        reject(new Error("Failed to create temp canvas context"));
        return;
      }

      // Fill with black (areas to keep)
      tempCtx.fillStyle = "#000000";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Get mask data
      const maskCtx = maskCanvas.getContext("2d");
      if (!maskCtx) {
        reject(new Error("Failed to get mask canvas context"));
        return;
      }

      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const tempData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      // Convert: if mask pixel has alpha > 0, make it white (remove area)
      for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i + 3] > 0) {
          // Has alpha = marked for removal
          tempData.data[i] = 255;     // R
          tempData.data[i + 1] = 255; // G
          tempData.data[i + 2] = 255; // B
          tempData.data[i + 3] = 255; // A
        }
      }

      tempCtx.putImageData(tempData, 0, 0);

      tempCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create mask blob"));
        }
      }, "image/png");
    });
  }, []);

  // Export original image
  const exportImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const imageCanvas = imageCanvasRef.current;
      if (!imageCanvas) {
        reject(new Error("Image canvas not found"));
        return;
      }

      imageCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create image blob"));
        }
      }, "image/png");
    });
  }, []);

  // Apply changes (call API)
  const handleApplyChanges = useCallback(async () => {
    if (!hasMask || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const [imageBlob, maskBlob] = await Promise.all([exportImage(), exportMask()]);

      const formData = new FormData();
      formData.append("image", imageBlob, "image.png");
      formData.append("mask", maskBlob, "mask.png");

      const response = await fetch("/api/inpaint", {
        method: "POST",
        body: formData,
      });

      const data: InpaintResponse = await response.json();

      if (data.success && data.imageUrl) {
        setResultImageUrl(data.imageUrl);
      } else {
        setError(data.error || "Failed to process image");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  }, [hasMask, isProcessing, exportImage, exportMask]);

  // If we have a result, show it
  if (resultImageUrl) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <ResultDisplay imageUrl={resultImageUrl} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Upload or Edit View */}
      {!image ? (
        <ImageUploader
          onImageLoad={handleImageLoad}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          error={uploadError}
          setError={setUploadError}
        />
      ) : (
        <>
          {/* Tool Selector */}
          <ToolSelector
            activeTool={tool}
            onToolChange={setTool}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
          />

          {/* Canvas Editor */}
          <CanvasEditor
            image={image}
            tool={tool}
            brushSize={brushSize}
            onMaskChange={setHasMask}
            maskCanvasRef={maskCanvasRef}
            imageCanvasRef={imageCanvasRef}
          />

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClearMask} disabled={!hasMask || isProcessing}>
                <RiDeleteBinLine className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
                <RiArrowGoBackLine className="w-4 h-4 mr-2" />
                Upload New
              </Button>
            </div>
            <Button
              size="lg"
              onClick={handleApplyChanges}
              disabled={!hasMask || isProcessing}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 px-8"
            >
              {isProcessing ? (
                <>
                  <RiLoader4Line className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RiMagicLine className="w-5 h-5 mr-2" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

