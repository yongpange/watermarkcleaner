# ✅ PostgREST Schema配置验证清单

## 🎯 核心验证目标

验证Supabase的PostgREST是否成功暴露了`watermarkcleaner` schema，使NextAuth能够正确访问用户表。

---

## 📋 验证步骤

### 步骤1: 测试邮箱验证功能（最直接）

**操作**:
1. 访问: http://localhost:3003/auth/verify
2. 输入邮箱: `2577388908@qq.com`
3. 点击: "发送验证邮件"

**预期结果**:
```
✅ 页面显示: "验证邮件已发送！"
✅ 页面跳转到: /auth/verify-request?email=2577388908@qq.com
✅ 无错误提示（无"请稍后重试"）
```

**验证成功标志**:
- 浏览器控制台无500错误
- Network标签显示POST /api/auth/signin/email 状态为200
- 页面显示成功消息而非错误

---

### 步骤2: 检查服务器日志（确认无错误）

**在运行 `npm run dev` 的终端中，你应该看到**:

```
✅ 正确日志示例:
[next-auth][debug][adapter_getUserByEmail] { args: [ '2577388908@qq.com' ] }
[next-auth][debug][CREATE_USER] { args: [ { email: '2577388908@qq.com', emailVerified: null } ] }
[next-auth][debug][verification_token_created] ...
✅ 发送验证邮件成功
```

**❌ 错误日志示例（如果配置失败）**:
```
[next-auth][error][adapter_error_getUserByEmail]
The schema must be one of the following: public, graphql_public
```

**如何查看**: 在终端中滚动到最新的日志（发送验证邮件后的日志）

---

### 步骤3: 检查邮箱收件箱（确认邮件到达）

**操作**:
1. 登录QQ邮箱: https://mail.qq.com
2. 检查收件箱（或垃圾邮件）
3. 查找发件人为: `WatermarkCleaner <onboarding@resend.dev>`
4. 邮件主题: "验证您的邮箱 - 获得更多额度"

**预期邮件内容**:
```
发件人: WatermarkCleaner <onboarding@resend.dev>
主题: 验证您的邮箱 - 获得更多额度
内容: 包含"验证邮箱地址"按钮/链接
```

**如果收到邮件**: ✅ 邮件发送功能正常
**如果未收到**: ⚠️ 检查垃圾邮件文件夹，或等待1-2分钟

---

### 步骤4: 点击验证链接（验证完整流程）

**操作**:
1. 在邮件中点击"验证邮箱地址"按钮
2. 浏览器会自动打开并跳转到 `/convert`

**预期结果**:
```
页面显示: ✅ 邮箱验证成功！（短暂显示）
额度显示: 📊 您的本月额度: 0/10 张（已提升！）
```

**验证成功标志**:
- 额度从3张提升到10张
- 用户等级从未验证变为已验证

---

### 步骤5: 检查数据库（最终验证）

**在Supabase控制台执行SQL查询**:

```sql
-- 查询用户信息
SELECT
  id,
  email,
  emailVerified,
  tier,
  creditsUsed,
  creditsReset
FROM watermarkcleaner.users
WHERE email = '2577388908@qq.com'
ORDER BY created_at DESC
LIMIT 1;
```

**预期查询结果**:
```
id          | email                | emailVerified           | tier      | creditsUsed | creditsReset
------------|----------------------|-------------------------|-----------|-------------|--------------
uuid-xxx    | 2577388908@qq.com    | 2025-12-21 23:45:00+00 | verified  | 0           | 2025-12-01
            |                      | ↑ 显示验证时间           | ↑ verified |             |
```

**验证成功标志**:
- `emailVerified` 有具体时间值（非null）
- `tier` = 'verified'
- `creditsUsed` = 0（或之前的使用量）

---

### 步骤6: 测试额度提升（功能验证）

**操作**:
1. 验证邮箱后（额度变为10张/月）
2. 上传并处理图片
3. 观察额度变化

**预期**:
```
第1张: ✓ 成功，额度显示 1/10
第2张: ✓ 成功，额度显示 2/10
...
第10张: ✓ 成功，额度显示 10/10
第11张: ❌ 拒绝，提示"额度已用完"
```

**验证成功标志**:
- 成功处理超过3张图片（证明额度已提升）
- 额度使用记录正确

---

## 📊 全部验证通过的标准

如果以下所有步骤都成功，说明配置完全正确：

- [ ] 步骤1: 发送验证邮件无500错误
- [ ] 步骤2: 服务器日志无schema错误
- [ ] 步骤3: 收件箱成功收到验证邮件
- [ ] 步骤4: 点击链接后额度从3→10张
- [ ] 步骤5: 数据库中emailVerified有值
- [ ] 步骤6: 可处理超过3张图片

成功数量: **6/6** = ✅ 配置完成

---

## 🔍 如果验证失败

### 场景1: 步骤1失败（显示错误/500）

**症状**:
- "发送验证邮件失败，请稍后重试"
- 浏览器控制台显示500错误

**解决**:
```bash
# 查看完整错误日志
cat server.log | grep -A 10 "adapter_error"

# 常见原因:
1. PostgREST未重启 - 重新执行Settings → API → Restart
2. SQL配置未生效 - 重新在SQL Editor中执行配置命令
3. 数据库连接失败 - 检查DATABASE_URL
```

### 场景2: 步骤3失败（邮件未收到）

**症状**:
- 所有步骤都成功，但邮箱未收到邮件

**解决**:
```bash
# 检查邮件配置
cat .env.local | grep EMAIL

# 应该显示:
EMAIL_FROM="WatermarkCleaner <onboarding@resend.dev>"

# 确认:
1. 检查垃圾邮件文件夹
2. 等待1-2分钟
3. Resend控制台查看发送状态
```

### 场景3: 步骤4失败（额度未提升）

**症状**:
- 邮件验证成功，但额度还是3张/月

**解决**:
```bash
# 检查NextAuth回调
# 确认callbacks.signIn是否正确设置用户tier

cat src/app/api/auth/[...nextauth]/route.ts

// 应该包含:
session: {
  strategy: 'database',
  callbacks: {
    async signIn({ user }) {
      // 设置用户为verified
    }
  }
}
```

---

## 🎯 总结

**配置成功的标准**:
1. ✅ 无schema权限错误
2. ✅ 邮件发送成功
3. ✅ 额度正确提升
4. ✅ 数据库记录正确

如果以上全部通过，说明PostgREST配置已生效，可以继续使用系统了！

现在开始测试吧，告诉我每一步的结果！
