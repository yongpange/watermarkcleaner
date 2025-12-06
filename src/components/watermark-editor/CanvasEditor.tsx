"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { ToolType, Point, HistoryEntry } from "./types";
import { cn } from "@/lib/utils";

interface CanvasEditorProps {
  image: HTMLImageElement | null;
  tool: ToolType;
  brushSize: number;
  onMaskChange: (hasMask: boolean) => void;
  maskCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const MAX_HISTORY = 50;

export default function CanvasEditor({
  image,
  tool,
  brushSize,
  onMaskChange,
  maskCanvasRef,
  imageCanvasRef,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0, scale: 1 });
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  // Calculate canvas dimensions to fit container while maintaining aspect ratio
  const calculateDimensions = useCallback(() => {
    if (!image || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const maxHeight = 600;
    const aspectRatio = image.width / image.height;

    let displayWidth = containerWidth;
    let displayHeight = displayWidth / aspectRatio;

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * aspectRatio;
    }

    const scale = displayWidth / image.width;

    setCanvasDimensions({
      width: image.width,
      height: image.height,
      scale,
    });

    return { displayWidth, displayHeight, scale };
  }, [image]);

  // Initialize canvases when image loads
  useEffect(() => {
    if (!image) return;

    const dims = calculateDimensions();
    if (!dims) return;

    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!imageCanvas || !maskCanvas) return;

    // Set actual canvas size (full resolution)
    imageCanvas.width = image.width;
    imageCanvas.height = image.height;
    maskCanvas.width = image.width;
    maskCanvas.height = image.height;

    // Draw image on image canvas
    const imageCtx = imageCanvas.getContext("2d");
    if (imageCtx) {
      imageCtx.drawImage(image, 0, 0);
    }

    // Clear mask canvas (transparent = keep, will be converted to black on export)
    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) {
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }

    // Reset history
    setHistory([]);
    setHistoryIndex(-1);
    onMaskChange(false);
  }, [image, calculateDimensions, imageCanvasRef, maskCanvasRef, onMaskChange]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ imageData, timestamp: Date.now() });
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex, maskCanvasRef]);

  // Check if mask has any content
  const checkMaskContent = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return false;

    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true;
    }
    return false;
  }, [maskCanvasRef]);

  // Get mouse position relative to canvas (accounting for scale)
  const getCanvasPoint = useCallback(
    (e: React.MouseEvent): Point => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / canvasDimensions.scale;
      const y = (e.clientY - rect.top) / canvasDimensions.scale;

      return { x, y };
    },
    [canvasDimensions.scale, maskCanvasRef]
  );

  // Draw functions
  const drawBrushStroke = useCallback(
    (from: Point, to: Point, erase: boolean = false) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;

      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize;
      ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [brushSize, maskCanvasRef]
  );

  const fillRectangle = useCallback(
    (start: Point, end: Point) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(x, y, width, height);
    },
    [maskCanvasRef]
  );

  const fillLasso = useCallback(
    (points: Point[]) => {
      if (points.length < 3) return;
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    },
    [maskCanvasRef]
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const point = getCanvasPoint(e);
      setIsDrawing(true);
      setLastPoint(point);
      setStartPoint(point);

      if (tool === "lasso") {
        setLassoPoints([point]);
      } else if (tool === "brush" || tool === "eraser") {
        drawBrushStroke(point, point, tool === "eraser");
      }
    },
    [getCanvasPoint, tool, drawBrushStroke]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const point = getCanvasPoint(e);
      setCursorPos(point);

      if (!isDrawing) return;

      if (tool === "brush" || tool === "eraser") {
        if (lastPoint) {
          drawBrushStroke(lastPoint, point, tool === "eraser");
        }
        setLastPoint(point);
      } else if (tool === "lasso") {
        setLassoPoints((prev) => [...prev, point]);
        // Draw lasso preview
        const maskCanvas = maskCanvasRef.current;
        if (maskCanvas) {
          const ctx = maskCanvas.getContext("2d");
          if (ctx && lastPoint) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
          }
        }
        setLastPoint(point);
      }
    },
    [isDrawing, tool, lastPoint, getCanvasPoint, drawBrushStroke, maskCanvasRef]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === "rectangle" && startPoint && lastPoint) {
      fillRectangle(startPoint, lastPoint);
    } else if (tool === "lasso" && lassoPoints.length > 2) {
      fillLasso(lassoPoints);
    }

    setLassoPoints([]);
    setStartPoint(null);
    setLastPoint(null);
    saveToHistory();
    onMaskChange(checkMaskContent());
  }, [isDrawing, tool, startPoint, lastPoint, lassoPoints, fillRectangle, fillLasso, saveToHistory, onMaskChange, checkMaskContent]);

  // Cursor style based on tool
  const getCursorStyle = useCallback(() => {
    if (tool === "brush" || tool === "eraser") return "none";
    if (tool === "rectangle") return "crosshair";
    if (tool === "lasso") return "crosshair";
    return "default";
  }, [tool]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden",
        !image && "min-h-[400px]"
      )}
      style={{ minHeight: image ? canvasDimensions.height * canvasDimensions.scale : 400 }}
    >
      {image && (
        <div
          className="relative"
          style={{
            width: canvasDimensions.width * canvasDimensions.scale,
            height: canvasDimensions.height * canvasDimensions.scale,
          }}
        >
          <canvas
            ref={imageCanvasRef}
            className="absolute top-0 left-0"
            style={{
              width: canvasDimensions.width * canvasDimensions.scale,
              height: canvasDimensions.height * canvasDimensions.scale,
            }}
          />
          <canvas
            ref={maskCanvasRef}
            className="absolute top-0 left-0"
            style={{
              width: canvasDimensions.width * canvasDimensions.scale,
              height: canvasDimensions.height * canvasDimensions.scale,
              cursor: getCursorStyle(),
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              handleMouseUp();
              setCursorPos(null);
            }}
          />
          {/* Brush cursor preview */}
          {(tool === "brush" || tool === "eraser") && cursorPos && (
            <div
              className="absolute pointer-events-none border-2 border-white rounded-full"
              style={{
                left: cursorPos.x * canvasDimensions.scale - brushSize * canvasDimensions.scale / 2,
                top: cursorPos.y * canvasDimensions.scale - brushSize * canvasDimensions.scale / 2,
                width: brushSize * canvasDimensions.scale,
                height: brushSize * canvasDimensions.scale,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

