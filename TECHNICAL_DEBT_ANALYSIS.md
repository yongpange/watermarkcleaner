# 积分系统升级 - 技术负债分析报告

**创建日期**：2026-01-18 09:35
**分析文件**：update-credit-system-20260117.sql (16KB)

---

## ⚠️ 技术负债清单

### 1. **类型不一致问题** ❌

#### **负债描述**
wmc_users.id (TEXT) 与 auth.users.id (UUID) 类型不匹配，导致混合引用架构。

```sql
-- wmc_users.id 是 TEXT 类型
CREATE TABLE wmc_users (
  id TEXT PRIMARY KEY  -- ❌ 应该是 UUID
);

-- 但新表直接引用 auth.users.id (UUID)
CREATE TABLE wmc_credit (
  user_id UUID REFERENCES auth.users(id)  -- ✅ 正确
);
```

#### **影响**
- **数据完整性风险**：wmc_users.id 存储 UUID 字符串但未强类型验证
- **JOIN 困难**：跨表查询需要类型转换 `wmc_users.id::uuid`
- **外键混乱**：部分表引用 auth.users，部分表引用 wmc_users
- **性能隐患**：TEXT 索引性能略低于 UUID 索引

#### **理想设计**
```sql
-- 应该统一为 UUID 类型
CREATE TABLE wmc_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 其他字段...
);
```

---

### 2. **混合引用架构** ❌

#### **负债描述**
不同表引用不同的用户来源，导致数据关系混乱。

| 表名 | user_id 类型 | 引用目标 | 问题 |
|------|------------|---------|------|
| wmc_accounts | UUID | auth.users.id | ✅ 正确 |
| wmc_sessions | UUID | auth.users.id | ✅ 正确 |
| wmc_processing_history | UUID | (无引用) | ⚠️ 缺少外键 |
| **wmc_credit** | **UUID** | **auth.users.id** | ✅ **正确** |
| **wmc_subscription** | **UUID** | **auth.users.id** | ✅ **正确** |
| wmc_users | TEXT | (无引用) | ❌ 类型不匹配 |

#### **理想架构**
```sql
-- 应该所有表都统一引用 auth.users.id
┌─ auth.users.id (UUID) ─┐
   ├─ wmc_accounts.userId
   ├─ wmc_sessions.userId
   ├─ wmc_credit.user_id
   ├─ wmc_subscription.user_id
   └─ wmc_users.id (应该删除或转为视图)
```

---

### 3. **历史遗留：wmc_users 表冗余** ❌

#### **负债描述**
wmc_users 表与 auth.users 功能重叠，但字段不同步。

**auth.users** (NextAuth.js 管理):
- id, email, name, image, emailVerified

**wmc_users** (项目扩展):
- id, tier, creditsUsed, creditsReset, ...

#### **问题**
- **数据同步风险**：NextAuth.js 更新用户信息时 wmc_users 不会自动同步
- **查询复杂**：需要 JOIN 两个表才能获取完整用户信息
- **维护成本**：需要手动同步用户数据

#### **理想设计**
```sql
-- 方案A：删除 wmc_users，所有字段迁移到 auth.users
-- 方案B：wmc_users 只作为扩展表，使用触发器自动同步
-- 方案C：将 wmc_users 转为视图，读取时自动 JOIN auth.users

-- 推荐方案：使用触发器自动同步
CREATE OR REPLACE FUNCTION sync_user_data()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wmc_users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.name)
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email, name = NEW.name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_auth_users
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION sync_user_data();
```

---

### 4. **wmc_subscription.subscription_id TEXT 类型可疑** ⚠️

#### **负债描述**
存储外部支付提供商的订阅 ID 使用 TEXT 类型，但如果提供商使用 UUID，应该明确类型。

```sql
subscription_id TEXT  -- 不明确，可能是 Stripe ID (cs_xxx) 或 UUID
```

#### **建议**
```sql
-- 应该明确类型和使用场景
payment_provider_subscription_id TEXT,  -- 明确是支付提供商的 ID
subscription_uuid UUID,                 -- 如果是 UUID 类型
```

---

### 5. **索引重复创建风险** ⚠️

#### **负债描述**
使用 `CREATE INDEX IF NOT EXISTS` 在事务中可能有问题。

```sql
-- 这行在事务中可能有问题
CREATE UNIQUE INDEX IF NOT EXISTS idx_wmc_subscription_unique_active
ON wmc_subscription(user_id, product_id) WHERE status = 'active';
```

#### **影响**
PostgreSQL 14+ 支持 `IF NOT EXISTS` 索引，但在复杂事务中可能有锁竞争问题。

---

### 6. **缺少 NOT NULL 约束** ⚠️

#### **负债描述**
多个重要字段缺少 NOT NULL 约束。

```sql
-- 缺少 NOT NULL
credits INTEGER,  -- 应该是 INTEGER NOT NULL
amount INTEGER,   -- 应该是 INTEGER NOT NULL
product_id TEXT,  -- 应该是 TEXT NOT NULL
```

#### **影响**
- 可能插入不完整的数据
- 查询时需要处理 NULL 值
- 业务逻辑复杂度增加

---

### 7. **命名不一致** ⚠️

#### **负债描述**
- 订阅表叫 `wmc_subscription`，但积分表叫 `wmc_credit`（单数/复数不统一）
- 有些字段用 snake_case，有些用 camelCase（如 `userId` vs `user_id`）

#### **理想状态**
```sql
-- 应该统一命名规范
wmc_users       (复数)
wmc_accounts    (复数)
wmc_sessions    (复数)
wmc_credits     (复数)  -- 而不是 wmc_credit
wmc_subscriptions (复数) -- 而不是 wmc_subscription
```

---

## 🎯 严重程度评级

| # | 问题 | 严重程度 | 影响范围 | 修复难度 |
|---|------|---------|---------|---------|
| 1 | wmc_users.id TEXT 类型 | 🔴 高 | 全系统架构 | 高（需要数据迁移） |
| 2 | 混合引用架构 | 🟠 中 | 查询逻辑 | 中（需要重构） |
| 3 | wmc_users 表冗余 | 🟠 中 | 数据同步 | 中（需要触发器） |
| 4 | subscription_id TEXT | 🟡 低 | 支付集成 | 低（仅命名） |
| 5 | 索引创建风险 | 🟡 低 | 部署 | 低（修改脚本） |
| 6 | 缺少 NOT NULL | 🟡 低 | 数据完整性 | 低（修改表结构） |
| 7 | 命名不一致 | 🟡 低 | 代码可读性 | 低（仅命名） |

---

## 💡 如何修复（优先级排序）

### **P0 - 立即修复（不修复会影响系统）**
无。当前系统可以正常运行。

### **P1 - 短期修复（1-2 周内）**
1. **添加缺失的 NOT NULL 约束**
```sql
ALTER TABLE wmc_credit ALTER COLUMN credits SET NOT NULL;
ALTER TABLE wmc_subscription ALTER COLUMN amount SET NOT NULL;
```

2. **明确字段命名**
```sql
COMMENT ON COLUMN wmc_subscription.subscription_id IS '支付提供商的订阅ID（如 Stripe subscription ID）';
```

### **P2 - 中期修复（1-2 个月内）**
1. **创建用户数据同步触发器**
```sql
-- 自动同步 auth.users 到 wmc_users
CREATE TRIGGER sync_auth_users AFTER INSERT OR UPDATE ON auth.users ...
```

2. **重构混合引用**
- 逐步迁移 wmc_processing_history.user_id 引用 auth.users.id
- 标准化所有新表直接使用 auth.users.id

### **P3 - 长期修复（3-6 个月）**
1. **迁移 wmc_users.id 到 UUID**
```sql
-- 需要复杂的迁移计划
-- 1. 创建新列 wmc_users.new_id UUID
-- 2. 同步数据
-- 3. 更新所有外键
-- 4. 删除旧列并重命名新列
-- 5. 重建 imposter_rooms 外键
```

2. **考虑废弃 wmc_users 表**
- 将所有字段迁移到 auth.users
- 使用 Supabase 的 Auth 扩展字段
- 或者将 wmc_users 转为物化视图

---

## 🎯 现状评估

### **✅ 可以接受的负债**
- wmc_users.id 保持 TEXT：虽然不完美，但 imposter_rooms 依赖它，更改成本太高
- 混合引用架构：wmc_credit 和 wmc_subscription 直接引用 auth.users.id 是正确的方向

### **⚠️ 需要改进的负债**
- 缺少 NOT NULL 约束：应该补充
- wmc_users 表冗余：需要触发器同步
- 命名不一致：新项目应该统一规范

### **❌ 不应该接受的负债**
- 无。当前设计虽然不完美，但可以正常工作。

---

## 📊 最终的架构状态

```sql
auth.users.id (UUID) ←─ 主用户表 (Supabase Auth)
   ↑
   ├─ wmc_accounts.userId (UUID)  ✅ 正确
   ├─ wmc_sessions.userId (UUID)  ✅ 正确
   ├─ wmc_credit.user_id (UUID)   ✅ 正确 (直接引用 auth.users)
   ├─ wmc_subscription.user_id (UUID) ✅ 正确 (直接引用 auth.users)
   └─ wmc_users.id (TEXT)         ⚠️ 技术负债 (为兼容 imposter_rooms)
```

**这个架构虽然不完美，但是务实的选择。**

---

## 💭 结论

**技术负债总结：**
- ⚠️ 1 个高风险负债（wmc_users.id TEXT 类型）
- ⚠️ 2 个中风险负债（混合引用 + 表冗余）
- 🟡 4 个低风险负债（命名、约束、索引等）

**推荐理由：**
- 系统可以稳定运行
- 负债都在可控范围内
- 有明确的修复路径
- 不影响业务功能

**建议行动：**
1. 补充 NOT NULL 约束（P1）
2. 添加用户同步触发器（P2）
3. 制定 wmc_users.id 迁移计划（P3）

**无需立即修复**，但建议在未来的迭代中逐步改进。
