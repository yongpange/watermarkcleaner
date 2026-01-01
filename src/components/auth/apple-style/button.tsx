// Apple 风格按钮组件（Apple Design Style）
// 特点：圆角、毛玻璃、渐变、阴影效果

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'social';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
}

/**
 * Apple 风格按钮组件
 * 支持多种变体：主要按钮、次要按钮、幽灵按钮、社交按钮
 */
export const AppleButton = React.forwardRef<HTMLButtonElement, AppleButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    loading = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = [
      'relative',
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'transition-all',
      'duration-300',
      'ease-in-out',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-400',
      'focus:ring-offset-2',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'select-none',
    ];

    const variantStyles = {
      primary: [
        'bg-blue-500',
        'text-white',
        'rounded-xl',
        'shadow-md',
        'hover:bg-blue-600',
        'hover:shadow-lg',
        'active:scale-[0.98]',
        'backdrop-blur-sm',
      ],
      secondary: [
        'bg-black/5',
        'text-gray-900',
        'rounded-xl',
        'border',
        'border-black/10',
        'hover:bg-black/10',
        'active:scale-[0.98]',
        'backdrop-blur-sm',
      ],
      ghost: [
        'bg-transparent',
        'text-gray-900',
        'rounded-xl',
        'hover:bg-black/5',
        'active:scale-[0.98]',
      ],
      social: [
        'bg-white',
        'text-gray-800',
        'rounded-xl',
        'border',
        'border-gray-200',
        'shadow-sm',
        'hover:bg-gray-50',
        'hover:shadow-md',
        'active:scale-[0.98]',
        'backdrop-blur-sm',
      ],
    };

    const sizeStyles = {
      small: ['px-3', 'py-2', 'text-sm', 'rounded-lg'],
      medium: ['px-4', 'py-3', 'text-base', 'rounded-xl'],
      large: ['px-6', 'py-4', 'text-lg', 'rounded-xl'],
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          'min-h-12',
          className
        )}
        {...props}
      >
        {/* 加载动画 */}
        {loading && (
          <>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
            </span>
            <span className="opacity-0">{children}</span>
          </>
        )}

        {/* 正常内容 */}
        {!loading && (
          <span className="flex items-center justify-center gap-2">
            {children}
          </span>
        )}
      </button>
    );
  }
);

AppleButton.displayName = 'AppleButton';

/**
 * 圆形图标按钮（用于关闭、返回等）
 */
export const AppleIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center',
      'h-10 w-10 rounded-full',
      'bg-black/5 hover:bg-black/10',
      'text-gray-800 hover:text-gray-900',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-blue-400',
      'backdrop-blur-sm',
      'active:scale-95',
      className
    )}
    {...props}
  />
));

AppleIconButton.displayName = 'AppleIconButton';

export default AppleButton;
