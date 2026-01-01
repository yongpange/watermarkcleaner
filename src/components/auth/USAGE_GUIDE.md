# 邮箱验证码认证系统 - 使用指南

## 📦 已完成的组件

### 后端
- ✅ 数据库表 (`wmc_email_verification_codes`)
- ✅ 验证码生成/验证逻辑
- ✅ 邮件发送服务 (Resend)
- ✅ API接口 (send-code, verify-code, check-user)
- ✅ NextAuth.js Credentials Provider 配置

### 前端
- ✅ Apple风格UI组件库
- ✅ 邮箱输入区域（实时用户检查）
- ✅ 6位验证码输入组件（支持粘贴）
- ✅ Google登录按钮
- ✅ 邮箱链接登录按钮
- ✅ 主认证模态框（集成所有功能）

---

## 🚀 快速开始

### 1. 配置环境变量

确保 `.env.local` 包含以下配置：

```bash
# Resend 配置
RESEND_API_KEY="your_resend_api_key"
EMAIL_FROM="WatermarkCleaner <noreply@watermarkcleaner.com>"

# NextAuth
AUTH_SECRET="your_auth_secret"
NEXTAUTH_URL="http://localhost:3002"

# Supabase（已存在）
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

### 2. 执行数据库迁移

在 Supabase SQL 编辑器中运行：

```bash
# 方式1：使用迁移文件
npx supabase migration up

# 方式2：直接执行SQL
psql -f scripts/setup-email-verification.sql

# 方式3：在 Supabase 控制台中运行
cat scripts/setup-email-verification.sql | xclip -selection clipboard
# 然后粘贴到 Supabase > SQL Editor
```

### 3. 在页面中使用 AuthModal

```tsx
'use client';

import { useState } from 'react';
import { AuthModal } from '@/components/auth/auth-modal';
import { AppleButton } from '@/components/auth/apple-style/button';

export default function ExamplePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div>
      <h1>我的应用</h1>

      <AppleButton onClick={() => setShowAuthModal(true)}>
        登录
      </AppleButton>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="email-code"
      />
    </div>
  );
}
```

---

## 🎨 组件API

### AuthModal（主组件）

```tsx
interface AuthModalProps {
  isOpen: boolean;              // 是否显示弹窗
  onClose: () => void;          // 关闭回调
  defaultMode?: 'email-code' | 'magic-link';  // 默认模式
}
```

#### 使用示例：

```tsx
<AuthModal
  isOpen={showAuthModal}
  onClose={() => setShowAuthModal(false)}
  defaultMode="email-code"  // 默认使用邮箱验证码
/>
```

---

## 🔄 完整认证流程

### 1. 用户点击登录按钮
```tsx
<AppleButton onClick={() => setShowAuthModal(true)}>
  登录
</AppleButton>
```

### 2. 弹窗显示
- 毛玻璃背景 + 缩放动画
- 显示邮箱输入框
- 实时检查用户是否存在

### 3. 发送验证码
- 输入邮箱后点击"发送验证码"
- 调用 `/api/auth/send-code` API
- 显示60秒倒计时
- 验证码输入框淡入动画

### 4. 输入验证码
- 6个独立输入框，自动跳转
- 支持粘贴填充
- 调用 `/api/auth/verify-code` API

### 5. 验证成功
- NextAuth 自动登录
- 重定向到 `/my-credits`
- 关闭弹窗

---

## 🎯 自定义样式

### Apple风格组件

所有 Apple 风格组件都支持 Tailwind CSS 类名：

```tsx
<AppleButton
  variant="primary"  // primary | secondary | ghost | social
  size="large"       // small | medium | large
  fullWidth          // 占满整行
  loading            // 加载状态
  className="mt-4"   // 自定义样式
>
  自定义按钮
</AppleButton>
```

### 主题自定义

修改 `src/components/auth/apple-style/button.tsx` 和 `input.tsx` 中的颜色值：

```tsx
// button.tsx 中的颜色配置
const variantStyles = {
  primary: [
    'bg-blue-500',      // 改为你的品牌色
    'hover:bg-blue-600',
    // ...
  ],
  // ...
};
```

---

## 🛡️ 安全特性

1. **速率限制**
   - 每个IP每小时最多发送5次验证码
   - `/api/auth/send-code` 自动实现

2. **验证码限制**
   - 每个验证码最多尝试3次
   - 5分钟后自动过期
   - 使用后失效（一次性）

3. **HTTPS强制**
   - 生产环境必须启用HTTPS
   - `.env.local` 中设置 `NEXTAUTH_URL=https://...`

4. **CORS保护**
   - API路由内置CORS保护
   - 只允许同源请求

---

## 📊 调试和监控

### 日志输出

```typescript
// 发送验证码成功
console.log('[SendCode] Email sent successfully', { email, emailId });

// 验证码验证成功
console.log('[VerifyCode] Verification successful', { recordId });

// NextAuth 登录成功
console.log('[Credentials] Authorization successful', { userId });
```

### 错误处理

```typescript
// 发送验证码失败
console.error('[SendCode] Failed to send email:', error);

// 验证失败
console.error('[VerifyCode] Verification failed:', error);

// 数据库错误
console.error('[Verification] Database error:', error);
```

---

## 🌍 国际化支持

### 多语言邮件模板

修改 `src/lib/email/resend.ts`：

```typescript
const templates = {
  zh: {
    subject: '您的验证码 - WatermarkCleaner',
    greeting: '您好！',
    // ...
  },
  en: {
    subject: 'Your Verification Code - WatermarkCleaner',
    greeting: 'Hello!',
    // ...
  },
};
```

### UI文本国际化

```tsx
// 使用 next-intl
t('auth.sendCodeButton');
t('auth.verifyCodeButton');
t('auth.googleLogin');
t('auth.magicLinkLogin');
```

---

## 🧪 测试指南

### 1. 单元测试

```bash
npm test src/components/auth/email-input-section.test.tsx
npm test src/lib/auth/verification.test.ts
```

### 2. 集成测试

```bash
npm test src/components/auth/auth-modal.test.tsx
```

### 3. E2E测试

```bash
npm run test:e2e
```

使用 Playwright 测试完整登录流程：

```typescript
// tests/e2e/auth.spec.ts
test('user can login with email code', async ({ page }) => {
  await page.goto('/');
  await page.click('text=登录');

  // 输入邮箱
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('text=发送验证码');

  // 输入验证码（测试环境使用固定验证码）
  await page.fill('input[type="text"]', '123456');

  // 提交并验证登录成功
  await page.click('text=验证并登录');
  await page.waitForURL('**/my-credits');
});
```

---

## 🚦 生产部署清单

- [ ] 配置生产环境变量
- [ ] 执行数据库迁移
- [ ] 验证 Resend API Key
- [ ] 配置自定义发送域名
- [ ] 设置 NEXTAUTH_URL（HTTPS）
- [ ] 配置 Google OAuth 凭据
- [ ] 测试邮件发送
- [ ] 测试完整登录流程
- [ ] 配置速率限制阈值
- [ ] 添加监控和日志

---

## 🔧 故障排查

### 问题1：邮件发送失败

**症状**：验证码发送按钮一直显示"发送中..."，然后失败

**解决方案**：
1. 检查 `.env.local` 中的 `RESEND_API_KEY`
2. 验证 `EMAIL_FROM` 是否已验证
3. 检查 Supabase Edge Functions 环境变量
4. 查看控制台错误日志

### 问题2：验证码验证失败

**症状**：输入正确验证码仍显示"验证码错误"

**解决方案**：
1. 检查数据库 `wmc_email_verification_codes` 表
2. 确认验证码未过期（5分钟）
3. 检查 NextAuth.js 配置
4. 查看尝试次数是否超过3次

### 问题3：用户检查失败

**症状**：输入邮箱后没有提示用户是否存在

**解决方案**：
1. 检查 `/api/auth/check-user` API 是否正常运行
2. 验证 Supabase 连接
3. 检查 `wmc_users` 表是否存在

---

## 📈 性能优化

1. **数据库索引**
   - `wmc_email_verification_codes` 表已添加索引
   - 确保查询性能

2. **代码拆分**
   - 所有组件按功能拆分
   - 按需加载（Next.js 自动优化）

3. **动画优化**
   - 使用 Framer Motion 的 spring 动画
   - GPU 加速的 transform 和 opacity

---

## 🎉 完成

恭喜！你已经成功实现了完整的邮箱验证码认证系统。

### 主要特性：
- ✅ 无密码登录/注册
- ✅ 6位数字验证码
- ✅ Apple 设计风格
- ✅ 完整的动画系统
- ✅ 响应式布局
- ✅ 安全可靠

如果遇到问题，请查看上面的故障排查指南。
