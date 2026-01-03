import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database-merged'

/**
 * 创建服务端 Supabase 客户端（支持 SSR）
 *
 * 用于：
 * - Server Components
 * - Server Actions
 * - Route Handlers (API Routes)
 *
 * 特点：
 * - 自动处理 cookies
 * - 支持 Supabase Auth session
 * - RLS 策略自动生效（基于 auth.uid()）
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 中可能无法设置 cookie
            // 这是正常的，middleware 会处理
          }
        },
      },
    }
  )
}

