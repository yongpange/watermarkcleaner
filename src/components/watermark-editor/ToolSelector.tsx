"use client";

import { RiBrushLine, RiShape2Line, RiEraserLine } from "react-icons/ri";
import { Lasso } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolType } from "./types";
import { Slider } from "@/components/ui/slider";

interface ToolSelectorProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}

const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  { id: "brush", label: "Brush", icon: <RiBrushLine className="w-5 h-5" /> },
  { id: "rectangle", label: "Rectangle", icon: <RiShape2Line className="w-5 h-5" /> },
  { id: "lasso", label: "Lasso", icon: <Lasso className="w-5 h-5" /> },
  { id: "eraser", label: "Eraser", icon: <RiEraserLine className="w-5 h-5" /> },
];

export default function ToolSelector({
  activeTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
}: ToolSelectorProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-background/80 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm">
      {/* Tool Selection */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Tools</p>
        <div className="flex gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
                activeTool === tool.id
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={tool.label}
            >
              {tool.icon}
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brush Size Slider */}
      {(activeTool === "brush" || activeTool === "eraser") && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">
              {activeTool === "brush" ? "Brush" : "Eraser"} Size
            </p>
            <span className="text-sm font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
              {brushSize}px
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[brushSize]}
              min={5}
              max={100}
              step={1}
              onValueChange={(value) => onBrushSizeChange(value[0])}
              className="flex-1"
            />
          </div>
        </div>
      )}

      {/* Tool Instructions */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        {activeTool === "brush" && (
          <p>🖌️ Paint over the watermark area you want to remove</p>
        )}
        {activeTool === "rectangle" && (
          <p>▢ Click and drag to draw a rectangle around the watermark</p>
        )}
        {activeTool === "lasso" && (
          <p>📏 Draw a freehand selection around the watermark area</p>
        )}
        {activeTool === "eraser" && (
          <p>🧹 Erase parts of the mask you&apos;ve drawn</p>
        )}
      </div>
    </div>
  );
}

