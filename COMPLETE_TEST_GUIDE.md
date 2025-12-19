# 完整测试指南

## ✅ 前提条件

1. ✅ Supabase 表格已创建（watermarkcleaner schema）
2. ✅ Resend 已配置（API Key 和环境变量）
3. ✅ 应用已配置为使用 watermarkcleaner schema

## 🎯 第一步：测试邮件发送

### A. 运行测试脚本

```bash
cd "E:\1_CODE\watermarkcleaner_com"

node test-resend.js your-test-email@example.com
```

**替换**：`your-test-email@example.com` 为你的真实邮箱

**预期结果**：
```
✅ 邮件发送成功！

📧 邮件详情:
   邮件 ID: xxx-xxx
   状态: 已发送
   收件人: your-test-email@example.com

💡 请检查你的邮箱
```

### B. 如果测试失败

1. **检查 API Key 是否有效**
   - 访问 https://resend.com/api-keys
   - 检查是否有活跃状态的 API Key
   - 复制这个 Key 更新到 `.env.local`

2. **检查邮箱地址**
   - 测试邮箱要用真实邮箱
   - 测试域名 `onboarding@resend.dev` 不需要验证

3. **常见错误**
   - `401` - API Key 无效
   - `403` - 域名未验证（或邮箱地址不正确）

---

## 🎨 第二步：启动应用测试完整流程

### A. 启动开发服务器

```bash
cd "E:\1_CODE\watermarkcleaner_com"
npm run dev
```

应用将在 http://localhost:3000 启动

### B. 测试邮箱验证流程

**步骤 1：访问网站**
- 打开浏览器：http://localhost:3000
- 你应该看到首页

**步骤 2：进入登录页面**
- 点击右上角的 "登录" 或 "Sign In"
- 或访问：http://localhost:3000/auth/signin

**步骤 3：发送验证邮件**
1. 在邮箱输入框输入你的测试邮箱
2. 点击 "发送验证邮件" 或 "Send Verification Email"
3. 你应该看到："验证邮件已发送" 的提示

**步骤 4：检查邮箱**
1. 打开邮箱（包括垃圾邮件）
2. 查找来自 "WatermarkCleaner" 的邮件
3. 邮件标题应该是："验证您的邮箱 - 获得更多图片去水印额度"

**步骤 5：验证邮箱**
1. 打开邮件
2. 点击验证按钮或链接
3. 应该自动跳转回网站
4. 看到 "邮箱验证成功" 的提示

**步骤 6：验证额度提升**

登录后到数据库检查：

```sql
SELECT
  email,
  tier,
  emailVerified,
  creditsUsed,
  CASE WHEN tier = 'verified' THEN 10 ELSE 3 END as limit
FROM watermarkcleaner.users
WHERE email = '你的测试邮箱';

-- 应该返回：
-- email      | tier     | emailVerified        | creditsUsed | limit
-- 你的邮件   | verified | 2025-12-18 10:xx:xx.|      ?      |    10 ⭐
```

---

## 🧮 第三步：测试额度系统

### A. 测试已验证用户额度

```sql
-- 设置测试数据
UPDATE watermarkcleaner.users
SET
  tier = 'verified',
  creditsUsed = 8
WHERE email = '你的测试邮箱';

-- 验证当前状态
SELECT creditsUsed, 10 - creditsUsed as remaining
FROM watermarkcleaner.users
WHERE email = '你的测试邮箱';
-- 应该显示：creditsUsed = 8, remaining = 2
```

### B. 处理图片并检查扣除

**步骤 1**：使用应用处理一张图片（通过 /api/seededit）

**步骤 2**：处理后检查数据库

```sql
-- 1. 检查 users 表的额度是否扣减
SELECT
  u.creditsUsed,
  10 - u.creditsUsed as remaining
FROM watermarkcleaner.users u
WHERE email = '你的测试邮箱';

-- 应该显示：creditsUsed = 9（从8增加到9）

-- 2. 检查处理历史记录
SELECT
  id,
  user_id,
  image_size,
  success,
  created_at
FROM watermarkcleaner.processing_history
WHERE user_id = (SELECT id FROM watermarkcleaner.users WHERE email = '你的测试邮箱')
ORDER BY created_at DESC
LIMIT 1;

-- 应该能看到最近的处理记录
```

### C. 测试额度限制

**步骤 1**：将额度设置为已用完

```sql
UPDATE watermarkcleaner.users
SET creditsUsed = 10  -- 已用完10张额度
WHERE email = '你的测试邮箱';
```

**步骤 2**：尝试再处理图片
- 应该会收到错误："额度已用完" 或 "Monthly credits exhausted"
- HTTP 状态码：403 Forbidden

**步骤 3**：验证错误响应

```bash
# API 应该返回
curl -X POST http://localhost:3000/api/seededit \
  -F "image=@test.jpg"

# 预期响应：
# {"error":"Monthly credits exhausted","action":"Upgrade to Pro..."}
```

---

## 📊 第四步：验证月度重置

### 测试额度重置逻辑

```sql
-- 模拟上个月已用完额度
UPDATE watermarkcleaner.users
SET
  creditsUsed = 10,
  creditsReset = '2024-11-01 00:00:00' -- 设置为上个月
WHERE email = '你的测试邮箱';

-- 查询当前状态
SELECT
  email,
  tier,
  creditsUsed,
  creditsReset
FROM watermarkcleaner.users
WHERE email = '你的测试邮箱';

-- 应该显示：creditsReset = 2024-11-01（上个月）
```

**重启应用或等待下次查询时**，系统应该：
- 检测到 system 重置时间为上个月
- 自动重置 creditsUsed = 0
- 更新 creditsReset = 当前时间

**验证重置后**：

```sql
SELECT
  creditsUsed,      -- 应该 = 0
  creditsReset      -- 应该 = 当前时间
FROM watermarkcleaner.users
WHERE email = '你的测试邮箱';
```

---

## 🛡️ 第五步：测试 IP 限制

### 测试未登录用户限制

**步骤 1**：清除 cookies/使用隐私模式

**步骤 2**：不登录直接处理图片
- 前3张应该成功
- 第4张应该失败，错误："IP rate limit exceeded" 或 "额度已用完"

**步骤 3**：检查 IP 记录

```sql
-- 查看 IP 地址的处理记录
SELECT
  ip_address,
  COUNT(*) as total,
  COUNT(CASE WHEN success THEN 1 END) as successful
FROM watermarkcleaner.processing_history
WHERE user_id IS NULL  -- 未登录用户
  AND ip_address = '你的IP地址'
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
GROUP BY ip_address;

-- 应该显示：total = 4, successful = 3
-- 第4次因为超限所以记录但标记为失败
```

---

## ✅ 成功标准

邮箱验证系统完全正常，当你能够：

1. ✅ 收到验证邮件（1分钟内）
2. ✅ 点击验证链接成功
3. ✅ 验证后额度从 3 张增加到 10 张
4. ✅ 处理图片后额度扣减
5. ✅ 额度用完后收到错误提示
6. ✅ 在数据库中看到完整的处理历史记录
7. ✅ IP 限制对未登录用户生效

---

## 🐛 问题排查

### 问题 1：没有收到邮件

**检查**：
```javascript
// 检查 Resend 仪表板
https://resend.com/emails

// 状态应该是 "sent" 或 "delivered"
// 如果显示 "bounced" 或 "failed"，检查错误信息
```

**常见原因**：
- API Key 无效 → 重新生成
- 邮箱地址错误 → 检查格式
- 垃圾邮件文件夹 → 检查所有文件夹

### 问题 2：验证后额度未增加

**检查**：

```sql
-- 1. 检查用户 tier 是否更新
SELECT tier, emailVerified FROM watermarkcleaner.users WHERE email = '你的邮箱';
-- 应该显示: tier = 'verified', emailVerified = 时间戳

-- 2. 如果不是 verified，手动设置测试
UPDATE watermarkcleaner.users SET tier = 'verified' WHERE email = '你的邮箱';
```

**检查 NextAuth 回调**：
```typescript
// src/app/api/auth/[...nextauth]/route.ts
callbacks: {
  async signIn({ user, account, profile, email, credentials }) {
    console.log('signIn called for:', user.email)

    // 检查是否设置了 emailVerified
    if (user.emailVerified) {
      console.log('Email verified at:', user.emailVerified)

      // 更新用户 tier
      await supabase.from('watermarkcleaner.users')
        .update({ tier: 'verified' })
        .eq('id', user.id)
    }

    return true
  }
}
```

### 问题 3：额度扣减失败

**检查**：

1. **检查 race condition 修复**
```typescript
// src/lib/credits/check.ts
// 确保使用了 atomic increment
await supabase.from('watermarkcleaner.users').update({
  creditsUsed: { increment: 1 },  // 必须是 increment，不能直接 + 1
}).eq('id', userId)
```

2. **检查数据库权限**
```sql
-- 确保有 UPDATE 权限
GRANT UPDATE ON watermarkcleaner.users TO postgres;
```

---

## 📈 监控和日志

### 查看邮件发送日志

访问：https://resend.com/emails

应该看到所有发送的邮件和状态：
- ✅ Sent - 已发送
- ✅ Delivered - 已送达
- ⚠️  Bounced - 退信（检查邮箱地址）
- ❌ Failed - 失败（检查错误详情）

### 查看数据库历史

```sql
-- 处理历史统计
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total,
  COUNT(CASE WHEN success THEN 1 END) as successful,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM watermarkcleaner.processing_history
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
-- 显示最近7天的处理统计
```

---

## 🎁 额外功能测试

### 测试月度通知（可选）

如果想在用户额度即将用完时发送通知：

```sql
-- 查询剩余额度少于3张的用户
SELECT
  u.email,
  u.tier,
  u.creditsUsed,
  CASE WHEN u.tier = 'verified' THEN 10 ELSE 3 END as limit,
  CASE WHEN u.tier = 'verified' THEN 10 - u.creditsUsed ELSE 3 - u.creditsUsed END as remaining
FROM watermarkcleaner.users u
WHERE (
  (u.tier = 'verified' AND (10 - u.creditsUsed) <= 3)
  OR (u.tier = 'unverified' AND (3 - u.creditsUsed) <= 1)
)
AND u.creditsUsed < CASE WHEN u.tier = 'verified' THEN 10 ELSE 3 END;
```

---

现在请开始测试！

1. **第一步**：运行测试脚本
   ```bash
   node test-resend.js your-email@example.com
   ```

2. **第二步**：启动应用并测试完整流程

测试过程中遇到任何问题，请：
   - 截图错误信息
   - 告诉我你做到哪一步了
   - 我会帮你一起排查
