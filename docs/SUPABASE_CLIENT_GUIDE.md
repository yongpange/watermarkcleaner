# 📘 Supabase 客户端使用指南

**更新时间**: 2025-11-10  
**状态**: ✅ 已重构完成

---

## 🎯 概述

本项目使用 **统一的 Supabase 客户端导出**，简化了导入路径并确保类型安全。

### 核心文件

1. **`src/lib/supabase.ts`** - 统一导出文件（推荐使用）
2. **`src/lib/supabase-server.ts`** - 服务端客户端实现
3. **`src/lib/supabase-client.ts`** - 浏览器端客户端实现

---

## 📖 使用指南

### 1️⃣ 服务端使用（API Routes、Server Components、Server Actions）

```typescript
import { createClient } from '@/lib/supabase'

export async function GET(request: Request) {
  // 创建服务端客户端（支持 SSR 和 cookies）
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()
  
  // 查询数据库
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('uuid', user?.id)
    .single()
  
  return Response.json({ data })
}
```

**特点**：
- ✅ 自动处理 cookies
- ✅ 支持 Supabase Auth session
- ✅ RLS 策略自动生效（基于 `auth.uid()`）
- ✅ 适用于 Next.js 15 App Router

---

### 2️⃣ 客户端使用（Client Components、React Hooks）

```typescript
'use client'

import { createBrowserClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const [user, setUser] = useState(null)
  const supabase = createBrowserClient()
  
  useEffect(() => {
    // 获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
    
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return <div>User: {user?.email}</div>
}
```

**特点**：
- ✅ 自动管理浏览器 session
- ✅ 支持实时订阅
- ✅ RLS 策略自动生效
- ✅ 适用于 React Client Components

---

### 3️⃣ 类型定义

```typescript
import type { Database } from '@/lib/supabase'

// 使用生成的类型
type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

// 在函数中使用
async function createUser(data: UserInsert) {
  const supabase = await createClient()
  return supabase.from('users').insert(data)
}
```

---

## ⚠️ 重要注意事项

### ❌ 不要这样做

```typescript
// ❌ 错误：不要从旧的路径导入
import { supabase } from '@/lib/supabase'

// ❌ 错误：不要直接导入实现文件
import { createClient } from '@/lib/supabase-server'
import { createClient } from '@/lib/supabase-client'

// ❌ 错误：不要在客户端使用服务端客户端
'use client'
import { createClient } from '@/lib/supabase' // 这会导致错误！

// ❌ 错误：不要在服务端使用浏览器端客户端
export async function GET() {
  const supabase = createBrowserClient() // 这会导致错误！
}
```

### ✅ 正确做法

```typescript
// ✅ 服务端：使用 createClient
import { createClient } from '@/lib/supabase'
const supabase = await createClient()

// ✅ 客户端：使用 createBrowserClient
import { createBrowserClient } from '@/lib/supabase'
const supabase = createBrowserClient()

// ✅ 类型定义：统一导入
import type { Database } from '@/lib/supabase'
```

---

## 🔧 常见场景

### 场景 1: API Route 中获取用户并查询数据

```typescript
import { createClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Order = Database['public']['Tables']['orders']['Row']

export async function GET(request: Request) {
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 查询用户的订单
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_uuid', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ orders })
}
```

---

### 场景 2: Server Component 中显示用户数据

```typescript
import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  // 查询用户详细信息
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('uuid', user.id)
    .single()
  
  return (
    <div>
      <h1>Welcome, {profile?.nickname}</h1>
      <p>Email: {user.email}</p>
    </div>
  )
}
```

---

### 场景 3: Client Component 中实时订阅

```typescript
'use client'

import { createBrowserClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import type { Database } from '@/lib/supabase'

type Message = Database['public']['Tables']['messages']['Row']

export default function ChatComponent({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createBrowserClient()
  
  useEffect(() => {
    // 初始加载消息
    supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []))
    
    // 订阅新消息
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])
  
  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

---

## 📊 迁移指南

如果你的代码中有旧的导入方式，请按以下步骤迁移：

### 步骤 1: 查找旧的导入

```bash
# 查找所有使用旧导入的文件
findstr /s /i /c:"from '@/lib/supabase'" src\*.ts src\*.tsx
```

### 步骤 2: 替换导入语句

**服务端文件**（API Routes、Server Components）：
```typescript
// 旧的
import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase-server'

// 新的
import { createClient } from '@/lib/supabase'
const supabase = await createClient()
```

**客户端文件**（Client Components）：
```typescript
// 旧的
import { supabase } from '@/lib/supabase'

// 新的
import { createBrowserClient } from '@/lib/supabase'
const supabase = createBrowserClient()
```

### 步骤 3: 验证修改

```bash
# 运行 TypeScript 类型检查
npx tsc --noEmit

# 运行开发服务器测试
npm run dev
```

---

## ✅ 最佳实践

1. **始终使用统一导出** - 从 `@/lib/supabase` 导入，而不是直接导入实现文件
2. **区分服务端和客户端** - 服务端用 `createClient`，客户端用 `createBrowserClient`
3. **使用类型定义** - 导入 `Database` 类型以获得完整的类型安全
4. **处理错误** - 始终检查 Supabase 操作的 `error` 返回值
5. **使用 RLS 策略** - 依赖 Supabase RLS 而不是在代码中手动检查权限

---

## 🔗 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [TypeScript 类型生成](https://supabase.com/docs/guides/api/generating-types)

---

**问题反馈**: 如果遇到问题，请检查：
1. 环境变量是否正确配置（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
2. 是否在正确的环境（服务端/客户端）使用了正确的客户端
3. TypeScript 类型是否最新（运行 `npm run supabase:types` 更新）

