# 🎯 积分系统升级 - 最终集成指南

**版本**: Final v2.0 (2026-01-17)
**架构**: public schema + wmc_ 前缀
**状态**: ✅ 代码更新完成，等待数据库执行

---

## 📋 快速开始

### 第1步：执行数据库升级 ✅ 必须执行

```sql
-- 在 Supabase SQL Editor 中执行以下脚本：
-- 文件位置: scripts/update-credit-system-20260117.sql
```

**或者使用命令行**:
```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@hatwvsjfedokodofiqsb.supabase.co:5432/postgres" -f scripts/update-credit-system-20260117.sql
```

### 第2步：验证数据库升级成功

```sql
-- 在 Supabase SQL Editor 中执行验证：
SELECT table_name, column_count
FROM (
  SELECT table_name,
         (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
  FROM information_schema.tables t
  WHERE table_schema = 'public'
    AND table_name IN ('wmc_credit', 'wmc_subscription', 'wmc_config')
) sub
ORDER BY table_name;

-- 应该看到3个表：
-- wmc_credit       | 17 columns
-- wmc_subscription | 32 columns
-- wmc_config       | 6 columns
```

### 第3步：重启应用

```bash
# 停止当前开发服务器
Ctrl + C

# 重新启动
npm run dev
```

### 第4步：验证功能

按照下面的测试清单逐一验证。

---

## 🗂️ 修改文件清单

### 配置文件修改 (2个)

| 文件 | 修改内容 | 状态 |
|------|---------|------|
| `scripts/update-credit-system-20260117.sql` | 完整的数据库升级脚本 | ✅ 最终版 |
| `INTEGRATION_GUIDE.md` | 本文件 - 集成指南 | ✅ 新建 |

### 代码文件自动更新 (3个)

| 文件 | 修改内容 | 状态 |
|------|---------|------|
| `setup-watermarkcleaner-schema.sql` | 删除 watermarkcleaner schema，改用 wmc_ 前缀 | ✅ 自动 |
| `verify_tables.sql` | 更新验证逻辑 | ✅ 自动 |
| `src/types/database-wmc.types.ts` | 更新类型定义注释 | ✅ 自动 |

### 核心积分代码 (5个) - 之前已完成

| 文件 | 功能 | 状态 |
|------|------|------|
| `src/lib/models/credit.ts` | 积分模型（移除 remainingCredits） | ✅ 已完成 |
| `src/lib/credits/check.ts` | 额度检查逻辑 | ✅ 已完成 |
| `src/lib/credits/grant.ts` | Free-plan 自动分配 | ✅ 已完成 |
| `src/lib/credits/config.ts` | 产品配置 | ✅ 已完成 |
| `src/app/api/payment/checkout/route.ts` | Checkout API | ✅ 已完成 |

### 其他文件 (2个)

| 文件 | 操作 | 状态 |
|------|------|------|
| `scripts/update-credit-system-20260117-FIXED.sql` | 已删除 | ✅ 清理 |
| `src/lib/credits/check-legacy.ts` | 旧版备份 | ⏳ 测试后删除 |

---

## 🧪 完整测试清单

### 阶段1：基础功能测试

#### ✅ 测试1：数据库结构验证
```sql
-- 1.1 检查表是否存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('wmc_credit', 'wmc_subscription', 'wmc_config')
ORDER BY table_name;

-- 期望结果：3 rows (wmc_credit, wmc_subscription, wmc_config)

-- 1.2 检查函数是否存在
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_credit_balance', 'expire_credits', 'process_with_credit');

-- 期望结果：3 rows
```

#### ✅ 测试2：新用户注册测试

**测试场景**：用户通过 Google OAuth 注册

**步骤**:
1. 打开浏览器隐身窗口
2. 访问网站
3. 点击 "Sign In"
4. 选择 Google 登录
5. 完成 OAuth 流程
6. **检查数据库**：

```sql
-- 查询新用户
SELECT id, email
FROM wmc_users
WHERE email = 'your-test-email@gmail.com';

-- 查询用户的 free-plan 订阅
SELECT id, product_id, credits_amount
FROM wmc_subscription
WHERE user_id = 'new_user_id'
  AND product_id = 'free-plan';

-- 查询用户的积分
SELECT SUM(credits) as balance
FROM wmc_credit
WHERE user_id = 'new_user_id';

-- 期望结果：
-- - wmc_subscription: 1 row (product_id = 'free-plan', credits_amount = 3)
-- - wmc_credit: balance = 3
```

**验证点**:
- ✅ 用户创建成功
- ✅ free-plan 订阅自动创建
- ✅ 3积分自动授予

#### ✅ 测试3：未登录用户试用

**测试场景**：未登录用户尝试处理图片

**步骤**:
1. 打开新的隐身窗口（确保未登录）
2. 访问 `/convert` 页面
3. 上传图片并处理（第1次）✅ 应该成功
4. 上传图片并处理（第2次）✅ 应该成功
5. 上传图片并处理（第3次）✅ 应该成功
6. 上传图片并处理（第4次）❌ 应该失败，提示 "请登录"

**预期行为**:
- 前3次处理成功
- 第4次显示登录提示
- 页面显示 "3/3 试用额度已用完"

#### ✅ 测试4：积分消耗测试

**测试场景**：登录用户消耗积分

**前置条件**: 新注册用户（有3积分）

**步骤**:
1. 登录用户
2. 访问 `/convert` 页面
3. 上传图片并处理（第1张）
4. **检查余额**：

```sql
SELECT public.get_credit_balance('user_id');
-- 期望结果：2
```

5. 上传图片并处理（第2张）
6. **检查余额**：

```sql
SELECT public.get_credit_balance('user_id');
-- 期望结果：1
```

7. 上传图片并处理（第3张）
8. **检查余额**：

```sql
SELECT public.get_credit_balance('user_id');
-- 期望结果：0
```

9. 尝试第4张图片 ❌ 应该失败

**数据库验证**:

```sql
-- 检查积分交易记录
SELECT transaction_type, credits, created_at
FROM wmc_credit
WHERE user_id = 'user_id'
ORDER BY created_at;

-- 期望结果：4 rows
-- 1 grant (+3)
-- 3 consume (-1 each)

-- 检查处理历史
SELECT COUNT(*) as total_processed
FROM wmc_processing_history
WHERE user_id = 'user_id' AND success = true;

-- 期望结果：3
```

---

### 阶段2：支付购买测试

#### ✅ 测试5：购买 Basic Monthly 套餐

**前置条件**: 用户已用完免费积分（余额=0）

**步骤**:
1. 访问 `/pricing` 页面
2. 点击 "Basic Monthly" 的 "立即购买"
3. 跳转到 Creem 支付页面（sandbox）
4. 使用测试卡支付：
   - Card Number: 4242 4242 4242 4242
   - Date: 任意未来日期
   - CVC: 123
5. 完成支付
6. **检查数据库**：

```sql
-- 查询订单
SELECT order_no, status, amount, product_id, credits_amount
FROM wmc_order
WHERE user_id = 'user_id'
ORDER BY created_at DESC
LIMIT 1;

-- 期望结果：status = 'paid', product_id = 'basic-monthly', credits_amount = 100

-- 查询订阅
SELECT id, product_id, credits_amount, current_period_end
FROM wmc_subscription
WHERE user_id = 'user_id'
  AND product_id = 'basic-monthly';

-- 期望结果：1 row, credits_amount = 100

-- 查询积分余额
SELECT public.get_credit_balance('user_id') as balance;

-- 期望结果：100
```

7. 返回 `/convert` 页面
8. 上传并处理图片 ✅ 应该成功
9. **检查余额减少**：

```sql
SELECT public.get_credit_balance('user_id');
-- 期望结果：99
```

#### ✅ 测试6：购买 Pro Yearly 套餐

**测试场景**：测试年度套餐（节省50%）

**步骤**:
1. 访问 `/pricing` 页面
2. 切换到 "Yearly" 标签
3. 点击 "Pro Yearly" 的 "立即购买"
4. 完成 Creem 支付
5. **检查数据库**：

```sql
-- 查询订阅
SELECT product_id, amount, credits_amount, interval, current_period_end
FROM wmc_subscription
WHERE user_id = 'user_id'
  AND product_id = 'pro-yearly';

-- 期望结果：
-- product_id = 'pro-yearly'
-- amount = 6999 ($69.99)
-- credits_amount = 2400
-- interval = 'year'
-- current_period_end = now() + 365 days

-- 查询积分（应该立即获得2400）
SELECT public.get_credit_balance('user_id') as balance;

-- 期望结果：2400
```

#### ✅ 测试7：积分过期测试

**测试场景**：验证积分过期功能

**步骤**:
1. 等待30天（月度套餐）
2. **执行过期函数**：

```sql
SELECT public.expire_credits();
-- 返回过期的积分数

-- 检查过期状态
SELECT COUNT(*) as expired_credits
FROM wmc_credit
WHERE user_id = 'user_id'
  AND status = 'expired';
```

3. 积分自动归零
4. 需要重新订阅才能使用

**或者手动测试**:
```sql
-- 模拟过期：更新 expires_at 为过去时间
UPDATE wmc_credit
SET expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'user_id'
  AND transaction_type = 'grant'
  AND product_id = 'pro-yearly';

-- 执行过期检查
SELECT public.expire_credits();

-- 验证余额为0
SELECT public.get_credit_balance('user_id');
-- 期望结果：0
```

---

### 阶段3：并发和边界测试

#### ✅ 测试8：并发处理测试

**测试场景**：多个请求同时处理图片

**步骤**:
1. 用户余额 = 1
2. 同时发送2个处理请求
3. **期望结果**：
   - 1个请求成功
   - 1个请求失败（余额不足）
   - 最终余额 = 0

**数据库验证**:
```sql
-- 检查最终余额
SELECT public.get_credit_balance('user_id');
-- 期望结果：0 (不能为负数)

-- 检查是否只有1条消费记录成功
SELECT COUNT(*) as consume_records
FROM wmc_credit
WHERE user_id = 'user_id'
  AND transaction_type = 'consume'
  AND created_at > NOW() - INTERVAL '1 minute';

-- 期望结果：1
```

#### ✅ 测试9：Free-plan 用户升级

**测试场景**：Free用户购买付费套餐

**步骤**:
1. 用户当前：free-plan，剩余积分 2/3
2. 购买 Pro Monthly
3. **验证新订阅创建**：

```sql
-- 检查订阅历史
SELECT product_id, status, created_at
FROM wmc_subscription
WHERE user_id = 'user_id'
ORDER BY created_at;

-- 期望结果：2 rows
-- product_id = 'free-plan', status = 'canceled' (可能)
-- product_id = 'pro-monthly', status = 'active'

-- 检查积分余额（应该累加）
SELECT public.get_credit_balance('user_id');

-- 期望结果：2 (free剩余) + 200 (pro) = 202
```

**重要**：实现时需要确保积分累加，而不是替换。

#### ✅ 测试10：退款/取消测试

**测试场景**：用户取消订阅或退款

**验证逻辑**:
- 取消订阅后，未使用的积分应该保留到周期结束
- 周期结束后，积分过期
- 可以考虑部分退款（按比例）

---

## 🔧 故障排查

### 问题1: `relation "wmc_credit" does not exist`

**原因**: SQL 脚本未正确执行

**解决**:
```sql
-- 手动创建表
CREATE TABLE wmc_credit (...);
```

### 问题2: `permission denied for schema public`

**原因**: RLS (Row Level Security) 未正确配置

**解决**:
```sql
-- 重新启用 RLS
ALTER TABLE wmc_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE wmc_subscription ENABLE ROW LEVEL SECURITY;

-- 重新创建策略（见SQL脚本）
```

### 问题3: 积分余额显示不正确

**调试步骤**:
```sql
-- Step 1: 检查原始数据
SELECT * FROM wmc_credit WHERE user_id = 'user_id' ORDER BY created_at;

-- Step 2: 手动计算
SELECT SUM(credits) FROM wmc_credit WHERE user_id = 'user_id' AND status = 'active';

-- Step 3: 调用函数
SELECT public.get_credit_balance('user_id');
```

### 问题4: Free-plan 未自动分配

**检查点**:
```typescript
// 检查 auth.config.ts
events: {
  createUser: async ({ user }) => {
    console.log('User created:', user.id);
    // 确认 grantFreePlan 被调用
  }
}

// 检查 grantFreePlan 函数
console.log('Granting free-plan to:', userId);
```

---

## 📊 性能优化建议

### 1. 添加 Redis 缓存（可选）

```typescript
// 缓存积分余额（5分钟）
const balance = await redis.get(`user:${userId}:credit_balance`);
if (!balance) {
  const freshBalance = await getCreditBalance(userId);
  await redis.setex(`user:${userId}:credit_balance`, 300, freshBalance);
}
```

### 2. 数据库索引优化

```sql
-- 已为高频查询添加索引：
-- wmc_credit(user_id, expires_at)
-- wmc_subscription(user_id, product_id) WHERE status='active'
-- wmc_processing_history(ip_address, created_at)
```

### 3. 读写分离（大型应用）

```typescript
// 读取：使用 Supabase 只读副本
const { data } = await supabase_read.from('wmc_credit').select();

// 写入：使用主库
const { data } = await supabase_write.from('wmc_credit').insert();
```

---

## 🎉 完成标准

当你完成以上所有测试，并验证：

- ✅ 新用户自动获得 free-plan (3积分)
- ✅ 积分消费逻辑正确（1张图片 = 1积分）
- ✅ 未登录用户可试用3次
- ✅ 支付购买套餐立即获得积分
- ✅ 积分过期机制工作正常
- ✅ 并发处理不会导致透支

**那么你的积分系统升级就成功完成了！**

---

## 📞 问题反馈

如果在测试过程中遇到问题：

1. **收集信息**：
   - 错误消息
   - 相关代码文件
   - 数据库查询结果
   - 浏览器控制台日志

2. **联系我时需要提供**：
   - 问题描述
   - 你已经尝试的解决步骤
   - 相关查询/代码片段

---

**文档版本**: 1.0
**最后更新**: 2026-01-17 18:30
**维护者**: Claude Code AI
