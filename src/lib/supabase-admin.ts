import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * 创建管理员 Supabase 客户端（使用 Service Role Key）
 *
 * ⚠️ 警告：此客户端绕过 RLS，仅用于服务端内部操作
 *
 * 用于：
 * - 验证码存储和验证（wmc_email_verification_codes 表）
 * - 需要绕过 RLS的管理员操作
 *
 * 🚨 不要在客户端使用！会导致密钥泄露！
 */
export function createAdminClient() {
  // 🛡️ 运行时安全检查 - 防止在浏览器中调用
  // Note: specific verification for browser environment (document exists)
  // because 'window' might be defined in some Edge runtimes (e.g. Cloudflare Workers)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    console.error('🚨 SECURITY ERROR: createAdminClient() called in browser!')
    console.error('This would expose the Service Role Key to the client.')
    throw new Error(
      'Admin client can only be used on the server. ' +
      'Check that this code is not imported into a client component.'
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    // Log specifics to help debug in Cloudflare logs
    console.error('[createAdminClient] Missing env vars:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey,
      nodeEnv: process.env.NODE_ENV
    });
    throw new Error('Missing Supabase admin credentials: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // 强制禁用所有请求的缓存，确保数据实时性
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          cache: 'no-store',
          next: { revalidate: 0 } // Next.js specific
        })
      },
    },
  })
}
