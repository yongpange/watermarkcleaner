"use client";

import { useSession, signIn } from "next-auth/react";
import { FiCheckCircle, FiMail, FiSend } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * Prompts unverified users to verify their email
 * Shows the benefit of verification (10 vs 3 images per month)
 */
export function VerificationPrompt() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  // Only show for authenticated but unverified users
  if (status === "unauthenticated") return null;
  if (status === "loading") return null;
  if (!session?.user?.email) return null;

  // Check if user is verified
  if (session.user.emailVerified) return null;

  const handleVerify = async () => {
    setLoading(true);
    try {
      // Re-signin the user with email provider to trigger verification email
      await signIn("email", {
        email: session.user.email,
        redirect: false,
      } as any);
    } catch (error) {
      console.error("Failed to send verification email:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200 dark:border-yellow-800 rounded-lg relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-yellow-500 to-amber-600" />

      <div className="pl-3 flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
            <FiMail className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              📧 验证邮箱获得更多额度
            </h3>
            <FiCheckCircle className="text-green-600 dark:text-green-400" />
          </div>

          <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
            当前额度: <span className="font-semibold text-red-600 dark:text-red-400">3张/月</span>
            <br />
            验证后可获得: <span className="font-semibold text-green-600 dark:text-green-400">10张/月</span>
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  发送验证邮件
                </>
              )}
            </button>

            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              验证邮件将发送至: {session.user.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
