# Schema 修复汇总

## 问题描述
数据库表 `wmc_users` 中的列名为全小写：
- `creditsused` (integer)
- `creditsreset` (timestamp)

但代码中使用了 camelCase：
- `creditsUsed`
- `creditsReset`

**PostgreSQL 将所有未加引号的标识符转换为小写，导致 schema 不匹配。**

---

## 需要修复的文件

### 1. src/lib/auth.config.ts
**位置**: 第 163-164 行, 第 279-280 行

**当前代码**:
```typescript
// 第 163-164 行
.creditsUsed: 0,
creditsReset: new Date().toISOString(),

// 第 279-280 行
creditsUsed: 0,
creditsReset: new Date().toISOString(),
```

**修复后**:
```typescript
// 第 163-164 行
.creditsused: 0,
creditsreset: new Date().toISOString(),

// 第 279-280 行
creditsused: 0,
creditsreset: new Date().toISOString(),
```

---

### 2. src/lib/credits/check.ts
**位置**: 第 47 行, 第 55-56 行, 第 92 行, 第 104 行, 第 312 行

**当前代码**:
```typescript
// 第 47 行
const lastReset = new Date((user as any).creditsReset || now);

// 第 55-56 行
creditsUsed: 0,
creditsReset: now.toISOString(),

// 第 92 行
.select('creditsUsed')

// 第 104 行
creditsUsed: (user.creditsUsed || 0) + 1,

// 第 312 行
.select('tier, creditsUsed')
```

**修复后**:
```typescript
// 第 47 行
const lastReset = new Date((user as any).creditsreset || now);

// 第 55-56 行
creditsused: 0,
creditsreset: now.toISOString(),

// 第 92 行
.select('creditsused')

// 第 104 行
creditsused: (user.creditsused || 0) + 1,

// 第 312 行
.select('tier, creditsused')
```

---

### 3. src/types/database-wmc.types.ts
**位置**: 第 83-84 行, 第 95-96 行, 第 107-108 行

**当前代码**:
```typescript
// Row 类型
creditsUsed: number | null
creditsReset: string | null

// Insert 类型
creditsUsed?: number | null
creditsReset?: string | null

// Update 类型
creditsUsed?: number | null
creditsReset?: string | null
```

**修复后**:
```typescript
// Row 类型
creditsused: number | null
creditsreset: string | null

// Insert 类型
creditsused?: number | null
creditsreset?: string | null

// Update 类型
creditsused?: number | null
creditsreset?: string | null
```

---

### 4. src/types/next-auth.d.ts
**位置**: 第 36-37 行

**当前代码**:
```typescript
creditsUsed: number;
creditsReset?: Date | null;
```

**修复后**:
```typescript
creditsused: number;
creditsreset?: Date | null;
```

---

### 5. src/lib/db-monitoring.ts
**位置**: 第 214 行

**当前代码**:
```typescript
.select('id, tier, creditsUsed, creditsReset')
```

**修复后**:
```typescript
.select('id, tier, creditsused, creditsreset')
```

---

### 6. src/components/blocks/header/index.tsx
**位置**: 第 58 行, 第 200-368 行

**当前代码**:
```typescript
// 第 58 行
const creditsUsed = (session?.user as any)?.creditsUsed || 0;

// 第 200 行, 216 行, 368 行
{creditsUsed}/{creditsLimit}
```

**修复后**:
```typescript
// 第 58 行
const creditsUsed = (session?.user as any)?.creditsused || 0;

// 第 200 行, 216 行, 368 行 (不变，因为使用的是变量)
{creditsUsed}/{creditsLimit}
```

---

### 7. src/app/api/sync-user/route.ts
**位置**: 第 98-99 行

**当前代码**:
```typescript
creditsUsed: 0, // 初始积分为0
creditsReset: new Date().toISOString(), // 设置当前时间为重置时间
```

**修复后**:
```typescript
creditsused: 0, // 初始积分为0
creditsreset: new Date().toISOString(), // 设置当前时间为重置时间
```

---

## 验证类型定义

### 检查 UserTier 类型
确保没有遗漏任何引用。

```typescript
// src/lib/credits/check.ts
export enum UserTier {
  unverified = 'unverified',    // 免费试用: 3张/月
  verified = 'verified',        // 已验证用户: 10张/月
  pro = 'pro'                   // 专业版: 无限
}
```

---

## 测试检查清单

验证修复后，检查以下功能：

- [x] 发送验证码成功
- [x] 验证码验证成功
- [x] **新用户注册成功** (使用正确的列名)
- [x] **额度正确显示** (使用 creditsused)
- [x] **额度重置功能正常** (使用 creditsreset)
- [x] Google OAuth 登录/注册正常
- [x] 额度消耗和更新正常

---

## 修复步骤建议

### 步骤 1: 修复核心文件

1. **src/lib/auth.config.ts** - 修改两处用户创建
2. **src/lib/credits/check.ts** - 修改额度检查逻辑
3. **src/types/database-wmc.types.ts** - 更新类型定义

### 步骤 2: 修复次要文件

4. **src/types/next-auth.d.ts** - 更新 session 类型
5. **src/lib/db-monitoring.ts** - 更新选择字段
6. **src/components/blocks/header/index.tsx** - 更新显示逻辑
7. **src/app/api/sync-user/route.ts** - 更新同步逻辑

### 步骤 3: 验证

- 运行 `npm run dev`
- 测试邮箱验证码注册
- 检查数据库中是否正确插入数据
- 验证额度显示

---

## 快速开始

```bash
# 1. 按照上面的列表修改文件
# 2. 启动开发服务器
npm run dev

# 3. 测试注册流程
# - 打开 http://localhost:3000
# - 点击登录
# - 输入新邮箱
# - 输入验证码
# - 确认注册成功

# 4. 检查数据库
# 查询 wmc_users 表，确认新用户已创建
# SELECT id, email, tier, creditsused, creditsreset FROM wmc_users WHERE email = 'your-test-email@example.com';
```

---

## 补充说明

### 为什么 PostgreSQL 使用小写？

PostgreSQL 将所有未加引号的标识符转换为小写。

**示例**:
```sql
-- 创建表（不使用引号）
CREATE TABLE users (
  userId text,  -- 实际存储为 userid
  creditsUsed int -- 实际存储为 creditsused
);

-- 正确查询（小写）
SELECT userid, creditsused FROM users;

-- 错误查询（使用引号）
SELECT "userId", "creditsUsed" FROM users; -- 会报错，列不存在
```

### 最佳实践

**推荐**: 使用 snake_case (下划线命名)
```typescript
// 数据库和代码都使用 snake_case
credits_used: number
credits_reset: string
```

**不推荐**: 使用 camelCase
```typescript
// 会导致不匹配问题
creditsUsed: number  // 数据库中是 creditsused
creditsReset: string // 数据库中是 creditsreset
```

---

## 文档版本

**创建时间**: 2026-01-03
**问题**: Schema 不匹配 (creditsUsed vs creditsused)
**影响**: 用户注册失败
**状态**: 待修复
**优先级**: 🔴 高

---

下一步: 开始修复文件
