# 🔐 Supabase Auth 配置指南

## 📋 前置准备

在开始配置之前，请确保你已经：
- ✅ 完成了代码迁移（阶段 1-8）
- ✅ 有 Google OAuth 和 GitHub OAuth 的 Client ID 和 Secret
- ✅ 可以访问 Supabase Dashboard

---

## 🚀 步骤 1: 配置 Google OAuth

### 1.1 登录 Supabase Dashboard

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目

### 1.2 启用 Google Provider

1. 点击左侧菜单 **Authentication** → **Providers**
2. 找到 **Google** provider
3. 点击右侧的 **Enable** 开关

### 1.3 配置 Google OAuth

1. 在 Google Provider 配置页面，填写以下信息：
   - **Client ID**: 从你的 `.env.local` 复制 `AUTH_GOOGLE_ID` 的值
   - **Client Secret**: 从你的 `.env.local` 复制 `AUTH_GOOGLE_SECRET` 的值

2. 复制 **Callback URL (for OAuth)**，格式类似：
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

### 1.4 更新 Google Cloud Console

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目
3. 进入 **APIs & Services** → **Credentials**
4. 找到你的 OAuth 2.0 Client ID
5. 在 **Authorized redirect URIs** 中添加 Supabase 的 Callback URL：
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
6. 点击 **Save**

### 1.5 保存配置

回到 Supabase Dashboard，点击 **Save** 保存 Google Provider 配置。

---

## 🐙 步骤 2: 配置 GitHub OAuth

### 2.1 启用 GitHub Provider

1. 在 Supabase Dashboard 的 **Authentication** → **Providers** 页面
2. 找到 **GitHub** provider
3. 点击右侧的 **Enable** 开关

### 2.2 配置 GitHub OAuth

1. 在 GitHub Provider 配置页面，填写以下信息：
   - **Client ID**: 从你的 `.env.local` 复制 `AUTH_GITHUB_ID` 的值
   - **Client Secret**: 从你的 `.env.local` 复制 `AUTH_GITHUB_SECRET` 的值

2. 复制 **Callback URL (for OAuth)**，格式类似：
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

### 2.3 更新 GitHub OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击你的 OAuth App
3. 在 **Authorization callback URL** 中更新为 Supabase 的 Callback URL：
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
4. 点击 **Update application**

### 2.4 保存配置

回到 Supabase Dashboard，点击 **Save** 保存 GitHub Provider 配置。

---

## 🔧 步骤 3: 配置环境变量

### 3.1 本地开发环境

确保你的 `.env.local` 文件包含以下变量：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (保持不变，用于环境变量判断)
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
NEXT_PUBLIC_AUTH_GITHUB_ENABLED=true
```

**注意**：
- ❌ 不再需要 `AUTH_GOOGLE_ID`、`AUTH_GOOGLE_SECRET`、`AUTH_GITHUB_ID`、`AUTH_GITHUB_SECRET`
- ❌ 不再需要 `AUTH_SECRET`、`NEXTAUTH_URL`
- ✅ 只需要 Supabase 的 URL 和 Anon Key

### 3.2 Vercel 部署环境

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 确保以下变量已配置：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
   NEXT_PUBLIC_AUTH_GITHUB_ENABLED=true
   ```
5. **删除**以下旧的 NextAuth.js 变量（如果存在）：
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL`

---

## 🔒 步骤 4: 配置 Site URL 和 Redirect URLs

### 4.1 配置 Site URL

1. 在 Supabase Dashboard，进入 **Authentication** → **URL Configuration**
2. 设置 **Site URL**：
   - 本地开发：`http://localhost:3000`
   - 生产环境：`https://your-domain.com`

### 4.2 配置 Redirect URLs

在 **Redirect URLs** 中添加以下 URL（允许 OAuth 回调后重定向）：

**本地开发**：
```
http://localhost:3000
http://localhost:3000/auth/callback
```

**生产环境**：
```
https://your-domain.com
https://your-domain.com/auth/callback
```

点击 **Save** 保存配置。

---

## ✅ 步骤 5: 验证配置

### 5.1 检查 Provider 状态

在 Supabase Dashboard 的 **Authentication** → **Providers** 页面，确认：
- ✅ Google Provider 显示为 **Enabled**
- ✅ GitHub Provider 显示为 **Enabled**

### 5.2 测试 OAuth 流程

1. 启动本地开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 `http://localhost:3000`

3. 点击 **Sign In** 按钮

4. 尝试使用 Google 或 GitHub 登录

5. 检查是否成功重定向并登录

---

## 🐛 常见问题

### 问题 1: OAuth 回调失败

**错误信息**：`redirect_uri_mismatch` 或 `invalid_request`

**解决方案**：
1. 检查 Google Cloud Console / GitHub OAuth App 中的 Callback URL 是否正确
2. 确保 Callback URL 完全匹配（包括 `https://` 前缀）
3. 等待几分钟让配置生效

### 问题 2: 用户登录后没有同步到 users 表

**解决方案**：
1. 检查 `src/app/api/sync-user/route.ts` 是否正确部署
2. 检查浏览器控制台是否有错误
3. 检查 Supabase Dashboard → **Authentication** → **Users** 中是否有用户记录

### 问题 3: RLS 策略仍然报错

**解决方案**：
1. 确保用户已成功登录（检查 Supabase Auth session）
2. 检查 RLS 策略中的 `auth.uid()` 是否正确
3. 使用 Supabase SQL Editor 测试：
   ```sql
   SELECT auth.uid();  -- 应该返回当前用户的 UUID
   ```

---

## 📚 下一步

配置完成后，请进行以下测试：

1. ✅ 测试 Google 登录
2. ✅ 测试 GitHub 登录
3. ✅ 测试用户数据同步
4. ✅ 测试数据隔离（RLS 策略）
5. ✅ 测试退出登录

如果所有测试通过，恭喜你！🎉 迁移成功完成！

---

## 🔗 相关文档

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [GitHub OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-github)

