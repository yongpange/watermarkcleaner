# NextAuth 自定义适配器迁移指南

## 概述

我们已将 NextAuth.js 的 Supabase 适配器从默认的 `profiles.*` schema 迁移到直接使用现有的 `public.wmc_*` 表。这消除了双数据库 schema 的设计，简化了架构。

## 变更总结

### 已删除的文件
- ✅ `setup-nextauth-tables.sql` - 该文件会创建 `profiles.*` 表，已被删除

### 新增的文件
- ✅ `src/lib/auth/custom-supabase-adapter.ts` - 自定义 Supabase 适配器，映射到 `wmc_*` 表

### 已修改的文件
- ✅ `src/lib/auth.config.ts` - 更新为使用 `CustomSupabaseAdapter`

## 数据库表映射

自定义适配器将 NextAuth 的标准表名映射到现有的 `wmc_*` 表：

| NextAuth 表名 | 实际数据库表 | 说明 |
|--------------|-------------|------|
| `users` | `wmc_users` | 用户账户信息 |
| `accounts` | `wmc_accounts` | OAuth 提供商账户 |
| `sessions` | `wmc_sessions` | 用户会话 |
| `verification_tokens` | `wmc_verification_tokens` | 邮箱验证令牌 |

## 测试步骤

### 1. 本地开发环境测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 打开浏览器控制台查看日志
# 3. 测试 Google OAuth 登录
# 4. 测试邮箱验证码登录
```

### 2. 验证数据库写入

```sql
-- 检查新用户是否在 wmc_users 表中
SELECT id, email, name, tier, email_verified
FROM public.wmc_users
ORDER BY created_at DESC
LIMIT 10;

-- 检查 OAuth 账户是否在 wmc_accounts 表中
SELECT u.email, a.provider, a.provider_account_id
FROM public.wmc_users u
JOIN public.wmc_accounts a ON u.id = a.user_id
ORDER BY a.created_at DESC
LIMIT 10;

-- 检查会话是否在 wmc_sessions 表中
SELECT u.email, s.session_token, s.expires
FROM public.wmc_users u
JOIN public.wmc_sessions s ON u.id = s.user_id
WHERE s.expires > NOW()
ORDER BY s.created_at DESC
LIMIT 10;
```

### 3. 检查控制台日志

成功的登录应该显示：
```
[CustomAdapter] ✓ User created in wmc_users: user@example.com
[CustomAdapter] ✓ Account linked in wmc_accounts: google for user: user@example.com
[Auth] ✅ New user created directly in wmc_users: user@example.com ID: xxxx
[Auth] ✅ Account linked in wmc_accounts: google for user: user@example.com
[Google] User marked as email_verified in wmc_users
```

## API 兼容性

所有现有的 API 路由无需修改，因为：
1. Custom Adapter 实现了标准的 NextAuth Adapter 接口
2. 返回的数据格式与默认适配器完全一致
3. Callbacks 和 Events 的工作方式不变

## 注意事项

### 1. Google 用户自动升级
- Google OAuth 用户登录时，会自动在 `wmc_users` 表中设置 `email_verified`
- 数据库中的 `tier` 字段默认值为 `'unverified'`
- 如果需要自动升级到 `'verified'`，可以修改 Custom Adapter 的 `createUser` 方法

### 2. 邮箱验证码用户
- 邮箱验证码认证已在 `Credentials` provider 中实现
- 验证成功后，用户会获得 `tier = 'verified'`
- 无需额外的手动同步

### 3. 现有用户数据
- 已经在 `wmc_users` 表中存在的用户不会受到影响
- 他们的登录会话和 OAuth 账户会继续正常工作

## 回滚方案

如果遇到问题，可以回滚到使用标准的 SupabaseAdapter：

```typescript
// 在 src/lib/auth.config.ts 中
import { SupabaseAdapter } from '@auth/supabase-adapter';

// 替换
adapter: CustomSupabaseAdapter({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  secret: process.env.SUPABASE_SERVICE_ROLE_KEY!
})

// 为
adapter: SupabaseAdapter({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  secret: process.env.SUPABASE_SERVICE_ROLE_KEY!
})
```

**注意**：回滚后需要确保 `profiles.*` 表存在并且包含最新的用户数据。

## 下一步计划

1. ✅ 测试 Google OAuth 登录流程
2. ✅ 测试邮箱验证码登录/注册流程
3. ✅ 验证数据正确地写入 `wmc_*` 表
4. ✅ 确保额度系统和用户层级正常工作
5. ✅ 删除任何剩余的 `profiles.*` 相关代码和引用
6. ✅ 更新文档，移除 `profiles` schema 相关的说明

## 常见问题

### Q: 为什么需要自定义适配器？
A: 因为我们希望 NextAuth 直接使用现有的 `wmc_*` 表，而不是创建新的 `profiles.*` 表。这简化了数据库架构，避免了数据同步的复杂性。

### Q: 自定义适配器会影响现有功能吗？
A: 不会。自定义适配器实现了标准 Adapter 接口，所有 NextAuth 功能（OAuth、邮箱验证、会话管理等）都会正常工作。

### Q: 如何处理 NextAuth 的版本升级？
A: 自定义适配器基于 @auth/core 的 Adapter 接口实现。升级 NextAuth 时，需要检查接口是否有变化，并相应地更新适配器实现。

### Q: 可以同时使用双 schema 吗？
A: 不建议。当前的迁移就是为了消除双 schema 设计。如果确实需要，可以在 Custom Adapter 中实现数据同步逻辑。

## 技术细节

### CustomSupabaseAdapter 实现要点

1. **表名映射**：将 NextAuth 的标准表名映射到 `wmc_*` 表
2. **数据格式转换**：在数据库格式和 NextAuth 格式之间转换
3. **错误处理**：记录详细日志，便于调试
4. **类型安全**：使用 TypeScript 确保类型正确
5. **SHA256 Token 哈希**：使用 Node.js `crypto` 模块实现 token 安全存储
6. **性能优化**：使用单条查询和适当的索引

### Token 哈希实现

由于 `@auth/core/lib` 包没有导出哈希函数，我们使用 Node.js 内置的 `crypto` 模块：

```typescript
import { createHash } from 'crypto';

// 创建验证令牌时哈希
const hashedToken = createHash('sha256').update(data.token).digest('hex');

// 验证令牌时重新哈希进行比较
const hashedToken = createHash('sha256').update(params.token).digest('hex');
```

这样可以确保：
- Token 在数据库中以 SHA256 哈希形式安全存储
- 验证时进行相同的哈希操作以匹配存储的值
- 符合 NextAuth 的安全最佳实践

### NextAuth Callbacks 变更

`signIn` 回调现在直接更新 `wmc_users` 表，不再依赖触发器同步：

```typescript
// 更新 wmc_users 表中的 email_verified 字段
await supabase
  .from('wmc_users')
  .update({
    email_verified: new Date().toISOString()
  })
  .eq('email', user.email!);
```

## 监控和调试

### 日志级别
- `[CustomAdapter]` - 适配器操作的详细日志
- `[Auth]` - 认证流程的主要步骤
- `[Google]` - Google OAuth 特定日志

### 常见错误

1. **表不存在**
   ```
   Error: relation "public.wmc_users" does not exist
   ```
   解决：确保数据库迁移已运行，所有 `wmc_*` 表已创建

2. **权限错误**
   ```
   Error: permission denied for relation wmc_users
   ```
   解决：检查 SUPABASE_SERVICE_ROLE_KEY 是否正确配置

3. **字段类型不匹配**
   ```
   Error: column "provider_account_id" does not exist
   ```
   解决：检查表结构是否与自定义适配器的映射一致

## 参考文档

- [NextAuth.js Adapters Documentation](https://authjs.dev/reference/adapters)
- [Supabase Adapter Source Code](https://github.com/nextauthjs/next-auth/tree/main/packages/adapter-supabase)
- [NextAuth.js v5 Beta Documentation](https://authjs.dev/getting-started/migrating-to-v5)
