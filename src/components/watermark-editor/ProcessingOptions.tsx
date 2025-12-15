"use client";

import { useState } from "react";
import { RiSettings3Line } from "react-icons/ri";
import { cn } from "@/lib/utils";

export type ProcessingMode = "auto" | "conservative" | "aggressive";

export interface ProcessingOptions {
  mode: ProcessingMode;
  prompt?: string;
  enhanceQuality?: boolean;
  seed?: number;
}

interface ProcessingOptionsProps {
  value: ProcessingOptions;
  onChange?: (options: ProcessingOptions) => void;
  compact?: boolean;
  className?: string;
}

export default function ProcessingOptions({
  value,
  onChange,
  compact = false,
  className,
}: ProcessingOptionsProps) {
  const [expanded, setExpanded] = useState(false);

  const getModeDescription = (mode: ProcessingMode): string => {
    switch (mode) {
      case "conservative":
        return "保守模式：避免过度处理，保持原图最大完整性";
      case "aggressive":
        return "激进模式：彻底移除所有痕迹，包括半透明水印";
      default:
        return "自动模式：自动平衡处理强度和质量";
    }
  };

  return (
    <div className={cn("bg-gray-50 dark:bg-gray-800/50 rounded-lg", className)}>
      {/* 简洁模式：只显示当前模式 */}
      {compact ? (
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">处理模式:</div>
              <div className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded text-xs font-medium">
                {value.mode === "auto" ? "自动" : value.mode === "conservative" ? "保守" : "激进"}
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1"
            >
              <RiSettings3Line className="w-4 h-4" />
              {expanded ? "收起" : "展开"}
            </button>
          </div>
        </div>
      ) : (
        // 完整模式：显示所有选项
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <RiSettings3Line className="w-5 h-5 text-violet-600" />
            <h3 className="font-medium text-foreground">处理选项</h3>
          </div>

          {/* 处理模式选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">处理模式</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onChange?.({ ...value, mode: "auto" })}
                className={cn(
                  "p-3 rounded-lg border text-left transition-colors",
                  value.mode === "auto"
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-400"
                )}
              >
                <div className="font-medium mb-1">自动</div>
                <div className="text-xs text-muted-foreground">平衡质量和速度</div>
              </button>

              <button
                onClick={() => onChange?.({ ...value, mode: "conservative" })}
                className={cn(
                  "p-3 rounded-lg border text-left transition-colors",
                  value.mode === "conservative"
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-400"
                )}
              >
                <div className="font-medium mb-1">保守</div>
                <div className="text-xs text-muted-foreground">避免过度处理</div>
              </button>

              <button
                onClick={() => onChange?.({ ...value, mode: "aggressive" })}
                className={cn(
                  "p-3 rounded-lg border text-left transition-colors",
                  value.mode === "aggressive"
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-400"
                )}
              >
                <div className="font-medium mb-1">激进</div>
                <div className="text-xs text-muted-foreground">彻底移除水印</div>
              </button>
            </div>

            {/* 当前模式说明 */}
            <div className="mt-2 p-3 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
              <div className="text-sm text-violet-800 dark:text-violet-200">
                {getModeDescription(value.mode)}
              </div>
            </div>
          </div>

          {/* 自定义Prompt（高级选项） */}
          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-2">
              <span className="inline-block w-3">→</span>
              高级选项（自定义指令）
            </summary>
            <div className="mt-3 space-y-2 pl-5">
              <textarea
                value={value.prompt || ""}
                onChange={(e) => onChange?.({ ...value, prompt: e.target.value })}
                placeholder="输入自定义指令（可选）\n例如：仅移除右下角的半透明水印，保留其他文字"
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                留空将使用默认的AI优化指令
              </p>
            </div>
          </details>
        </div>
      )}

      {/* 展开/收起区域 */}
      {compact && expanded && (
        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <ProcessingOptions
            value={value}
            onChange={onChange}
            compact={false}
          />
        </div>
      )}
    </div>
  );
}
