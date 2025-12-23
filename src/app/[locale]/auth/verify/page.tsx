import { Metadata } from "next";
import { EmailSignInForm } from "@/components/auth/email-signin-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "验证邮箱 - WatermarkCleaner",
    description: "验证您的邮箱以获得更多图片去水印额度",
  };
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 self-center font-medium text-2xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            W
          </div>
          WatermarkCleaner
        </div>

        {/* Email Sign In Card */}
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                <Mail className="h-8 w-8 text-violet-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              验证邮箱，获得更多额度
            </CardTitle>
            <CardDescription>
              输入您的邮箱地址，我们将发送验证邮件给您
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailSignInForm />

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">验证后您将获得：</p>
              <ul className="text-left inline-block space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  额度从 3张/月 提升至 10张/月
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  支持更高分辨率输出
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  优先处理队列
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center text-sm">
          <a
            href="/"
            className="text-violet-600 hover:text-violet-700 underline-offset-4 hover:underline"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
