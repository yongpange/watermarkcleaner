import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database-merged'

/**
 * 创建管理员 Supabase 客户端（使用 Service Role Key）
 *
 * ⚠️ 警告：此客户端绕过 RLS，仅用于服务端内部操作
 *
 * 用于：
 * - 验证码存储和验证（wmc_email_verification_codes 表）
 * - 需要绕过 RLS 的管理员操作
 *
 * 不要在客户端使用！
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
