# 📋 NextAuth.js → Supabase Auth 迁移文件清单

**生成时间**: 2025-11-10  
**总文件数**: 21 个文件需要修改/删除

---

## 🗑️ 需要删除的文件 (5 个)

### NextAuth.js 核心文件
- [ ] `src/auth/config.ts` - NextAuth 配置
- [ ] `src/auth/handler.ts` - 登录处理逻辑
- [ ] `src/auth/index.ts` - NextAuth 导出
- [ ] `src/auth/session.tsx` - SessionProvider 包装器
- [ ] `src/types/next-auth.d.ts` - NextAuth 类型定义

**删除命令**:
```bash
rm -rf src/auth/
rm src/types/next-auth.d.ts
```

---

## 🔄 需要修改的文件 (16 个)

### 1. 认证组件 (6 个)

#### `src/components/sign/form.tsx`
**当前**: 使用 `signIn()` from next-auth/react  
**修改**: 使用 Supabase Auth `signInWithOAuth()`

#### `src/components/sign/modal.tsx`
**当前**: 使用 `signIn()` from next-auth/react  
**修改**: 使用 Supabase Auth `signInWithOAuth()`

#### `src/components/sign/user.tsx`
**当前**: 使用 `signOut()` from next-auth/react  
**修改**: 使用 Supabase Auth `signOut()`

#### `src/components/dashboard/sidebar/user.tsx`
**当前**: 使用 `signOut()` from next-auth/react  
**修改**: 使用 Supabase Auth `signOut()`

#### `src/hooks/useOneTapLogin.tsx`
**当前**: Google One-Tap with NextAuth  
**修改**: 可能需要自定义实现或移除（Supabase Auth 不直接支持 One-Tap）

#### `src/contexts/app.tsx`
**当前**: 使用 `useSession()` from next-auth/react  
**修改**: 使用 Supabase Auth `useUser()` hook

---

### 2. 用户服务 (1 个)

#### `src/services/user.ts`
**当前**: 
- `getUserUuid()` 使用 `auth()` from @/auth
- `saveUser()` 手动插入用户

**修改**:
- `getUserUuid()` 使用 Supabase Auth `getUser()`
- `saveUser()` 改为同步逻辑（通过 Database Trigger 或 Auth Hook）

---

### 3. API 路由 - 使用 `auth()` (4 个)

#### `src/app/api/convert/process/route.ts`
**当前**: `import { auth } from '@/auth'`  
**修改**: 使用 `createClient()` from @/lib/supabase-server

#### `src/app/api/workspace/ai-summary/route.ts`
**当前**: `import { auth } from '@/auth'`  
**修改**: 使用 `createClient()` from @/lib/supabase-server

#### `src/app/api/workspace/chat-session/route.ts`
**当前**: `import { auth } from '@/auth'`  
**修改**: 使用 `createClient()` from @/lib/supabase-server

#### `src/app/api/workspace/save/route.ts`
**当前**: `import { auth } from '@/auth'`  
**修改**: 使用 `createClient()` from @/lib/supabase-server

---

### 4. API 路由 - 使用 `getUserUuid()` (6 个)

#### `src/app/api/add-feedback/route.ts`
**当前**: `import { getUserUuid } from '@/services/user'`  
**修改**: getUserUuid() 内部已改为 Supabase Auth，无需修改

#### `src/app/api/checkout/route.ts`
**当前**: `import { getUserUuid } from '@/services/user'`  
**修改**: getUserUuid() 内部已改为 Supabase Auth，无需修改

#### `src/app/api/get-user-credits/route.ts`
**当前**: `import { getUserUuid } from '@/services/user'`  
**修改**: getUserUuid() 内部已改为 Supabase Auth，无需修改

#### `src/app/api/get-user-info/route.ts`
**当前**: `import { getUserUuid } from '@/services/user'`  
**修改**: getUserUuid() 内部已改为 Supabase Auth，无需修改

#### `src/app/api/ping/route.ts`
**当前**: `import { getUserUuid } from '@/services/user'`  
**修改**: getUserUuid() 内部已改为 Supabase Auth，无需修改

#### `src/app/api/update-invite-code/route.ts`
**当前**: `import { getUserUuid } from '@/services/user'`  
**修改**: getUserUuid() 内部已改为 Supabase Auth，无需修改

---

### 5. 布局文件 (1 个)

#### `src/app/[locale]/layout.tsx`
**当前**: 使用 `<NextAuthSessionProvider>`  
**修改**: 移除 NextAuthSessionProvider，使用 Supabase Auth Context

---

## ➕ 需要创建的文件 (8 个)

### 1. Supabase Auth 客户端

#### `src/lib/supabase-server.ts`
**用途**: 服务端 Supabase Auth 客户端（支持 SSR）  
**依赖**: `@supabase/ssr`

#### `src/lib/supabase-client.ts`
**用途**: 客户端 Supabase Auth 客户端  
**依赖**: `@supabase/ssr`

---

### 2. Middleware

#### `src/middleware.ts`
**用途**: 刷新 Supabase Auth session  
**依赖**: `@supabase/ssr`

---

### 3. 认证页面

#### `src/app/[locale]/auth/signin/page.tsx`
**用途**: 新的登录页面（使用 Supabase Auth）  
**替代**: 现有的 NextAuth 登录页面

#### `src/app/auth/callback/route.ts`
**用途**: OAuth 回调处理  
**必需**: Supabase Auth OAuth 流程

---

### 4. 用户同步

#### `src/app/api/sync-user/route.ts`
**用途**: 同步 Supabase Auth 用户到 users 表  
**调用时机**: 用户登录后

#### `src/hooks/useSupabaseAuth.ts`
**用途**: 客户端 Auth 状态监听和用户同步  
**替代**: NextAuth SessionProvider

---

### 5. Auth Context Provider

#### `src/providers/supabase-auth-provider.tsx`
**用途**: 提供 Supabase Auth 上下文  
**替代**: NextAuthSessionProvider

---

## 📦 依赖变更

### 需要安装
```bash
npm install @supabase/ssr
```

### 需要卸载
```bash
npm uninstall next-auth google-one-tap
```

---

## 🔧 环境变量变更

### 需要删除 (`.env.local`)
```bash
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

### 保留（已存在）
```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 📊 统计

- **删除文件**: 5 个
- **修改文件**: 16 个
- **创建文件**: 8 个
- **总计**: 29 个文件变更

---

## ✅ 执行顺序

1. ✅ **阶段 1**: 分析完成（当前）
2. ⏳ **阶段 2**: 安装依赖 `@supabase/ssr`
3. ⏳ **阶段 3**: 创建 Supabase Auth 客户端文件
4. ⏳ **阶段 4**: 创建 Middleware
5. ⏳ **阶段 5**: 创建认证页面和回调
6. ⏳ **阶段 6**: 修改用户服务
7. ⏳ **阶段 7**: 修改认证组件
8. ⏳ **阶段 8**: 修改 API 路由
9. ⏳ **阶段 9**: 修改布局文件
10. ⏳ **阶段 10**: 删除 NextAuth.js 文件
11. ⏳ **阶段 11**: 卸载依赖
12. ⏳ **阶段 12**: 测试验证

---

**准备好继续下一步了吗？** 🚀

