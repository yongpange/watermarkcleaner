# Mock API 额度测试指南

## 问题分析

使用 Mock API 时，额度显示不更新（始终显示 `Used: 0 / 3 Remaining: 3 images`）。

## 根本原因

**问题 1：CreditsDisplay 刷新机制**
- `key={processingCount}` 会强制组件重新渲染，但 `useEffect` 依赖 `[session, status]` 未变化
- 即使组件重新挂载，useEffect 也不会重新执行（依赖项未变）
- 旧的额度数据仍然显示

**问题 2：数据库事务时序**
- 即使 useEffect 执行，可能查询时额度扣减事务还未完成
- SupabaseAdapter 可能需要时间来同步数据

## 解决方案

### ✅ 已实施

1. **添加 refreshKey prop** (`CreditsDisplay.tsx`)
   ```typescript
   interface CreditsDisplayProps {
     onVerifyEmail?: () => void;
     refreshKey?: number;  // New prop
   }
   ```

2. **将 refreshKey 添加到 useEffect 依赖**
   ```typescript
   useEffect(() => {
     // fetch credits logic
   }, [session, status, refreshKey]);  // Now triggers on refreshKey change
   ```

3. **传递 processingCount 作为 refreshKey**
   ```typescript
   <CreditsDisplay
     refreshKey={processingCount}
     onVerifyEmail={handleVerifyEmail}
   />
   ```

### 📋 测试步骤

**步骤 1：检查浏览器控制台**
```
[CreditsDisplay] :::: useEffect TRIGGERED ::::
[CreditsDisplay] Dependencies - RefreshKey: 0
...
[Mock API] Credit consumed successfully via consumeCredits()
[CreditsDisplay] :::: useEffect TRIGGERED ::::
[CreditsDisplay] Dependencies - RefreshKey: 1
```

**步骤 2：验证 API 调用**
- 处理图片后，应该看到 `/api/credits/check` 或 `/api/credits/check-ip` 被调用
- 返回的数据应该有 `used: 1`

**步骤 3：检查数据库**
```sql
-- For authenticated user
SELECT * FROM wmc_credit WHERE user_id = 'user-id' ORDER BY created_at DESC;

-- Should see:
-- transaction_type: 'consume', credits: -1, scene: 'image_processing'

-- Check balance
SELECT SUM(credits) as balance FROM wmc_credit WHERE user_id = 'user-id';
-- Should return: 2 (if started with 3)
```

**步骤 4：检查处理历史**
```sql
SELECT * FROM wmc_processing_history WHERE user_id = 'user-id';
-- Should have 1 record
```

## 测试清单

- [ ] Console shows "useEffect TRIGGERED" twice
- [ ] Second call shows RefreshKey: 1
- [ ] API returns used: 1
- [ ] UI updates to "Used: 1 / 3"
- [ ] Database has consume credit record
- [ ] Database has processing history record

## 如果仍然不更新

### 调试步骤

1. **检查 Mock API 日志**
   ```bash
   # 查看 Mock API 日志
   [Mock API] ===== Processing Complete - Recording History =====
   [Mock API] Consuming credits from wmc_credit table for user: ...
   [Mock API] Credit consumed successfully via consumeCredits()
   ```

2. **检查额度查询 API**
   ```bash
   # Authenticated
   curl -X GET http://localhost:3000/api/credits/check

   # Unauthenticated
   curl -X GET http://localhost:3000/api/credits/check-ip
   ```

3. **检查数据库状态**
   ```sql
   -- Check if consume credit was created
   SELECT * FROM wmc_credit
   WHERE user_id = 'your-user-id'
   AND transaction_type = 'consume'
   ORDER BY created_at DESC LIMIT 5;
   ```

4. **检查 SupabaseAdapter sync**
   ```sql
   SELECT id, email, tier, created_at
   FROM wmc_users
   WHERE email = 'your-email';
   ```

## 可能的额外修复

如果额度仍然不更新，可能需要：

### 方案 A：添加延迟
```typescript
// In WatermarkEditor
const handleProcessImage = async () => {
  // ... processing logic ...

  // Add delay before calling onProcessingComplete
  setTimeout(() => {
    if (onProcessingComplete) {
      onProcessingComplete();
    }
  }, 500); // 500ms delay
};
```

### 方案 B：使用乐观更新
```typescript
// In CreditsDisplay
useEffect(() => {
  if (refreshKey > 0 && credits) {
    // Optimistically update the UI
    setCredits(prev => ({
      ...prev!,
      used: prev!.used + 1,
      remaining: Math.max(0, prev!.remaining - 1)
    }));
  }
  fetchCredits();
}, [session, status, refreshKey]);
```

## 最终验证

使用以下测试流程：

### 已登录用户测试
1. 清除所有网站数据（包括 IndexedDB）
2. 登录（Google 或邮箱）
3. 检查额度：应该显示 `0 / 3`
4. 上传并处理 1 张图片
5. **Expected**: 显示 `1 / 3`
6. 再处理 1 张
7. **Expected**: 显示 `2 / 3`
8. 再处理 1 张
9. **Expected**: 显示 `3 / 3` 并提示升级

### 未登录用户测试
1. 清除所有网站数据
2. 不登录，直接访问
3. 检查额度：应该显示 `0 / 3`
4. 上传并处理 1 张图片
5. **Expected**: 显示 `1 / 3`
6. 重复直到 3 张
7. **Expected**: 第 4 张被拒绝，提示登录/注册

## 数据库验证查询

### 检查用户额度
```sql
-- Check user credits
SELECT
  u.id,
  u.email,
  u.tier,
  (SELECT SUM(credits) FROM wmc_credit WHERE user_id = u.id) as balance,
  (SELECT COUNT(*) FROM wmc_processing_history WHERE user_id = u.id AND success = true) as processed_count
FROM wmc_users u
WHERE u.email = 'test@example.com';
```

### 检查信用交易
```sql
-- Check credit transactions
SELECT
  id,
  transaction_type,
  credits,
  scene,
  description,
  created_at
FROM wmc_credit
WHERE user_id = 'user-id'
ORDER BY created_at DESC
LIMIT 10;
```

### 检查处理历史
```sql
-- Check processing history
SELECT
  id,
  user_id,
  ip_address,
  image_size,
  success,
  created_at
FROM wmc_processing_history
WHERE user_id = 'user-id' OR ip_address = 'hashed-ip'
ORDER BY created_at DESC
LIMIT 10;
```

## 总结

Mock API 额度不更新的根本原因是 **CreditsDisplay 组件的刷新机制问题**。通过添加 `refreshKey` prop 并正确传递给 useEffect，可以确保每次处理完成后重新获取最新的额度数据。
