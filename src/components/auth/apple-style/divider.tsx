// Apple 风格分隔线组件
// 特点：简洁的文字+线条，毛玻璃背景

import React from 'react';
import { cn } from '@/lib/utils';

export interface AppleDividerProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Apple 风格分隔线
 * 带文字的分隔线，用于分隔不同区域
 */
export const AppleDivider: React.FC<AppleDividerProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center gap-4 my-6', className)}>
      <div className="flex-1 h-px bg-black/10" />
      {children && (
        <span className="text-sm text-gray-500 font-medium px-2">
          {children}
        </span>
      )}
      <div className="flex-1 h-px bg-black/10" />
    </div>
  );
};

/**
 * 简单线条分隔线
 */
export const AppleSimpleDivider: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('h-px bg-black/10 my-6', className)} />
  );
};

export default AppleDivider;
