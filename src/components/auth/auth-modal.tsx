import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppleIconButton } from '@/components/auth/apple-style/button';
import { AppleDivider } from '@/components/auth/apple-style/divider';
import { EmailInputSection } from '@/components/auth/email-input-section';
import VerificationCodeInput from '@/components/auth/verification-code-input';
import { GoogleLoginButton } from '@/components/auth/google-login-button';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 主认证弹窗组件
 * 支持邮箱验证码登录/注册、Google登录
 */
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('auth');
  const tModal = useTranslations('sign_modal');

  // 状态管理
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  // 当打开弹窗时重置状态
  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmail('');
      setError(null);
      setLoading(false);
      setCountdown(0);
      setUserExists(null);
    }
  }, [isOpen]);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email) {
      setError(t('errors.enter_email'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 根据用户是否存在决定 purpose
      const purpose = userExists ? 'login' : 'register';
      
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          purpose,
          locale: 'zh',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('code');
        setCountdown(60); // 60秒倒计时
      } else {
        setError(data.error || t('errors.send_failed'));
      }
    } catch (error) {
      console.error('Failed to send code:', error);
      setError(t('errors.send_failed_retry'));
    } finally {
      setLoading(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // 根据用户是否存在决定 purpose
      const purpose = userExists ? 'login' : 'register';

      // 直接使用 NextAuth 登录 (authorize 回调会验证验证码)
      const result = await signIn('email-code', {
        email,
        code,
        purpose,
        redirect: false,
      });

      if (result?.ok) {
        // 登录成功，关闭弹窗并显示成功消息
        onClose();

        // 显示 Toast 提示
        toast.success(purpose === 'register'
          ? t('success.register_success')
          : t('success.login_success'), {
          duration: 3000,
          position: 'top-center',
          icon: '🎉',
        });

        // 刷新页面状态并跳转到编辑器
        router.refresh();
        router.push(`/${locale}/convert`);
      } else {
        console.error('Login failed:', result?.error);
        
        let errorMessage = t('errors.verification_failed');
        
        // Map backend errors to valid messages
        if (result?.error === 'expired' || result?.error?.includes('expired')) {
          errorMessage = t('errors.code_expired');
        } else if (result?.error === 'invalid_code' || result?.error?.includes('invalid_code')) {
          errorMessage = t('errors.invalid_code');
        } else if (result?.error === 'max_attempts' || result?.error?.includes('max_attempts')) {
          errorMessage = t('errors.max_attempts');
        } else if (result?.error === 'used' || result?.error?.includes('used')) {
          errorMessage = t('errors.code_used');
        } else if (result?.error === 'CredentialsSignin') {
          // 如果抛出了 Error('invalid_code')，NextAuth 可能会返回 'CredentialsSignin' 
          // 或者 error=invalid_code (取决于版本和配置)
          // 这里做一个通用提示，但通常上面的检查会捕获到具体原因
          errorMessage = t('errors.code_invalid_or_expired');
        }

        setError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to verify code:', error);
      setError(t('errors.verification_failed'));
    } finally {
      setLoading(false);
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    setCountdown(60);
    await handleSendCode();
  };

  // 处理 Google 登录
  const _handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // 获取当前 locale（从 URL 或浏览器语言）
      const pathParts = window.location.pathname.split('/');
      const localeFromPath = ['zh', 'en', 'es', 'ar', 'ru', 'fr', 'ko'].includes(pathParts[1]) ? pathParts[1] : 'zh';

      await signIn('google', {
        callbackUrl: `/${localeFromPath}/convert`,
      });
    } catch (error) {
      console.error('Google login error:', error);
      setError(t('errors.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // 模态框内容
  const renderContent = () => {
    // 验证码模式
    if (step === 'code') {
      return (
        <VerificationCodeInput
          email={email}
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
          countdown={countdown}
          loading={loading}
          error={error}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* 邮箱输入区域 */}
        <EmailInputSection
          email={email}
          onEmailChange={setEmail}
          onSendCode={handleSendCode}
          onUserExistsChange={setUserExists}
          loading={loading}
          disabled={loading}
          error={error}
        />

        {/* 分隔线 */}
        <AppleDivider>{tModal('or')}</AppleDivider>

        {/* Google 登录 */}
        <GoogleLoginButton
          disabled={loading}
        />
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 模态框遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* 模态框内容 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.2,
                ease: 'easeOut',
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className="w-full max-w-md"
            >
              <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
                {/* 关闭按钮 */}
                <div className="absolute top-4 right-4">
                  <AppleIconButton onClick={handleClose} disabled={loading}>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </AppleIconButton>
                </div>

                {/* 内容 */}
                <div className="p-6 sm:p-8">
                  {/* 标题 */}
                  <div className="text-center mb-10">

                    <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                      {tModal('welcome')}
                    </h2>

                    <div className="mt-8 transform transition-all hover:scale-105">
                      <Link 
                        href="/pricing"
                        className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white transition-all duration-200 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 ring-1 ring-white/20 backdrop-blur-sm"
                      >
                        <span className="mr-2 text-lg">👑</span>
                        <span className="tracking-wide">{tModal('upgrade_privileges')}</span>
                        <div className="absolute inset-0 rounded-full bg-white/20 group-hover:opacity-0 transition-opacity duration-200" />
                      </Link>
                    </div>
                  </div>

                  {/* 主要内容 */}
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    {renderContent()}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
