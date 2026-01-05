import React, { useState, useEffect } from 'react';
import { AppleInput } from '@/components/auth/apple-style/input';
import { AppleButton } from '@/components/auth/apple-style/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('auth.email_input');

  const handleUserExistsChange = React.useCallback((exists: boolean | null) => {
    onUserExistsChange?.(exists);
  }, [onUserExistsChange]);

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
        handleUserExistsChange(data.exists);
      } catch {
        // 静默处理错误
        setUserExists(null);
        handleUserExistsChange(null);
      } finally {
        setChecking(false);
      }
    };

    // 防抖：延迟500ms检查
    const timeoutId = setTimeout(() => {
      validateEmail(email);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email, handleUserExistsChange]);

  const canSendCode = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !checking && !disabled;

  // 动态按钮文本
  const getButtonText = () => {
    if (checking) return t('checking');
    if (userExists === true) return t('send_login_code');
    if (userExists === false) return t('send_register_code');
    return t('send_code');
  };

  return (
    <div className="space-y-4">
      <AppleInput
        label={t('email_label')}
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder={t('email_placeholder')}
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
            ? t('existing_user')
            : t('new_user')
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
