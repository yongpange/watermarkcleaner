import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * Supabase Auth OAuth 回调处理
 * 
 * 流程：
 * 1. 用户点击 "Sign in with Google/GitHub"
 * 2. 重定向到 OAuth provider
 * 3. 用户授权后，重定向回此路由（带 code 参数）
 * 4. 交换 code 获取 session
 * 5. 重定向到目标页面
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 成功：重定向到目标页面
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Auth callback error:', error)
  }

  // 错误处理：重定向到登录页面并显示错误
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_error`)
}

