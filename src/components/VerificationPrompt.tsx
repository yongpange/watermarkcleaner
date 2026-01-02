"use client";

import { useSession, signIn } from "next-auth/react";
import { FiCheckCircle, FiMail, FiSend } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Prompts unverified users to verify their email
 * Shows the benefit of verification (10 vs 3 images per month)
 */
export function VerificationPrompt() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // 只在登录且 tier = 'unverified' 时显示
  if (status !== "authenticated") return null;

  const userTier = (session?.user as any)?.tier;
  if (!userTier || userTier !== 'unverified') {
    return null;  // verified 或 pro 用户不显示
  }

  const userEmail = session.user?.email;
  if (!userEmail) return null;

  const handleVerify = async () => {
    setLoading(true);
    try {
      // 发送验证邮件
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          purpose: 'verify_email',
        }),
      });

      if (response.ok) {
        setEmailSent(true);
      } else {
        const data = await response.json();
        console.error('Failed to send verification email:', data.error);
      }
    } catch (error) {
      console.error('Failed to send verification email:', error);
    } finally {
      setLoading(false);
    }
  };

  // 如果已经发送了邮件，显示提示
  if (emailSent) {
    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200 dark:border-blue-800 rounded-lg relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600" />

        <div className="pl-3 flex items-start gap-3">
          <FiMail className="w-5 h-5 text-blue-500 mt-1" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-100">
              验证邮件已发送
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              我们已向 <strong>{userEmail}</strong> 发送了验证码
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              请查收邮件并输入6位验证码以验证邮箱，验证后额度将提升至10张/月
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200 dark:border-yellow-800 rounded-lg relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-yellow-500 to-amber-600" />

      <div className="pl-3 flex items-start gap-3">
        <FiMail className="w-5 h-5 text-yellow-600 mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-100">
              📧 验证邮箱获得更多额度
            </h3>
            <FiCheckCircle className="text-green-600 dark:text-green-400" />
          </div>

          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            <p>
              当前额度: <span className="font-semibold text-red-600 dark:text-red-400">3张/月</span>
            </p>
            <p>
              验证后可获得: <span className="font-semibold text-green-600 dark:text-green-400">10张/月</span>
            </p>
            <p className="mt-1 text-yellow-600 dark:text-yellow-400">
              邮箱: {userEmail}
            </p>
          </div>

          <div className="mt-3">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-medium rounded-lg hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <FiSend className="w-3 h-3" />
                  发送验证邮件
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
