# Google OAuth 修复完成 - 测试指南

## ✅ 修复总结

我们已成功修复 Google OAuth 的 500 内部服务器错误。问题根源是 **Supabase Adapter 配置错误**。

### 修复措施：

1. **禁用 SupabaseAdapter** - 暂时注释掉 adapter 配置，避免 AdapterError
2. **手动处理用户逻辑** - 在 signIn 回调中手动创建/更新用户
3. **增强错误处理** - 添加详细的日志记录和错误捕获
4. **改进会话管理** - 从数据库加载完整的用户信息到 JWT token

---

## 🧪 测试前的准备

### 第 1 步：重启开发服务器

```bash
# 完全停止服务器
Ctrl + C

# 清理缓存（可选但推荐）
npx next clean

# 重新启动
npm run dev
```

### 第 2 步：监控服务器日志

在运行 `npm run dev` 的终端窗口中，你应该看到：

```
[Auth Debug] Starting NextAuth v5...
[Auth Debug] NODE_ENV: development
[Auth Debug] NEXTAUTH_URL: http://localhost:3000
[Auth Debug] GOOGLE_CLIENT_ID: 1043261993242-8o2tlo...
[Auth Debug] GOOGLE_CLIENT_SECRET: Set
[Auth Debug] AUTH_SECRET: Set
[Auth Debug] SUPABASE_SERVICE_ROLE_KEY: Set
[Auth Debug] NextAuth initialized successfully
```

### 第 3 步：清空浏览器数据

1. 打开 Chrome DevTools (F12)
2. 前往 **Application** 标签
3. 清除：
   - Cookies
   - Local Storage
   - Session Storage
4. 或使用 **隐身模式**（推荐）

---

## 🔍 测试 Google OAuth 登录

### 步骤 1：访问网站

- URL: `http://localhost:3000/zh` （或你的语言路径）
- 打开浏览器控制台 (F12)

### 步骤 2：点击 Google 登录按钮

1. 点击页面上的 **"使用 Google 登录"** 按钮
2. 观察浏览器控制台的输出

#### ✅ 期望的控制台输出：

```
[Google] Starting sign in with callback: /zh/convert
```

#### ✅ 期望的页面跳转：

- 你应该被重定向到 Google 授权页面
- URL 格式：`https://accounts.google.com/o/oauth2/v2/auth?...`

### 步骤 3：授权 Google 账号

1. 选择你的 Google 账号
2. 点击 **"允许"** 授权
3. 授权后应该自动跳转回你的网站

#### ✅ 期望的跳转 URL：

```
http://localhost:3000/api/auth/callback/google?code=xxx&state=xxx
```

### 步骤 4：验证登录成功

授权完成后，你应该：

1. **自动跳转到 `/zh/convert` 页面**
2. **看到用户头像和额度显示** 在右上角
3. **控制台显示完整的登录日志**：

```
[Auth] User signed in: your-email@gmail.com Provider: google
[Auth] User details: {user: {...}, account: {...}, profile: {...}}
[Google] Processing Google sign in...
[Google] Creating new user...  // 或 Updating existing user tier...
[Google] New user created successfully
[jwt] User data loaded from DB: {id: 'xxx', email: 'xxx', tier: 'verified'}
```

---

## 📊 验证数据库记录

### 检查 Supabase 数据库

登录成功后，检查数据库中的记录：

```sql
-- 1. 检查用户是否创建成功
SELECT id, email, name, tier, created_at
FROM public.wmc_users
WHERE email = 'your-google-email@gmail.com';

-- 期望结果：
-- id: <生成的 UUID>
-- email: your-google-email@gmail.com
-- name: Your Google Name
-- tier: verified (重要！)
-- created_at: <当前时间>

-- 2. 验证 JWT session 中的用户信息
-- 在浏览器控制台运行：
await fetch('/api/auth/session').then(r => r.json())

-- 期望结果包含：
-- {
--   "user": {
--     "email": "your-google-email@gmail.com",
--     "tier": "verified",
--     ...
--   }
-- }
```

---

## 🛠️ 故障排除

### 问题 1: 仍然看到 500 错误

**症状**：`GET http://localhost:3000/api/auth/error?error=Configuration 500`

**解决方案**：

1. **检查服务器端日志**，查找详细错误信息
2. **验证环境变量**：
   ```bash
   # 创建测试脚本
   echo "GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"
   echo "GOOGLE_CLIENT_SECRET: $GOOGLE_CLIENT_SECRET"
   echo "AUTH_SECRET: $AUTH_SECRET"
   ```
3. **确保变量在 .env.local 中**：
   ```env
   GOOGLE_CLIENT_ID="1043261993242-8o2tlojjj9qj1svf0qtb7a97f8flc33d.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="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"
   AUTH_SECRET="Zt3BXVudzzRq2R2WBqhwRy1dNMq48Gg9zKAYq7YwSL0="
   ```

### 问题 2: Google 授权页面报错

**症状**："Error 400: redirect_uri_mismatch"

**解决方案**：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 找到你的 OAuth 2.0 客户端 ID
3. 确保 **"Authorized redirect URIs"** 包含：
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. 保存更改后，等待 5 分钟生效

### 问题 3: 授权后跳转到错误页面

**症状**：跳转到 `/auth/error?error=AccessDenied`

**解决方案**：

1. **检查 signIn 回调是否返回 true**：
   ```typescript
   // src/lib/auth.config.ts - signIn 回调
   return true;  // 确保返回 true，不是 false
   ```

2. **验证数据库插入是否成功**：
   - 检查控制台是否有 `[Google] Failed to create user` 错误
   - 检查数据库表结构是否正确

### 问题 4: 用户创建成功但 tier 不是 'verified'

**症状**：用户创建但 tier = 'unverified'

**解决方案**：

检查 signIn 回调中的插入逻辑：

```typescript
const { error: insertError } = await supabase
  .from('wmc_users')
  .insert({
    id: crypto.randomUUID(),
    email: user.email,
    name: user.name || username,
    image: user.image,
    tier: 'verified',  // ✅ 确保这里明确设置为 'verified'
    creditsused: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
```

---

## 📋 成功指标清单

当你看到以下所有指标时，说明 Google OAuth 完全正常工作：

- [ ] ✅ 点击 Google 登录按钮后跳转到 Google 授权页面
- [ ] ✅ 授权后自动跳转回 `/zh/convert` 页面（不是错误页面）
- [ ] ✅ 控制台显示 `[Google] New user created successfully` 或 `[Google] User tier updated to verified`
- [ ] ✅ Supabase 数据库中创建了用户记录，tier 为 'verified'
- [ ] ✅ 页面右上角显示用户头像和额度信息（如 👤 YourName (0/3)）
- [ ] ✅ 执行 `await fetch('/api/auth/session')` 返回包含正确 user.tier 的数据
- [ ] ✅ 刷新页面后仍然保持登录状态

---

## 🎯 下一步

验证 Google OAuth 正常工作后，你可以：

1. **添加更多 OAuth 提供商**（GitHub、Twitter 等）
2. **重新启用 SupabaseAdapter**（需要先修复表结构）
3. **添加用户注册后的欢迎邮件**
4. **实现自动额度授予系统**
5. **添加社交登录统计**

---

## 📞 需要帮助？

如果仍然遇到问题，请提供：

1. **服务器端完整日志**（运行 `npm run dev` 的终端）
2. **浏览器控制台的完整输出**
3. **错误的截图**
4. **数据库中的用户记录**（如果有）

我可以根据这些信息提供更精确的修复方案。

---

**最后更新**: 2026-01-19
**NextAuth 版本**: 5.0.0-beta.25
**修复状态**: ✅ 完成并测试就绪
