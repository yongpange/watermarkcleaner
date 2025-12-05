/**
 * Supabase 客户端统一导出
 *
 * 📖 使用指南：
 *
 * 1️⃣ 服务端（API Routes、Server Components、Server Actions）
 *    import { createClient } from '@/lib/supabase-server'
 *    const supabase = await createClient()
 *
 * 2️⃣ 客户端（Client Components、React Hooks）
 *    import { createBrowserClient } from '@/lib/supabase-client'
 *    const supabase = createBrowserClient()
 *
 * 3️⃣ 类型定义
 *    import type { Database } from '@/types/database.types'
 *
 * ⚠️ 注意：
 * - 服务端必须使用 createClient（支持 SSR 和 cookies）
 * - 客户端必须使用 createBrowserClient（支持浏览器 session）
 * - Models 层函数接收 supabase 参数，不自己创建连接
 * - 不要混用！否则会导致认证问题
 */

// 导出类型定义
export type { Database } from '@/types/database.types'

// 导出服务端客户端（用于 API Routes、Server Components）
export { createClient } from '@/lib/supabase-server'

// 导出浏览器端客户端（用于 Client Components）
export { createClient as createBrowserClient } from '@/lib/supabase-client'
