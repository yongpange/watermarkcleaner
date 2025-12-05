# 🔄 NextAuth.js → Supabase Auth 迁移计划

**日期**: 2025-11-10  
**目标**: 完全迁移到 Supabase Auth，解决 RLS 策略问题，实现完美的数据隔离

---

## 📊 迁移概览

### 当前架构
- **认证**: NextAuth.js 5.0 (beta.25)
- **数据库**: Supabase PostgreSQL
- **用户管理**: NextAuth JWT + 自定义 users 表
- **问题**: NextAuth session 与 Supabase RLS 不兼容

### 目标架构
- **认证**: Supabase Auth
- **数据库**: Supabase PostgreSQL (保持不变)
- **用户管理**: Supabase Auth + users 表同步
- **优势**: RLS 自动生效，完美数据隔离

---

## ✅ 迁移任务清单

### 阶段 1: 准备工作 (1-2 小时)

#### 1.1 备份现有数据
- [ ] 导出 users 表数据 (Supabase Dashboard → Table Editor → Export CSV)
- [ ] 记录当前用户数量
- [ ] 备份 `.env.local` 文件

#### 1.2 记录现有 OAuth 配置
- [ ] Google OAuth Client ID: `AUTH_GOOGLE_ID`
- [ ] Google OAuth Secret: `AUTH_GOOGLE_SECRET`
- [ ] GitHub OAuth Client ID: `AUTH_GITHUB_ID`
- [ ] GitHub OAuth Secret: `AUTH_GITHUB_SECRET`

#### 1.3 分析代码依赖
- [ ] 统计使用 NextAuth.js 的文件数量
- [ ] 列出需要修改的关键文件

**关键文件清单**:
```
src/auth/
  - config.ts (NextAuth 配置)
  - handler.ts (登录处理)
  - index.ts (导出)
  - session.tsx (SessionProvider)

src/services/user.ts
  - getUserUuid() (获取用户 UUID)
  - saveUser() (保存用户)

src/components/sign/
  - form.tsx (登录表单)
  - modal.tsx (登录弹窗)
  - user.tsx (用户菜单)

src/app/api/auth/[...nextauth]/route.ts
src/app/[locale]/layout.tsx (NextAuthSessionProvider)
src/contexts/app.tsx (useSession)
```

---

### 阶段 2: Supabase Auth 配置 (30 分钟)

#### 2.1 启用 Supabase Auth Providers

**Supabase Dashboard → Authentication → Providers**

##### Google OAuth
1. 点击 **Google** provider
2. 启用 **Enable Google provider**
3. 填写配置:
   - **Client ID**: 使用现有的 `AUTH_GOOGLE_ID`
   - **Client Secret**: 使用现有的 `AUTH_GOOGLE_SECRET`
4. 添加 **Authorized redirect URIs**:
   ```
   https://hatwvsjfedokodofiqsb.supabase.co/auth/v1/callback
   ```
5. 保存

##### GitHub OAuth
1. 点击 **GitHub** provider
2. 启用 **Enable GitHub provider**
3. 填写配置:
   - **Client ID**: 使用现有的 `AUTH_GITHUB_ID`
   - **Client Secret**: 使用现有的 `AUTH_GITHUB_SECRET`
4. 添加 **Authorized redirect URIs**:
   ```
   https://hatwvsjfedokodofiqsb.supabase.co/auth/v1/callback
   ```
5. 保存

#### 2.2 更新 OAuth 应用回调 URL

##### Google Cloud Console
1. 访问 https://console.cloud.google.com/apis/credentials
2. 找到你的 OAuth 2.0 Client ID
3. 添加 **Authorized redirect URIs**:
   ```
   https://hatwvsjfedokodofiqsb.supabase.co/auth/v1/callback
   ```
4. 保存

##### GitHub OAuth Apps
1. 访问 https://github.com/settings/developers
2. 找到你的 OAuth App
3. 更新 **Authorization callback URL**:
   ```
   https://hatwvsjfedokodofiqsb.supabase.co/auth/v1/callback
   ```
4. 保存

#### 2.3 配置 Site URL
**Supabase Dashboard → Authentication → URL Configuration**

- **Site URL**: `https://你的域名.com` (生产环境) 或 `http://localhost:3000` (开发环境)
- **Redirect URLs**: 添加允许的重定向 URL
  ```
  http://localhost:3000/**
  https://你的域名.com/**
  ```

---

### 阶段 3: 创建 Supabase Auth 客户端 (1 小时)

#### 3.1 安装依赖
```bash
# Supabase Auth 已包含在 @supabase/supabase-js 中
# 检查版本
npm list @supabase/supabase-js
# 当前版本: 2.79.0 ✅
```

#### 3.2 创建服务端 Auth 客户端

**文件**: `src/lib/supabase-server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

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
          }
        },
      },
    }
  )
}
```

#### 3.3 创建客户端 Auth 客户端

**文件**: `src/lib/supabase-client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 3.4 创建 Middleware

**文件**: `src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 刷新 session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 可选：保护特定路由
  // if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
  //   return NextResponse.redirect(new URL('/auth/signin', request.url))
  // }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### 阶段 4: 实现认证 UI 组件 (2 小时)

#### 4.1 创建登录页面

**文件**: `src/app/[locale]/auth/signin/page.tsx`

```typescript
'use client'

import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { SiGoogle, SiGithub } from 'react-icons/si'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) console.error('Error:', error.message)
  }

  const handleGitHubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) console.error('Error:', error.message)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6">
      <div className="flex flex-col gap-4">
        <Button onClick={handleGoogleSignIn}>
          <SiGoogle className="w-4 h-4 mr-2" />
          Sign in with Google
        </Button>
        <Button onClick={handleGitHubSignIn}>
          <SiGithub className="w-4 h-4 mr-2" />
          Sign in with GitHub
        </Button>
      </div>
    </div>
  )
}
```

#### 4.2 创建回调处理页面

**文件**: `src/app/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 错误处理
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

---

### 阶段 5: 迁移用户会话管理 (2 小时)

#### 5.1 更新 `getUserUuid()` 函数

**文件**: `src/services/user.ts`

```typescript
import { createClient } from '@/lib/supabase-server'

export async function getUserUuid() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id || ''
}

export async function getUserEmail() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.email || ''
}
```

#### 5.2 创建用户同步 Hook

**文件**: `src/hooks/useSupabaseAuth.ts`

```typescript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export function useSupabaseAuth() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // 同步用户到 users 表
        syncUserToDatabase(session?.user)
      }
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])
}

async function syncUserToDatabase(user: any) {
  if (!user) return

  // 调用 API 同步用户
  await fetch('/api/sync-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uuid: user.id,
      email: user.email,
      nickname: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url || '',
    }),
  })
}
```

---

### 阶段 6: 更新 API 路由 (3 小时)

#### 6.1 创建用户同步 API

**文件**: `src/app/api/sync-user/route.ts`

```typescript
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { uuid, email, nickname, avatar_url } = body

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('uuid', uuid)
      .single()

    if (!existingUser) {
      // 插入新用户
      const { error } = await supabase.from('users').insert({
        uuid,
        email,
        nickname,
        avatar_url,
        created_at: new Date().toISOString(),
      })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sync user error:', error)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}
```

#### 6.2 更新所有需要认证的 API

需要更新的 API 文件:
- `src/app/api/get-user-info/route.ts`
- `src/app/api/get-user-credits/route.ts`
- `src/app/api/ping/route.ts`
- `src/app/api/update-invite-code/route.ts`
- `src/app/api/flashcards/route.ts`
- `src/app/api/workspace/*/route.ts`

**修改模式**:
```typescript
// 旧代码
import { auth } from '@/auth'
const session = await auth()
const userUuid = session?.user?.uuid

// 新代码
import { createClient } from '@/lib/supabase-server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
const userUuid = user?.id
```

---

### 阶段 7: 更新 RLS 策略 (30 分钟)

#### 7.1 验证现有 RLS 策略

**Supabase Dashboard → Database → Policies**

检查所有表的策略是否使用 `auth.uid()`：

```sql
-- 示例：users 表
SELECT * FROM users WHERE auth.uid()::text = uuid;

-- 示例：flashcards 表
SELECT * FROM flashcards WHERE auth.uid()::text = user_uuid;
```

#### 7.2 更新 users 表策略

由于 Supabase Auth 的 `auth.uid()` 返回的是 Supabase Auth 的 user ID，需要确保 `users.uuid` 字段存储的是 Supabase Auth 的 user ID。

**重要**: 迁移后，`users.uuid` 将存储 Supabase Auth 的 UUID，而不是自定义生成的 UUID。

---

### 阶段 8: 数据迁移 (1-2 小时)

#### 8.1 用户数据迁移策略

**选项 A: 软迁移（推荐）**
- 保留现有用户数据
- 用户下次登录时自动关联 Supabase Auth
- 通过 email 匹配现有用户

**选项 B: 硬迁移**
- 使用 Supabase Management API 批量创建用户
- 需要用户重置密码（如果使用密码登录）

**推荐使用选项 A**，实现步骤：

1. 修改用户同步逻辑：
```typescript
async function syncUserToDatabase(user: any) {
  const supabase = await createClient()

  // 先通过 email 查找现有用户
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()

  if (existingUser) {
    // 更新现有用户的 uuid 为 Supabase Auth UUID
    await supabase
      .from('users')
      .update({ uuid: user.id })
      .eq('email', user.email)
  } else {
    // 创建新用户
    await supabase.from('users').insert({
      uuid: user.id,
      email: user.email,
      // ...
    })
  }
}
```

---

### 阶段 9: 清理 NextAuth.js (30 分钟)

#### 9.1 删除文件
```bash
rm -rf src/auth/
rm src/app/api/auth/[...nextauth]/route.ts
```

#### 9.2 卸载依赖
```bash
npm uninstall next-auth google-one-tap
```

#### 9.3 清理环境变量
删除 `.env.local` 中的：
```
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
NEXT_PUBLIC_AUTH_GOOGLE_ID
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED
NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
NEXT_PUBLIC_AUTH_GITHUB_ENABLED
```

---

### 阶段 10: 测试验证 (2-3 小时)

#### 10.1 本地测试
- [ ] Google 登录
- [ ] GitHub 登录
- [ ] 用户信息显示
- [ ] 登出功能
- [ ] RLS 数据隔离
- [ ] API 认证

#### 10.2 功能测试
- [ ] Flashcards 创建/查看/编辑/删除
- [ ] Chat sessions 创建/查看
- [ ] Document conversions
- [ ] 积分系统
- [ ] 订单系统

#### 10.3 部署测试
- [ ] Vercel 环境变量配置
- [ ] 生产环境登录测试
- [ ] RLS 策略验证

---

## 📝 注意事项

### 重要提醒
1. **UUID 变化**: 迁移后用户的 UUID 将变为 Supabase Auth 的 UUID
2. **数据关联**: 需要更新所有关联表的 `user_uuid` 字段
3. **Session 管理**: Supabase Auth 使用 Cookie-based session
4. **RLS 自动生效**: 迁移后 RLS 策略将自动工作，无需 service_role key

### 回滚计划
如果迁移失败，可以：
1. 恢复 NextAuth.js 代码（Git revert）
2. 恢复数据库备份
3. 恢复环境变量

---

## 🎯 预期收益

1. ✅ **解决 RLS 问题**: 完美的数据隔离
2. ✅ **简化架构**: 统一使用 Supabase 生态
3. ✅ **提升安全性**: 不需要 service_role key
4. ✅ **更好的集成**: Supabase Auth + Supabase Database
5. ✅ **降低复杂度**: 减少认证层的代码量

---

**预计总时间**: 12-15 小时  
**建议分配**: 2-3 天完成，每天 4-5 小时

**准备好开始了吗？** 🚀

