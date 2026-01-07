"use client";

import { useSession, signIn } from "next-auth/react";
import { FiCheckCircle, FiMail, FiSend } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Prompts users to verify their email or sign in
 * Shows the benefit of verification (more credits)
 */
export function VerificationPrompt() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Show for both authenticated and unauthenticated users
  const isAuthenticated = status === "authenticated";
  const userTier = isAuthenticated ? (session?.user as any)?.tier : 'unverified';

  // Don't show for pro users
  if (userTier === 'pro') {
    return null;
  }

  const userEmail = session?.user?.email;
  if (!userEmail) return null;

  const handleVerify = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        // If not authenticated, show auth modal by redirecting or showing a prompt
        window.location.href = '/auth/signin?callbackUrl=/convert';
        return;
      }

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

  // Show for all users (authenticated and unauthenticated)
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200 dark:border-yellow-800 rounded-lg relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-yellow-500 to-amber-600" />

      <div className="pl-3 flex items-start gap-3">
        <FiMail className="w-5 h-5 text-yellow-600 mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-100">
              🔐 {isAuthenticated ? '📧 Verify email for more credits' : 'Sign in for more credits'}
            </h3>
            <FiCheckCircle className="text-green-600 dark:text-green-400" />
          </div>

          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            <p className="mt-1 text-yellow-600 dark:text-yellow-400">
              {isAuthenticated && userEmail ? `Email: ${userEmail}` : 'You are currently using as a guest'}
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
                  Sending...
                </>
              ) : (
                <>
                  <FiSend className="w-3 h-3" />
                  {isAuthenticated ? 'Send Verification Email' : 'Sign In'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Email sent confirmation */}
      {emailSent && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
          <FiMail className="inline w-3 h-3 mr-1" />
          Verification email sent! Check your inbox.
        </div>
      )}
    </div>
  );
}
