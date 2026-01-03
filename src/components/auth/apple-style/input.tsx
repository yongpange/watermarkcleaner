// Apple 风格输入框组件
// 特点：毛玻璃效果、聚焦动画、错误状态

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface AppleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Apple 风格输入框
 * 支持标签、错误提示、图标
 */
export const AppleInput = React.forwardRef<HTMLInputElement, AppleInputProps>(
  ({ className, label, error, icon, fullWidth, disabled, ...props }, ref) => (
    <div className={cn(fullWidth && 'w-full', 'flex flex-col gap-1.5')}>
      {label && (
        <label className="text-sm font-medium text-gray-900">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full',
            'px-4 py-3',
            'bg-black/5',
            'border rounded-xl',
            'border-black/10',
            'text-gray-900',
            'placeholder:text-gray-400',
            'backdrop-blur-sm',
            'transition-all duration-200',
            'focus:outline-none',
            'focus:border-blue-400',
            'focus:ring-4',
            'focus:ring-blue-100',
            'disabled:cursor-not-allowed',
            'disabled:opacity-60',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
            className
          )}
          {...props}
        />

        {icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {error && (
        <span className="text-sm text-red-600 font-medium">
          {error}
        </span>
      )}
    </div>
  )
);

AppleInput.displayName = 'AppleInput';

/**
 * 验证码输入框（6个独立输入框）
 */
export interface AppleCodeInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export const AppleCodeInput: React.FC<AppleCodeInputProps> = ({
  value,
  onChange,
  onComplete,
  error,
  disabled,
}) => {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    // 只允许数字
    if (digit && !/^\d$/.test(digit)) return;

    const newValue = [...value];
    newValue[index] = digit;
    onChange(newValue);

    // 自动跳转到下一个
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 如果输入完成，触发完成回调
    const code = newValue.join('');
    if (code.length === 6 && onComplete) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Backspace 删除当前并返回上一个
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newValue = [...value];

      if (value[index]) {
        // 如果当前有值，删除当前
        newValue[index] = '';
      } else if (index > 0) {
        // 如果当前为空，返回上一个并删除
        newValue[index - 1] = '';
        inputRefs.current[index - 1]?.focus();
      }

      onChange(newValue);
    }

    // 左右箭头键切换
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');

    // 只提取数字
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits) {
      const newValue = digits.split('');
      onChange(newValue);

      // 聚焦到最后一个输入框
      const lastIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();

      // 如果完成，触发回调
      if (digits.length === 6 && onComplete) {
        onComplete(digits);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            ref={(el: HTMLInputElement | null) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={disabled}
            className={cn(
              'w-12 h-14',
              'text-center',
              'text-2xl',
              'font-semibold',
              'bg-black/5',
              'border rounded-xl',
              'border-black/10',
              'text-gray-900',
              'transition-all duration-200',
              'focus:outline-none',
              'focus:border-blue-400',
              'focus:ring-4',
              'focus:ring-blue-100',
              'disabled:cursor-not-allowed',
              'disabled:opacity-60',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
              'shadow-sm'
            )}
          />
        ))}
      </div>

      {error && (
        <span className="text-sm text-red-600 font-medium text-center">
          {error}
        </span>
      )}
    </div>
  );
};

AppleCodeInput.displayName = 'AppleCodeInput';

export default AppleInput;
