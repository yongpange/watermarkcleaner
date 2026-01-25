import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * 创建客户端 Supabase 客户端
 *
 * 用于：
 * - Client Components
 * - React hooks
 * - 浏览器端交互
 *
 * 特点：
 * - 自动管理 session
 * - 支持实时订阅
 * - RLS 策略自动生效（基于 auth.uid()）
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 导出客户端实例（供模型文件使用）
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

