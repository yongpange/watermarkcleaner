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

// 懒加载的客户端实例（供模型文件使用）
// 使用 getter 函数代替 top-level 导出，避免构建时初始化
let _supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_supabaseInstance) {
    _supabaseInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  return _supabaseInstance;
}

// 向后兼容：导出一个 getter 代理对象
// 注意：这仍然是懒加载的，只有在实际使用时才会初始化
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getSupabaseClient() as any)[prop];
  }
});
