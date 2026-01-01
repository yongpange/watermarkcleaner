import React, { useState, useEffect } from 'react';
import { AppleInput } from '@/components/auth/apple-style/input';
import { AppleButton } from '@/components/auth/apple-style/button';
import { cn } from '@/lib/utils';

export interface EmailInputSectionProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSendCode: () => Promise<void>;
  onUserExistsChange?: (exists: boolean | null) => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
}

/**
 * 邮箱输入区域组件
 * 包含邮箱输入框、发送验证码按钮、用户存在性检查
 */
export const EmailInputSection: React.FC<EmailInputSectionProps> = ({
  email,
  onEmailChange,
  onSendCode,
  onUserExistsChange,
  loading = false,
  disabled = false,
  error,
}) => {
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // 检查用户是否存在
  useEffect(() => {
    const validateEmail = async (email: string) => {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setUserExists(null);
        return;
      }

      setChecking(true);
      try {
        const response = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        setUserExists(data.exists);
        onUserExistsChange?.(data.exists);
      } catch (error) {
        // 静默处理错误
        setUserExists(null);
      } finally {
        setChecking(false);
      }
    };

    // 防抖：延迟500ms检查
    const timeoutId = setTimeout(() => {
      validateEmail(email);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email]);

  const canSendCode = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !checking && !disabled;

  // 动态按钮文本
  const getButtonText = () => {
    if (checking) return '检查中...';
    if (userExists === true) return '发送登录验证码';
    if (userExists === false) return '发送注册验证码';
    return '发送验证码';
  };

  return (
    <div className="space-y-4">
      <AppleInput
        label="邮箱地址"
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="输入您的邮箱地址"
        disabled={disabled}
        error={error}
        fullWidth
      />

      {/* 状态提示 */}
      {userExists !== null && !checking && email && (
        <div className={cn(
          'text-sm',
          userExists ? 'text-blue-600' : 'text-green-600'
        )}>
          {userExists
            ? '✓ 检测到已有账户，将发送登录验证码'
            : '欢迎新用户，将发送注册验证码'
          }
        </div>
      )}

      <AppleButton
        onClick={onSendCode}
        loading={loading}
        disabled={!canSendCode}
        fullWidth
        className="mt-2"
      >
        <span>{getButtonText()}</span>
      </AppleButton>
    </div>
  );
};

export default EmailInputSection;
