import React, { useState } from 'react';
import { AppleCodeInput } from '@/components/auth/apple-style/input';
import { AppleButton } from '@/components/auth/apple-style/button';

export interface VerificationCodeInputProps {
  onVerify: (code: string) => Promise<void>;
  onResend: () => void;
  countdown: number; // 倒计时秒数，0表示可以重新发送
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  className?: string;
  email: string; // 显示邮箱地址
}

/**
 * 验证码输入区域组件
 * 包含6位验证码输入框、重新发送按钮、提交按钮
 */
export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  onVerify,
  onResend,
  countdown,
  loading = false,
  disabled = false,
  error,
  email,
}) => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);

  // 处理验证码完成
  const handleCodeComplete = (completedCode: string) => {
    // 自动提交（可选）
    onVerify(completedCode);
  };

  // 手动提交
  const handleSubmit = async () => {
    const codeString = code.join('');
    if (codeString.length === 6) {
      await onVerify(codeString);
    }
  };

  // 是否可以提交（验证码完整）
  const canSubmit = code.filter(Boolean).length === 6;

  return (
    <div className="space-y-4">
      {/* 提示信息 */}
      <div className="text-center text-sm text-gray-600">
        <p>验证码已发送到</p>
        <p className="font-medium text-gray-900">{email}</p>
      </div>

      {/* 验证码输入框 */}
      <AppleCodeInput
        value={code}
        onChange={setCode}
        onComplete={handleCodeComplete}
        error={error}
        disabled={loading}
      />

      {/* 重新发送按钮 */}
      <div className="flex justify-center">
        {countdown > 0 ? (
          <span className="text-sm text-gray-500">
            重新发送 ({countdown}s)
          </span>
        ) : (
          <button
            onClick={onResend}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            重新发送验证码
          </button>
        )}
      </div>

      {/* 提交按钮 */}
      <AppleButton
        onClick={handleSubmit}
        loading={loading}
        disabled={!canSubmit || loading || disabled}
        fullWidth
      >
        验证并登录
      </AppleButton>
    </div>
  );
};

export default VerificationCodeInput;
