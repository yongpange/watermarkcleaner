import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

/**
 * 国际化的OAuth回调处理页面
 * 
 * 由于使用了国际化路由，这个页面用于：
 * 1. 处理任何locale的OAuth回调
 * 2. 接收授权码并交换session
 * 3. 重定向到适当的页面
 */
export default async function AuthCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string; next?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { code, next = "/", error } = await searchParams;

  // 如果有错误参数，重定向到登录页并显示错误
  if (error) {
    return redirect(`/${locale}/auth/signin?error=${encodeURIComponent(error)}`);
  }

  // 如果没有授权码，重定向到登录页
  if (!code) {
    return redirect(`/${locale}/auth/signin?error=no_code`);
  }

  // 交换授权码获取session
  const supabase = await createClient();
  const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

  if (authError) {
    console.error("Auth callback error:", authError);
    return redirect(`/${locale}/auth/signin?error=auth_callback_error`);
  }

  // 成功：重定向到目标页面
  return redirect(`/${locale}${next}`);
}