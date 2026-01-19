# Custom Supabase Adapter 测试指南

## 概述

本指南将帮助你测试新配置的 Custom Supabase Adapter，确保 NextAuth.js 正确使用现有的 `wmc_*` 表。

## 开始测试

### 步骤 1：启动开发服务器

```bash
cd E:\1_CODE\watermarkcleaner_com
npm run dev
```

服务器启动后，访问：http://localhost:3000/zh

### 步骤 2：准备测试环境

确保你的 `.env.local` 文件包含：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=your_random_secret
```

### 步骤 3：打开浏览器控制台

1. 按 F12 打开开发者工具
2. 切换到 "Console" 标签页
3. 保持控制台打开，观察日志输出

## 测试 Google OAuth 登录

### 步骤 4：点击 Google 登录

1. 点击页面右上角的 "登录" 按钮
2. 在弹出的模态框中，点击 "Google 登录"
3. 你将被重定向到 Google 登录页面

### 步骤 5：完成 Google 授权

1. 选择你的 Google 账号
2. 输入密码（如果需要）
3. 点击 "允许" 授权 WatermarkCleaner 访问你的基本信息

### 步骤 6：观察重定向流程

授权成功后，你将被重定向回：`http://localhost:3000/zh/convert`

在控制台中，你应该看到类似以下的日志：

```
[CustomAdapter] ✓ User created in wmc_users: your-email@gmail.com
[CustomAdapter] ✓ Account linked in wmc_accounts: google for user: your-email@gmail.com
[CustomAdapter] ✓ Session created for user: user-id
[Auth] ✅ New user created directly in wmc_users: your-email@gmail.com ID: xxxx
[Auth] ✅ Account linked in wmc_accounts: google for user: your-email@gmail.com
[Auth] ✅ User signed in: your-email@gmail.com ID: xxxx
[Google] User marked as email_verified in wmc_users
[Auth] ✅ Session created from wmc_sessions for: your-email@gmail.com
```

### 步骤 7：验证用户界面

登录成功后，页面右上角应该显示：
- 用户头像
- 用户名
- 剩余额度（如：👤 your-name (0/3)）

## 验证数据库

### 步骤 8：查询 wmc_users 表

```sql
-- 查询最新创建的用户
SELECT id, email, name, tier, email_verified, created_at
FROM public.wmc_users
ORDER BY created_at DESC
LIMIT 5;
```

**预期结果**：
- 应该看到你的 Google 邮箱
- `tier` 应该是 'unverified' 或 'verified'
- `email_verified` 应该有值（时间戳）

### 步骤 9：查询 wmc_accounts 表

```sql
-- 查询关联的 Google 账户
SELECT u.email, a.provider, a.provider_account_id, a.created_at
FROM public.wmc_users u
JOIN public.wmc_accounts a ON u.id = a.user_id
WHERE u.email = 'your-email@gmail.com';
```

**预期结果**：
- `provider` 应该是 'google'
- `provider_account_id` 应该是你的 Google ID

### 步骤 10：查询 wmc_sessions 表

```sql
-- 查询用户会话
SELECT u.email, s.session_token, s.expires, s.created_at
FROM public.wmc_users u
JOIN public.wmc_sessions s ON u.id = s.user_id
WHERE u.email = 'your-email@gmail.com'
  AND s.expires > NOW();
```

**预期结果**：
- 应该看到一个有效的会话记录
- `expires` 时间应该是未来的时间

### 步骤 11：验证未创建 profiles.* 表

```sql
-- 确保没有 profiles schema 的表被使用
SELECT *
FROM information_schema.tables
WHERE table_schema = 'profiles';
```

**预期结果**：
- 查询结果应该为空（0 行）
- 确认没有 `profiles.users`、`profiles.accounts` 等表

## 测试邮箱验证码登录

### 步骤 12：退出登录

1. 点击右上角的用户头像
2. 点击 "退出登录"
3. 确认已登出

### 步骤 13：测试邮箱验证码

1. 再次点击 "登录"
2. 输入你的邮箱地址（可以是任意邮箱）
3. 点击 "发送验证码"
4. 检查你的邮箱，获取 6 位验证码
5. 输入验证码并登录

### 步骤 14：验证邮箱用户

```sql
-- 查询通过邮箱验证码创建的用户
SELECT id, email, name, tier, created_at
FROM public.wmc_users
WHERE email = 'your-test-email@example.com';
```

**预期结果**：
- 用户应该被创建
- `tier` 应该是 'verified'（邮箱验证码用户自动升级）

### 步骤 15：验证验证码记录

```sql
-- 查询验证码使用记录
SELECT email, code, used, expires, created_at
FROM public.wmc_email_verification_codes
WHERE email = 'your-test-email@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

**预期结果**：
- 应该看到验证码记录
- `used` 应该是 true

## 测试额度系统

### 步骤 16：测试额度扣除

1. 访问 `/zh/convert` 页面
2. 上传一张图片并去除水印
3. 观察额度显示是否更新（例如：从 0/3 → 1/3）

### 步骤 17：验证额度记录

```sql
-- 查询处理历史记录
SELECT user_id, ip_address, image_size, success, created_at
FROM public.wmc_processing_history
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 5;
```

**预期结果**：
- 应该看到图片处理记录
- `success` 应该是 true
- `image_size` 应该有值

## 常见问题排查

### 问题 1：无法看到 CustomAdapter 日志

**解决方案**：
1. 确保 `NODE_ENV=development`
2. 检查浏览器控制台是否过滤了日志
3. 查看网络请求的响应头是否有错误信息

### 问题 2：用户未创建到 wmc_users 表

**排查步骤**：
1. 检查 Supabase 连接配置是否正确
2. 查看服务端控制台是否有错误日志
3. 确认 `SUPABASE_SERVICE_ROLE_KEY` 有写入权限
4. 检查数据库 RLS（Row Level Security）是否禁用或正确配置

### 问题 3：Google 登录重定向失败

**排查步骤**：
1. 检查 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否正确
2. 确认 Google Cloud Console 中配置的重定向 URI 包含：`http://localhost:3000/api/auth/callback/google`
3. 查看浏览器网络标签页，检查 `/api/auth/callback/google` 请求是否成功
4. 检查服务端日志是否有错误信息

### 问题 4：会话无法创建

**排查步骤**：
1. 检查 `wmc_sessions` 表结构是否正确
2. 确认会话 token 生成没有问题
3. 查看浏览器 Cookie 是否设置了 `next-auth.session-token`

## 成功标准

### ✅ 认证流程
- [ ] Google OAuth 登录成功，重定向回应用
- [ ] 邮箱验证码登录/注册成功
- [ ] 用户可以看到自己的头像和用户名
- [ ] 额度显示正确

### ✅ 数据库验证
- [ ] 用户数据写入 `wmc_users` 表
- [ ] Google 账户数据写入 `wmc_accounts` 表
- [ ] 会话数据写入 `wmc_sessions` 表
- [ ] 没有数据写入 `profiles.*` 表（如果存在，应该为空）

### ✅ 日志输出
- [ ] 控制台显示 `[CustomAdapter]` 前缀的日志
- [ ] 没有错误日志
- [ ] 事件日志显示正确的操作

## 性能检查

### 查询性能

```sql
-- 检查 wmc_users 表的查询性能
EXPLAIN ANALYZE
SELECT * FROM public.wmc_users
WHERE email = 'your-email@gmail.com';

-- 检查 wmc_accounts 表的查询性能
EXPLAIN ANALYZE
SELECT * FROM public.wmc_accounts
WHERE provider = 'google' AND provider_account_id = 'your-google-id';
```

确保查询使用了索引（Index Scan），而不是全表扫描（Seq Scan）。

## 清理测试数据（可选）

测试完成后，可以清理测试数据：

```sql
-- 删除测试用户（谨慎操作！）
DELETE FROM public.wmc_users
WHERE email IN (
  'test-email-1@gmail.com',
  'test-email-2@gmail.com'
);

-- 级联删除相关记录（accounts, sessions 等）
-- 如果设置了 ON DELETE CASCADE，上面的删除会自动清理关联表
```

## 下一步

测试成功后：
1. ✅ 更新 `CLAUDE.md`，移除 `profiles` schema 相关内容
2. ✅ 删除任何遗留的 `profiles.*` 表（如果存在）
3. ✅ 更新部署文档
4. ✅ 在生产环境进行测试

## 技术支持

如果遇到问题：
1. 查看浏览器控制台日志
2. 查看服务端日志（终端输出）
3. 检查 Supabase 数据库日志
4. 参考 `docs/migrating-to-custom-adapter.md` 文档
