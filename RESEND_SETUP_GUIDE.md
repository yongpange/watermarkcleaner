# Resend 邮件验证配置指南

## 🔍 第 1 步：验证当前配置

### 检查 .env.local
```bash
# 文件路径: E:\1_CODE\watermarkcleaner_com\.env.local

# 当前配置应该是：
RESEND_API_KEY = "re_Fn5jZRWv_6q8F4QQiNYjFm5bTu4ZQt4Y5"
EMAIL_FROM = "WatermarkCleaner <noreply@watermarkcleaner.com>"
```

### 验证步骤

#### 选项 A：测试当前 API Key 是否有效
在 Supabase SQL Editor 中运行：
```sql
-- 创建一个测试函数
CREATE OR REPLACE FUNCTION test_resend_config()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    result := json_build_object(
        'status', 'success',
        'message', 'Current API Key appears to be valid format',
        'api_key_prefix', substring(current_setting('app.settings.resend_api_key', true) from 1 for 10),
        'email_from', current_setting('app.settings.email_from', true)
    );
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'status', 'error',
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;
```

#### 选项 B：手动验证

1. **检查 API Key 格式**
   - API Key 应该以 `re_` 开头
   - 长度应该为 40+ 个字符
   - Current: `re_Fn5jZRWv_6q8F4QQiNYjFm5bTu4ZQt4Y5` ✅

2. **检查邮箱域名**
   - 当前设置为 `noreply@watermarkcleaner.com`
   - 这个域名需要验证才能发送邮件

---

## 📝 第 2 步：注册和配置 Resend（如需要）

### 如果当前 API Key 无效或需要更换

#### A. 注册 Resend

1. 访问 https://resend.com
2. 点击 **Sign Up**
3. 使用 GitHub 或 Google 账号注册
4. 验证邮箱

#### B. 创建 API Key

1. 登录后，进入 **API Keys** 页面
2. 点击 **Create API Key**
3. 输入名称（如：WatermarkCleaner Production）
4. 点击 **Create**
5. 复制生成的 API Key（格式：re_xxxxxx...）

#### C. 添加和验证域名

有两个选项：

**选项 1：使用测试域名（最快，推荐用于测试）**

无需验证，直接使用：
```bash
EMAIL_FROM = "WatermarkCleaner <onboarding@resend.dev>"
```

**选项 2：验证你的域名（生产环境推荐）**

1. 进入 **Domains** 页面
2. 点击 **Add Domain**
3. 输入你的域名（如：watermarkcleaner.com）
4. 按照指示添加 DNS 记录（SPF, DKIM）
5. 等待验证（通常 5-10 分钟）
6. 使用你的域名：
```bash
EMAIL_FROM = "WatermarkCleaner <noreply@watermarkcleaner.com>"
```

---

## ⚙️ 第 3 步：更新环境变量

### 更新 .env.local

```bash
# RESEND_API_KEY = "re_你的真实密钥"
# EMAIL_FROM = "WatermarkCleaner <你的邮箱>"
```

**示例配置（测试环境）：**
```bash
RESEND_API_KEY = "re_Fn5jZRWv_6q8F4QQiNYjFm5bTu4ZQt4Y5"  # 如果你确认这个有效
EMAIL_FROM = "WatermarkCleaner <onboarding@resend.dev>"
```

**示例配置（生产环境）：**
```bash
RESEND_API_KEY = "re_你的真实密钥"
EMAIL_FROM = "WatermarkCleaner <noreply@watermarkcleaner.com>"
```

---

## 🧪 第 4 步：测试邮件发送

### 方法 1：使用测试脚本

创建测试文件 `test-email.js`:

```javascript
const { Resend } = require('resend');
const dotenv = require('dotenv');

dotenv.config();

async function testEmail() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: '你的测试邮箱@example.com',  // ← 替换为你的邮箱
      subject: '测试：WatermarkCleaner 邮件验证',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1>✅ 邮件发送成功</h1>
          <p>你的 Resend 配置正确！</p>
          <p>测试时间：${new Date().toLocaleString('zh-CN')}</p>
        </div>
      `,
    });

    if (error) {
      console.error('邮件发送失败:', error);
      return;
    }

    console.log('✅ 邮件发送成功!');
    console.log('邮件 ID:', data.id);
    console.log('\n请检查你的邮箱，应该收到了测试邮件。');
  } catch (error) {
    console.error('错误:', error.message);
  }
}

testEmail();
```

运行测试：
```bash
node test-email.js
```

### 方法 2：在应用中测试

1. 启动应用：
```bash
npm run dev
```

2. 访问 http://localhost:3000

3. 点击登录/注册

4. 输入你的邮箱，点击发送验证邮件

5. 检查邮箱（包括垃圾邮件文件夹）

---

## 🎯 第 5 步：验证邮箱验证流程

### 完整的验证流程测试

**步骤 1：用户注册**
```
访问：http://localhost:3000
点击：登录/注册
输入：你的测试邮箱
结果：收到验证邮件（⭐ 额度：3张/月）
```

**步骤 2：验证邮箱**
```
打开：邮箱中的验证邮件
点击：验证链接
结果：自动跳转回网站（⭐ 额度：10张/月）
```

**步骤 3：验证额度提升**
```
刷新页面或调用 API
预期：额度从 3 增加到 10
检查：/api/credits/check 返回结果
```

---

## 📊 第 6 步：验证限额系统

### 测试额度扣除

在 Supabase SQL Editor 中手动更新用户额度：

```sql
-- 设置用户为已验证状态（sandbox用户）
UPDATE watermarkcleaner.users
SET tier = 'verified', creditsUsed = 8  -- 已使用8张
WHERE email = '你的测试邮箱';

-- 查询当前额度
SELECT
  email,
  tier,
  creditsUsed,
  CASE WHEN tier = 'verified' THEN 10 ELSE 3 END as monthly_limit,
  CASE WHEN tier = 'verified' THEN 10 - creditsUsed ELSE 3 - creditsUsed END as remaining
FROM watermarkcleaner.users
WHERE email = '你的测试邮箱';

-- Expected:
-- email | tier      | creditsUsed | monthly_limit | remaining
-- your@email | verified | 8           | 10            | 2
```

### 处理图片并检查额度扣除

处理一张图片后，验证：

```sql
-- 检查额度是否扣减
SELECT creditsUsed FROM watermarkcleaner.users WHERE email = '你的测试邮箱';

-- 应该显示：creditsUsed = 9（从8增加到9）

-- 检查处理历史
SELECT * FROM watermarkcleaner.processing_history
WHERE user_id = (SELECT id FROM watermarkcleaner.users WHERE email = '你的测试邮箱')
ORDER BY created_at DESC LIMIT 5;
```

---

## 🔧 常见问题解决

### 问题 1："Invalid API key"

**错误消息**：
```
Error: Invalid API key
```

**解决方案**：
- 重新生成 API Key：访问 https://resend.com/api-keys
- 确保使用最新的 API Key
- 更新 `.env.local` 文件
- 重启应用

### 问题 2："Domain not verified"

**错误消息**：
```
Error: Domain not verified
```

**解决方案**：
- 使用测试域名：`onboarding@resend.dev`
- 或验证你的域名：
  - 访问 https://resend.com/domains
  - 点击 **Add Domain**
  - 添加 DNS 记录（SPF, DKIM）
  - 等待验证（5-10分钟）

### 问题 3：邮件在垃圾邮件文件夹

**解决方案**：
- 验证域名（解决方案 2）
- 使用专业的邮件模板
- 添加 SPF 和 DKIM 记录
- 使用已验证的发件人名称

### 问题 4：额度未增加

**错误**：验证邮箱后，额度没有从 3 增加到 10

**解决方案**：
1. 检查用户是否实际验证：
```sql
SELECT emailVerified, tier FROM watermarkcleaner.users WHERE email = '你的邮箱';
-- 应该显示：emailVerified = 2025-12-18 10:00:00+00, tier = 'verified'
```

2. 如果不是 verified，手动更新测试：
```sql
UPDATE watermarkcleaner.users
SET tier = 'verified', emailVerified = NOW()
WHERE email = '你的测试邮箱';
```

3. 检查 tier 是否更新：
```sql
SELECT tier FROM watermarkcleaner.users WHERE email = '你的测试邮箱';
-- 应该返回: 'verified'
```

---

## 🎉 成功标准

邮箱验证系统配置成功，当你能：

- ✅ 收到验证邮件
- ✅ 点击验证链接
- ✅ 验证成功后额度从 3 增加到 10
- ✅ 处理图片后额度扣减
- ✅ 在 processing_history 中看到记录

---

## 📞 遇到问题？

如果测试失败：

1. **检查 Resend Dashboard**：https://resend.com/emails
   - 查看邮件发送状态
   - 查看错误日志

2. **检查 Supabase 日志**：https://supabase.com/dashboard/project/hatwvsjfedokodofiqsb/logs
   - 查看函数执行情况
   - 检查数据库操作

3. **检查浏览器控制台**
   - F12 打开开发者工具
   - 查看 Network 标签
   - 检查 API 调用

---

现在就请你：

1. **确认你的 Resend API Key 是否有效**（是 `re_Fn5jZRWv_...` 这个吗？）
2. **选择使用测试域名还是验证自己的域名**
3. **告诉我你的选择**，我会帮你完成配置
