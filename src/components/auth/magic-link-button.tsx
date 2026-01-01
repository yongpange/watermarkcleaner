import React from 'react';
import { AppleButton } from '@/components/auth/apple-style/button';

/**
 * 邮箱链接登录按钮
 * 点击后切换到Magic Link登录模式
 */

export interface MagicLinkLoginButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const MagicLinkLoginButton: React.FC<MagicLinkLoginButtonProps> = ({ onClick, disabled }) => (
  <AppleButton
    variant="secondary"
    onClick={onClick}
    disabled={disabled}
    fullWidth
  >
    <span className="flex items-center justify-center">
      <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span>使用邮箱链接登录</span>
    </span>
  </AppleButton>
);

export default MagicLinkLoginButton;
