"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail } from "lucide-react";

/**
 * Email sign-in form for NextAuth
 * Sends a verification email to the user
 */
export function EmailSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign in with email (NextAuth will send verification email)
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/convert",
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Redirect to verification request page
        router.push(`/auth/verify-request?email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      console.error('Email signin error:', err);
      // 更友好的错误提示
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          setError("网络连接失败，请检查网络后重试");
        } else if (err.message.includes('timeout')) {
          setError("请求超时，邮件可能已发送，请检查邮箱");
        } else {
          setError("发送失败，邮件可能已发送，请检查邮箱");
        }
      } else {
        setError("发送验证邮件失败，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-center">验证邮件已发送！</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          我们已向 <strong>{email}</strong> 发送了一封验证邮件
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          邮件已成功发送！请检查您的收件箱（包括垃圾邮件文件夹）并点击验证链接
        </p>
        <p className="text-xs text-orange-600 dark:text-orange-400 text-center mt-2">
          💡 提示：某些邮箱可能需要几分钟才能收到邮件
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱地址</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              发送中...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              发送验证邮件
            </>
          )}
        </Button>
        {
          <CardDescription className="text-center">
            验证后您的额度将从 <strong className="text-red-600">3张/月</strong> 提升至
            <strong className="text-green-600"> 10张/月</strong>
          </CardDescription>
        }
      </div>
    </form>
  );
}
