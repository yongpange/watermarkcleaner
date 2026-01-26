# 额度显示不一致问题修复文档

## 问题描述

**现象**：
- 前端显示：已使用 2 / 3 张（剩余 1 张）
- 后端提示：额度已用完（Credit limit exceeded）
- 实际处理：用户已经处理了 3 张图片

**根本原因**：
用户在登录前后都处理了图片，但系统只统计登录后的记录。

---

## 问题根源分析

### 1. 记录方式不一致

**登录前（未认证）**：
```sql
INSERT INTO wmc_processing_history (
  user_id,        -- NULL
  ip_address,     -- 'hashed-ip-address'
  image_size,
  success,
  created_at
) VALUES (...)
```

**登录后（已认证）**：
```sql
INSERT INTO wmc_processing_history (
  user_id,        -- 'user-id'
  ip_address,     -- NULL  ❌ 这里有问题！
  image_size,
  success,
  created_at
) VALUES (...)
```

### 2. 查询逻辑缺陷

**原查询代码**（`src/lib/credits/check-legacy.ts:42-46`）：
```typescript
const { count, error: countError } = await (supabase as any)
  .from('wmc_processing_history')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)  // ❌ 只查询 user_id，忽略了 ip_address 记录
  .eq('success', true);
```

**问题**：只查询了 `user_id` 的记录，完全忽略了该用户登录前通过 IP 地址处理的记录。

---

## 修复方案

### 修改1：记录逻辑修复

**文件**：`src/app/api/seededit/route.ts`

**位置**：第476-482行

**修改前**（第478行）：
```typescript
const recordData = {
  user_id: isAuthenticated && userId ? userId : null,
  ip_address: isAuthenticated && userId ? null : hashedIP,  // ❌ 登录用户不记录 IP
  image_size: image.size,
  success: true,
  created_at: new Date().toISOString(),
};
```

**修改后**（第478行）：
```typescript
const recordData = {
  user_id: isAuthenticated && userId ? userId : null,
  ip_address: hashedIP,  // ✅ 无论是否登录，都记录 IP
  image_size: image.size,
  success: true,
  created_at: new Date().toISOString(),
};
```

**说明**：
- 登录前：`user_id = null`, `ip_address = 'hashed-ip'`
- 登录后：`user_id = 'user-id'`, `ip_address = 'hashed-ip'` ✅

---

### 修改2：查询逻辑修复

**文件**：`src/lib/credits/check-legacy.ts`

**位置**：`checkCredits()` 函数（第20-94行）

**修改前**：
```typescript
export async function checkCredits(userId: string) {
  const supabase = createAdminClient();

  // 只查询 user_id 的记录
  const { count, error: countError } = await (supabase as any)
    .from('wmc_processing_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)  // ❌ 漏掉了 ip_address 记录
    .eq('success', true);

  // ...
}
```

**修改后**：
```typescript
export async function checkCredits(userId: string) {
  const supabase = createAdminClient();

  console.log(`[Credits] [${getTimestamp()}] Checking credits for user: ${userId}`);

  // Get user data from database to determine tier
  const { data: user, error: userError } = await (supabase as any)
    .from('wmc_users')
    .select('tier')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error(`[Credits] [${getTimestamp()}] Failed to fetch user:`, userError);
    throw new Error('User not found');
  }

  console.log(`[Credits] [${getTimestamp()}] User fetched:`, { userId, tier: user.tier });

  // 1. 获取该用户所有处理记录中的 IP 地址（包括登录前和登录后的）
  console.log(`[Credits] [${getTimestamp()}] Fetching user's IP addresses from processing history...`);
  const { data: userRecords, error: fetchError } = await (supabase as any)
    .from('wmc_processing_history')
    .select('ip_address')
    .eq('user_id', userId)
    .eq('success', true);

  if (fetchError) {
    console.error(`[Credits] [${getTimestamp()}] Failed to fetch user records:`, fetchError);
    throw new Error('Failed to check credits');
  }

  // 2. 获取该用户用过的所有 IP 地址（去重，过滤空值）
  const userIPs = [...new Set(userRecords.map(r => r.ip_address).filter(Boolean))];
  console.log(`[Credits] [${getTimestamp()}] User IPs found:`, { count: userIPs.length, ips: userIPs });

  // 3. 构建查询条件，包括 user_id 和所有的 ip_address
  // 使用 OR 逻辑：(user_id = ? OR ip_address = ? OR ip_address = ? OR ...)
  const ipConditions = userIPs.map(ip => `ip_address.eq.${ip}`).join(',');
  const orCondition = `user_id.eq.${userId}${ipConditions ? `,${ipConditions}` : ''}`;

  console.log(`[Credits] [${getTimestamp()}] Querying with OR condition:`, orCondition);

  // 4. 查询所有相关的处理记录（包括通过 user_id 和 ip_address 的）
  const { count, error: countError } = await (supabase as any)
    .from('wmc_processing_history')
    .select('*', { count: 'exact', head: true })
    .or(orCondition)  // ✅ 同时查询 user_id 和 ip_address
    .eq('success', true);

  if (countError) {
    console.error(`[Credits] [${getTimestamp()}] Failed to count processing history:`, countError);
    throw new Error('Failed to check credits');
  }

  const used = count ?? 0;
  const tier: UserTier = (user.tier as UserTier) || 'unverified';
  const tierConfig = USER_TIER_CONFIG[tier];

  console.log(`[Credits] [${getTimestamp()}] Credit check complete:`, {
    userId,
    tier,
    used,
    limit: tierConfig.maxPerMonth,
    remaining: Math.max(0, tierConfig.maxPerMonth - used)
  });

  return {
    tier,
    used,
    limit: tierConfig.maxPerMonth,
    remaining: Math.max(0, tierConfig.maxPerMonth - used),
  };
}
```

**修复逻辑**：
1. **获取用户IP地址**：查询该用户所有处理记录中的 IP 地址（`SELECT ip_address FROM wmc_processing_history WHERE user_id = ?`）
2. **去重处理**：去重并过滤空值
3. **构建查询条件**：使用 OR 逻辑构建查询（`user_id = ? OR ip_address = ? OR ip_address = ?`）
4. **查询所有记录**：统计所有相关的处理记录（包括登录前和登录后的）

---

## 修复效果

### 修改前

**数据库记录**：
```
| id | user_id | ip_address   | success | created_at           |
|----|---------|--------------|---------|----------------------|
| 1  | NULL    | hashed-ip-1  | true    | 2026-01-25 10:00:00  |  ← 登录前处理
| 2  | user-1  | NULL         | true    | 2026-01-25 10:30:00  |  ← 登录后处理
| 3  | user-1  | NULL         | true    | 2026-01-25 11:00:00  |  ← 登录后处理
```

**查询**：`SELECT COUNT(*) WHERE user_id = 'user-1'` → 返回 **2** ❌

**显示结果**：
- 已使用：2 / 3
- 剩余：1
- 实际处理：3

### 修改后

**数据库记录**（登录后也记录 IP）：
```
| id | user_id | ip_address   | success | created_at           |
|----|---------|--------------|---------|----------------------|
| 1  | NULL    | hashed-ip-1  | true    | 2026-01-25 10:00:00  |  ← 登录前处理
| 2  | user-1  | hashed-ip-1  | true    | 2026-01-25 10:30:00  |  ← 登录后处理
| 3  | user-1  | hashed-ip-1  | true    | 2026-01-25 11:00:00  |  ← 登录后处理
```

**查询**：`SELECT COUNT(*) WHERE user_id = 'user-1' OR ip_address = 'hashed-ip-1'` → 返回 **3** ✓

**显示结果**：
- 已使用：3 / 3
- 剩余：0
- 实际处理：3

---

## 验证方法

### 1. 观察控制台日志

当用户处理图片时，查看浏览器/服务器控制台：

```javascript
// 登录前（第一次处理）
[SeedEdit API] [2026-01-25T10:00:00.000Z] Recording processing history record: {
  "user_id": null,
  "ip_address": "hashed-ip-1",
  "image_size": 123456,
  "success": true,
  "created_at": "2026-01-25T10:00:00.000Z"
}

// 登录后（第二次处理）
[SeedEdit API] [2026-01-25T10:30:00.000Z] Recording processing history record: {
  "user_id": "user-1",
  "ip_address": "hashed-ip-1",  // ✅ 现在登录也记录 IP 了
  "image_size": 234567,
  "success": true,
  "created_at": "2026-01-25T10:30:00.000Z"
}

// 查询额度时
[Credits] [2026-01-25T11:00:00.000Z] User IPs found: {
  "count": 1,
  "ips": ["hashed-ip-1"]
}
[Credits] [2026-01-25T11:00:00.000Z] Querying with OR condition: "user_id.eq.user-1,ip_address.eq.hashed-ip-1"
[Credits] [2026-01-25T11:00:00.000Z] Credit check complete: {
  "userId": "user-1",
  "tier": "unverified",
  "used": 2,          // ✅ 正确统计了所有记录
  "limit": 3,
  "remaining": 1
}
```

### 2. 数据库查询验证

执行以下 SQL 查询来验证：

```sql
-- 1. 查看某个用户的所有处理记录
SELECT
  id,
  user_id,
  ip_address,
  success,
  created_at
FROM wmc_processing_history
WHERE user_id = 'user-1' OR ip_address IN (
  SELECT DISTINCT ip_address
  FROM wmc_processing_history
  WHERE user_id = 'user-1' AND ip_address IS NOT NULL
)
ORDER BY created_at DESC;

-- 2. 统计该用户的总处理数量
WITH user_ips AS (
  SELECT DISTINCT ip_address
  FROM wmc_processing_history
  WHERE user_id = 'user-1' AND ip_address IS NOT NULL
)
SELECT
  COUNT(*) as total_processed
FROM wmc_processing_history
WHERE user_id = 'user-1'
   OR ip_address IN (SELECT ip_address FROM user_ips);

-- 预期结果：total_processed = 3（如果用户处理了3张图片）
```

### 3. 前端显示验证

打开 CreditsDisplay 组件，查看显示：

```
免费试用
已使用: 3 / 3
剩余: 0
```

尝试处理新图片时，应该正确显示"额度已用完"，不再出现不一致的情况。

---

## 技术细节

### Supabase OR 查询语法

本项目使用 Supabase 的 PostgREST API，OR 查询语法如下：

```typescript
// 基础格式
.or('column1.eq.value1,column2.eq.value2')

// 示例：查询 user_id = 'user-1' OR ip_address = 'ip-1' OR ip_address = 'ip-2'
.or('user_id.eq.user-1,ip_address.eq.ip-1,ip_address.eq.ip-2')

// 在代码中的应用
const ipConditions = userIPs.map(ip => `ip_address.eq.${ip}`).join(',');
const orCondition = `user_id.eq.${userId}${ipConditions ? `,${ipConditions}` : ''}`;

const { count } = await supabase
  .from('wmc_processing_history')
  .select('*', { count: 'exact', head: true })
  .or(orCondition)
  .eq('success', true);
```

### Set 去重

```typescript
// 从数组中去重并过滤空值
const userIPs = [...new Set(userRecords.map(r => r.ip_address).filter(Boolean))];

// 示例：
// 输入: [null, 'ip-1', 'ip-1', 'ip-2', null]
// 输出: ['ip-1', 'ip-2']
```

---

## 总结

### 问题一句话总结
用户登录前后都处理了图片，但系统只统计登录后的记录，导致**实际处理3张，但显示2张**。

### 修复两步走

**第一步**：修改记录逻辑（`src/app/api/seededit/route.ts`）
- 登录用户也记录 IP 地址
- 无论是否登录，ip_address 字段都有值

**第二步**：修改查询逻辑（`src/lib/credits/check-legacy.ts`）
- 通过 user_id 找到该用户所有用过的 IP 地址
- 查询时同时统计 user_id 和这些 IP 地址的记录
- 正确计算总处理数量

### 预期效果

- **记录完整性**：登录前和登录后的处理都有完整记录
- **查询准确性**：能正确统计用户的所有处理记录
- **显示一致性**：前端显示、后端检查、实际处理数量三者一致
- **用户体验**：不再出现"显示有额度但实际无法处理"的问题

---

## 后续建议

### 1. 数据迁移（可选）

如果已有生产数据，需要迁移旧数据：

```sql
-- 更新已有记录（如果登录后处理的记录 ip_address 为 NULL）
UPDATE wmc_processing_history
SET ip_address = (
  SELECT ip_address
  FROM wmc_processing_history
  WHERE user_id = wmc_processing_history.user_id
    AND ip_address IS NOT NULL
  LIMIT 1
)
WHERE user_id IS NOT NULL
  AND ip_address IS NULL;
```

### 2. 添加唯一索引（可选）

防止重复记录：

```sql
-- 添加唯一约束（同一用户不能重复处理同一张图片）
CREATE UNIQUE INDEX idx_unique_processing
ON wmc_processing_history (user_id, image_hash)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_unique_ip_processing
ON wmc_processing_history (ip_address, image_hash)
WHERE ip_address IS NOT NULL;
```

### 3. 监控日志

在 Cloudflare Logs 或 Vercel Logs 中监控：

```
[Credits] Credit check complete: {
  "userId": "...",
  "tier": "unverified",
  "used": 3,
  "limit": 3,
  "remaining": 0
}
```

确保 `used` 值与实际处理数量一致。

---

**文档版本**: 1.0
**最后更新**: 2026-01-25
**修复状态**: ✅ 已完成
**测试状态**: 待验证
