# IP 哈希调试和问题排查指南

## 🎯 问题总结

你遇到了两个问题：

1. **额度不更新**：未登录用户使用1次后，额度显示仍然是 0/3
2. **IP 哈希不一致**：担心 `IP_HASH_SALT` 被覆盖，导致同一IP哈希出不同结果

## 🔧 已应用的修复

### 1. 增强 IP_HASH_SALT 保护 (`src/lib/security/ip-hash.ts`)

**改动**：
- 使用 `let` 而非 `const` 声明，防止意外覆盖
- 添加详细的验证和警告日志
- 检测盐值格式是否正确（64字符十六进制）
- 如果在开发环境，显示盐值加载确认

**关键代码**：
```typescript
let IP_HASH_SALT = process.env.IP_HASH_SALT as string;

if (!IP_HASH_SALT) {
  console.warn('⚠️  WARNING: IP_HASH_SALT not found!');
  // ...生成临时盐值并警告
} else {
  // 验证格式
  if (!/^[a-f0-9]{64}$/.test(IP_HASH_SALT)) {
    console.warn('⚠️  WARNING: IP_HASH_SALT should be 64-character hex string');
  }
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔑 IP_HASH_SALT loaded: ${IP_HASH_SALT.substring(0, 10)}...`);
  }
}
```

### 2. 添加详细日志到关键 API

#### `/api/credits/check-ip` (额度检查)
- 显示原始 IP、哈希盐值、完整哈希值
- 显示查询参数和结果
- 显示完整的查询条件

#### `/api/seededit` (真实 AI API)
- 显示认证状态和 userId
- 显示 IP 信息（原始 IP、盐值、哈希值）
- 显示数据库插入的数据
- 显示查询语句示例

#### `/api/mock-seededit` (模拟 API)
- 与真实 API 相同的日志格式
- 确认记录插入成功

#### `checkUserCredits` (核心逻辑)
- 显示完整的 Supabase 查询条件
- 显示查询结果和统计
- 显示最终返回的额度信息

### 3. 创建验证脚本 (`scripts/verify-ip-hashing.js`)

使用方法：
```bash
node scripts/verify-ip-hashing.js
```

功能：
- 验证环境变量中的 IP_HASH_SALT 是否存在
- 测试同一个 IP 的哈希是否一致（多次哈希对比）
- 检查数据库中的记录
- 提供完整的诊断报告

## 🐛 如何调试额度不更新的问题

### 步骤 1：运行验证脚本

```bash
node scripts/verify-ip-hashing.js
```

期望输出：
```
✅ IP_HASH_SALT is configured
✅ Hashing is consistent
✅ All tests passed!
```

### 步骤 2：重启 Next.js 开发服务器

```bash
npm run dev
```

在控制台查找：
```
🔑 IP_HASH_SALT loaded: 1f8b83c74...
```

这确认了盐值被正确加载。

### 步骤 3：打开浏览器控制台

访问 `/convert` 页面，查看 Console：
1. **页面加载时**：
   ```
   [Credits API] ===== Credit Check Started =====
   [Credits API] Raw IP: "127.0.0.1" (或其他 IP)
   [Credits API] IP Hash Salt: "1f8b83c74..."
   [Credits API] Hashed IP: "18849ddcfb4ac7c006228118ee75b12cea0f541bb8dea1b2977a8d82f89705de"
   [Credits API] Query result count: 0
   [Credits API] Final result: { tier: "unverified", used: 0, limit: 3, remaining: 3 }
   ```

2. **处理图片后**（Mock API 模式）：
   ```
   [Mock API] Processing complete
   [Mock API] ===== Processing Complete - Recording History =====
   [Mock API] isAuthenticated: false
   [Mock API] userId: N/A (guest)
   [Mock API] IP Information:
     - Raw IP: 127.0.0.1
     - Hash salt: 1f8b83c74...
     - Hashed IP: 18849ddcfb4ac7c006228118ee75b12cea0f541bb8dea1b2977a8d82f89705de
     - Is authenticated: false
     - Will store IP hash: true
   [Mock API] Recording to wmc_processing_history: { ... }
   [Mock API] Processing history recorded successfully
   [Mock API] Query this record with:
     SELECT * FROM wmc_processing_history WHERE ip_address = '18849ddcfb4ac7c006228118ee75b12cea0f541bb8dea1b2977a8d82f89705de'
   ```

### 步骤 4：验证数据库记录

在 Supabase SQL Editor 中执行：

```sql
-- 查询最新的记录
SELECT * FROM public.wmc_processing_history
WHERE ip_address = '18849ddcfb4ac7c006228118ee75b12cea0f541bb8dea1b2977a8d82f89705de'
ORDER BY created_at DESC
LIMIT 10;
```

期望结果：每次处理都应该有一条新记录。

### 步骤 5：刷新页面验证额度更新

处理图片后，刷新 `/convert` 页面，查看 Console：

```
[Credits API] Query result count: 1  (应该是 1，不是 0)
[Credits API] Final result: { tier: "unverified", used: 1, limit: 3, remaining: 2 }
```

页面上应该显示：
```
Monthly usage: 1 / 3 images
Remaining: 2 images
```

## 🔍 常见问题排查

### 问题 1：Query result count 始终是 0

可能原因和解决方案：

1. **时区不匹配**
   - SQL 查询中使用 `date_trunc('month', CURRENT_DATE)` 可能在某些时区不正确
   - 修复：修改查询为使用 UTC 时间或添加时区偏移

2. **IP 哈希不匹配**
   - 检查度检查时使用的哈希是否与存储时相同
   - 查看日志中 `[Credits Check] Hashed IP:` 和 `[Mock API] Hashed IP:` 是否一致

3. **数据库插入失败**
   - 检查 `[Mock API] Failed to record processing history` 错误
   - 验证 Supabase Service Role Key 是否正确

### 问题 2：IP 哈希不一致

运行验证脚本：
```bash
node scripts/verify-ip-hashing.js
```

如果显示：
```
❌ ERROR: Hashes should be identical!
```

说明 `IP_HASH_SALT` 确实在变化。

解决方案：
1. 检查是否有脚本覆盖 `process.env.IP_HASH_SALT`
2. 确保 `.env.local` 中有正确的盐值
3. 重启 Next.js 服务器

### 问题 3：Mock API 和真实 API 行为不同

验证：
1. 检查 `.env.local` 中的 `NEXT_PUBLIC_USE_MOCK_API`
2. 如果为 `true`，检查 `/api/mock-seededit/route.ts` 的日志
3. 如果为 `false`，检查 `/api/seededit/route.ts` 的日志

两者应该都有完整的记录逻辑。

## ✅ 预期结果

正确配置后，你应该看到：

1. **环境变量**：`IP_HASH_SALT` 被加载且不变
2. **IP 哈希**：同一IP哈希结果始终相同
3. **数据库记录**：每次处理创建一条记录
4. **额度更新**：使用次数正确递增

完整流程：
```
处理前: Monthly usage: 0 / 3 images
处理后: Monthly usage: 1 / 3 images
再处理: Monthly usage: 2 / 3 images
再处理: Monthly usage: 3 / 3 images (额度用完)
```

## 📊 数据查询示例

查询某个 IP 的月度使用情况：

```sql
-- 替换为你的 IP 哈希值
WITH ip_hash AS (
  SELECT '18849ddcfb4ac7c006228118ee75b12cea0f541bb8dea1b2977a8d82f89705de' AS hashed_ip
)
SELECT
  COUNT(*) AS usage_count,
  MIN(created_at) AS first_use,
  MAX(created_at) AS last_use
FROM public.wmc_processing_history
WHERE ip_address = (SELECT hashed_ip FROM ip_hash)
  AND created_at >= date_trunc('month', CURRENT_DATE)
  AND success = true;
```

查询所有未登录用户的使用情况：

```sql
SELECT
  ip_address,
  COUNT(*) AS usage_count,
  MIN(created_at) AS first_use,
  MAX(created_at) AS last_use
FROM public.wmc_processing_history
WHERE user_id IS NULL
  AND created_at >= date_trunc('month', CURRENT_DATE)
  AND success = true
GROUP BY ip_address
ORDER BY usage_count DESC;
```

## 🚀 下一步

现在请：

1. **运行验证脚本**：`node scripts/verify-ip-hashing.js`
2. **重启开发服务器**：`npm run dev`
3. **测试图片处理**：上传并处理一张图片
4. **检查日志**：查看浏览器和服务器控制台
5. **验证数据库**：确认记录已创建
6. **刷新页面**：确认额度已更新

如果遇到问题，请提供：
- 验证脚本的完整输出
- 浏览器控制台的日志
- 服务器控制台的日志
- 数据库查询结果
