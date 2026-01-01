import React, { useState } from 'react';
import { AppleButton } from '@/components/auth/apple-style/button';
import { AppleInput } from '@/components/auth/apple-style/input';

export interface MagicLinkLoginFormProps {
  onBack: () => void;
}

/**
 * 邮箱链接登录表单
 * 用户使用邮箱Magic Link登录
 */
export const MagicLinkLoginForm: React.FC<MagicLinkLoginFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      }
    } catch (error) {
      console.error('Failed to send magic link:', error);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">邮件已发送</h3>
        <p className="text-gray-600">
          我们已向 <span className="font-medium text-gray-900">{email}</span> 发送了登录链接
        </p>
        <p className="text-sm text-gray-500">请检查您的收件箱（包括垃圾邮件）</p>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          我们将向您的邮箱发送一个登录链接
        </p>
        <AppleInput
          label="邮箱地址"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="输入您的邮箱地址"
          fullWidth
        />
      </div>

      <div className="flex gap-3">
        <AppleButton
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={loading}
        >
          返回
        </AppleButton>
        <AppleButton
          type="submit"
          loading={loading}
          disabled={loading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
          fullWidth
        >
          发送登录链接
        </AppleButton>
      </div>
    </form>
  );
};

export default MagicLinkLoginForm;
