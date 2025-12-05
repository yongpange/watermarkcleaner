"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ConversionProgressProps {
  progress: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
}

export default function ConversionProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  showPercentage = true,
}: ConversionProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* SVG Circle Progress */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300 ease-in-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage ? (
          <>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(progress)}%
            </span>
            <Loader2 className="w-4 h-4 text-primary animate-spin mt-1" />
          </>
        ) : (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        )}
      </div>
    </div>
  );
}

