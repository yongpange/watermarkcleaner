import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { AppleIconButton } from '@/components/auth/apple-style/button';
import { AppleDivider } from '@/components/auth/apple-style/divider';
import { EmailInputSection } from '@/components/auth/email-input-section';
import VerificationCodeInput from '@/components/auth/verification-code-input';
import { GoogleLoginButton } from '@/components/auth/google-login-button';
import { MagicLinkLoginButton } from '@/components/auth/magic-link-button';
import { MagicLinkLoginForm } from '@/components/auth/magic-link-login-button';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'email-code' | 'magic-link';
}

/**
 * 主认证弹窗组件
 * 支持邮箱验证码登录/注册、Google登录、邮箱Magic Link登录
 */
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'email-code' }) => {
  const locale = useLocale();
  const router = useRouter();

  // 状态管理
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'email-code' | 'magic-link'>('email-code');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  // 当打开弹窗时重置状态
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setStep('email');
      setEmail('');
      setError(null);
      setLoading(false);
      setCountdown(0);
      setUserExists(null);
    }
  }, [isOpen, defaultMode]);

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
      setError('请输入邮箱地址');
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
        setError(data.error || '发送失败');
      }
    } catch (error) {
      console.error('Failed to send code:', error);
      setError('发送失败，请重试');
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
          ? '🎉 注册成功！欢迎加入 WatermarkCleaner！'
          : '👋 登录成功！欢迎回来！', {
          duration: 3000,
          position: 'top-center',
          icon: '🎉',
        });

        // 刷新页面状态并跳转到编辑器
        router.refresh();
        router.push(`/${locale}/convert`);
      } else {
        console.error('Login failed:', result?.error);
        
        let errorMessage = '验证失败，请重试';
        
        // Map backend errors to valid messages
        if (result?.error === 'expired' || result?.error?.includes('expired')) {
          errorMessage = '验证码已过期，请重新发送';
        } else if (result?.error === 'invalid_code' || result?.error?.includes('invalid_code')) {
          errorMessage = '验证码错误，请检查输入';
        } else if (result?.error === 'max_attempts' || result?.error?.includes('max_attempts')) {
          errorMessage = '尝试次数过多，请重新发送验证码';
        } else if (result?.error === 'used' || result?.error?.includes('used')) {
          errorMessage = '验证码已失效，请重新发送';
        } else if (result?.error === 'CredentialsSignin') {
          // 如果抛出了 Error('invalid_code')，NextAuth 可能会返回 'CredentialsSignin' 
          // 或者 error=invalid_code (取决于版本和配置)
          // 这里做一个通用提示，但通常上面的检查会捕获到具体原因
          errorMessage = '验证码错误或已过期';
        }

        setError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to verify code:', error);
      setError('验证失败，请重试');
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
      await signIn('google', {
        callbackUrl: '/my-credits',
      });
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google 登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换到 Magic Link 模式
  const switchToMagicLink = () => {
    setMode('magic-link');
  };

  // 切换回邮箱验证码模式
  const switchToEmailCode = () => {
    setMode('email-code');
    setStep('email');
  };

  // 关闭弹窗
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // 模态框内容
  const renderContent = () => {
    if (mode === 'magic-link') {
      return <MagicLinkLoginForm onBack={switchToEmailCode} />;
    }

    // 邮箱验证码模式
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
        <AppleDivider>或使用以下方式登录</AppleDivider>

        {/* Google 登录 */}
        <GoogleLoginButton
          disabled={loading}
        />

        {/* Magic Link 登录 */}
        <MagicLinkLoginButton
          disabled={loading}
          onClick={switchToMagicLink}
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
                  {/* Logo 和标题 */}
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                      </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      欢迎来到 WatermarkCleaner
                    </h2>

                    <p className="text-sm text-gray-600">
                      登录以使用我们的AI去水印服务
                    </p>
                  </div>

                  {/* 主要内容 */}
                  <motion.div
                    key={step + mode}
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
