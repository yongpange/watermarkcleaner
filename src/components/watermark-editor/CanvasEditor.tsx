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

  // 使用 refs 绕过 React state 的异步更新，避免快速拖动时的滞后问题
  const startPointRef = useRef<Point | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  // 使用 ref 存储 handleMouseUp 回调，避免 useEffect 中的循环依赖问题
  const handleMouseUpRef = useRef<() => void>(() => {});

  // 限制预览绘制的频率，避免快速拖动时过度重绘导致性能问题
  const lastPreviewTimeRef = useRef<number>(0);
  const PREVIEW_THROTTLE_MS = 16; // 约60fps

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

  // 添加全局 mouseup 事件监听，当用户在画布外释放鼠标时完成绘制
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      // 如果正在绘制且鼠标左键被释放，则完成当前绘制
      if (isDrawing) {
        handleMouseUpRef.current();
      }
    };

    // 使用捕获阶段监听，确保在其他事件之前捕获 mouseup
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDrawing]);

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

  // Utils: Calculate rectangle coordinates with pixel-perfect alignment
  const calculatePixelPerfectRect = useCallback((start: Point, end: Point) => {
    // 确保使用整数坐标，避免抗锯齿导致的模糊和位置偏差
    const x = Math.round(Math.min(start.x, end.x));
    const y = Math.round(Math.min(start.y, end.y));
    const width = Math.round(Math.abs(end.x - start.x));
    const height = Math.round(Math.abs(end.y - start.y));

    return { x, y, width, height };
  }, []);

  // Normalize alpha values to exactly 50% for all drawn areas
  const normalizeAlpha = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;

    // 遍历所有像素，将已绘制区域的alpha统一设置为128（50%不透明度）
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        data[i] = 128; // 强制设置为50%不透明度
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [maskCanvasRef]);

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
      ctx.strokeStyle = "rgb(0, 100, 255)"; // 使用纯色绘制，不透明

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

      const { x, y, width, height } = calculatePixelPerfectRect(start, end);

      ctx.fillStyle = "rgb(0, 100, 255)"; // 使用纯色绘制，不透明
      ctx.fillRect(x, y, width, height);
    },
    [maskCanvasRef, calculatePixelPerfectRect]
  );

  const fillLasso = useCallback(
    (points: Point[]) => {
      if (points.length < 3) return;
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "rgb(0, 100, 255)"; // 使用纯色绘制，不透明
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
      // 同步更新 ref 和 state，确保快速拖动时不会出现滞后
      startPointRef.current = point;
      lastPointRef.current = point;

      setIsDrawing(true);
      setLastPoint(point);
      setStartPoint(point);

      if (tool === "lasso") {
        setLassoPoints([point]);
      } else if (tool === "brush" || tool === "eraser") {
        drawBrushStroke(point, point, tool === "eraser");
      }
    },
    [getCanvasPoint, tool, drawBrushStroke, fillRectangle]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const point = getCanvasPoint(e);
      setCursorPos(point);

      if (!isDrawing) return;

      // 实时更新 lastPointRef，不依赖 React state 的异步更新
      lastPointRef.current = point;

      if (tool === "brush" || tool === "eraser") {
        if (lastPoint) {
          drawBrushStroke(lastPoint, point, tool === "eraser");
        }
        setLastPoint(point);
      } else if (tool === "rectangle") {
        // 对于矩形工具，限制预览绘制的频率，避免过度重绘
        // 这样可以减少浏览器负担，防止丢帧和绘制延迟
        const now = Date.now();
        if (now - lastPreviewTimeRef.current < PREVIEW_THROTTLE_MS) {
          // 更新 lastPoint state 但不重绘，让鼠标光标能正常跟随
          setLastPoint(point);
          return;
        }
        lastPreviewTimeRef.current = now;

        if (startPoint) {
          // 清除画布并绘制矩形预览
          const maskCanvas = maskCanvasRef.current;
          if (maskCanvas) {
            const ctx = maskCanvas.getContext("2d");
            if (ctx) {
              // 从当前历史记录重新绘制
              if (historyIndex >= 0 && history[historyIndex]) {
                ctx.putImageData(history[historyIndex].imageData, 0, 0);
              } else {
                ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
              }
              // 绘制预览矩形 - 使用与最终绘制完全相同的坐标
              const { x, y, width, height } = calculatePixelPerfectRect(startPoint, point);

              // 在相同区域上绘制虚线预览边框
              // 虚线边框完全绘制在矩形内部，确保尺寸与最终 fillRect 完全一致
              ctx.strokeStyle = "rgba(0, 100, 255, 0.9)";
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              // 绘制在像素边界上，避免抗锯齿
              ctx.rect(x + 0.5, y + 0.5, width - 1, height - 1);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
        setLastPoint(point);
      } else if (tool === "lasso") {
        setLassoPoints((prev) => [...prev, point]);
        // Draw lasso preview
        const maskCanvas = maskCanvasRef.current;
        if (maskCanvas) {
          const ctx = maskCanvas.getContext("2d");
          if (ctx && lastPoint) {
            ctx.strokeStyle = "rgba(0, 100, 255, 0.5)";
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
    [isDrawing, tool, lastPoint, startPoint, getCanvasPoint, drawBrushStroke, maskCanvasRef, historyIndex, history, calculatePixelPerfectRect]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // 使用 refs 中的实时坐标，避免 React state 异步更新导致的滞后问题
    if (tool === "brush" || tool === "eraser") {
      // Brush和eraser在鼠标抬起时规范化透明度
      normalizeAlpha();
    } else if (tool === "rectangle" && startPointRef.current && lastPointRef.current) {
      fillRectangle(startPointRef.current, lastPointRef.current);
      normalizeAlpha(); // 规范化透明度
    } else if (tool === "lasso" && lassoPoints.length > 2) {
      fillLasso(lassoPoints);
      normalizeAlpha(); // 规范化透明度
    }

    // 清空 refs 和 state
    startPointRef.current = null;
    lastPointRef.current = null;
    setLassoPoints([]);
    setStartPoint(null);
    setLastPoint(null);
    saveToHistory();
    onMaskChange(checkMaskContent());
  }, [isDrawing, tool, lassoPoints, fillRectangle, fillLasso, saveToHistory, onMaskChange, checkMaskContent, normalizeAlpha]);

  // 更新 handleMouseUpRef，使其始终指向最新的 handleMouseUp 函数
  // 这样可以避免在 useEffect 中出现循环依赖问题
  useEffect(() => {
    handleMouseUpRef.current = handleMouseUp;
  }, [handleMouseUp]);

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
              // 当鼠标离开画布时，不自动完成绘制，只隐藏光标预览
              // 对于套索和矩形工具，用户需要明确释放鼠标左键才能完成绘制
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

