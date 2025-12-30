# 数据库迁移回滚方案

## 概述
如果迁移后出现问题，可以按照以下步骤进行回滚。

## 回滚步骤

### 步骤1：停止服务
在回滚前，先停止应用服务，防止数据不一致。

### 步骤2：备份当前数据（重要！）
```sql
-- 创建回滚备份
CREATE SCHEMA IF NOT EXISTS backup_rollback_$(date +%Y%m%d_%H%M%S);

-- 备份当前表
CREATE TABLE backup_rollback_$(date +%Y%m%d_%H%M%S).users AS SELECT * FROM public.users;
CREATE TABLE backup_rollback_$(date +%Y%m%d_%H%M%S).accounts AS SELECT * FROM public.accounts;
CREATE TABLE backup_rollback_$(date +%Y%m%d_%H%M%S).sessions AS SELECT * FROM public.sessions;
CREATE TABLE backup_rollback_$(date +%Y%m%d_%H%M%S).verification_tokens AS SELECT * FROM public.verification_tokens;
CREATE TABLE backup_rollback_$(date +%Y%m%d_%H%M%S).processing_history AS SELECT * FROM public.processing_history;
```

### 步骤3：恢复原始表名
```sql
-- 删除当前的表（如果存在）
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.verification_tokens CASCADE;
DROP TABLE IF EXISTS public.processing_history CASCADE;

-- 恢复备份的原始表
ALTER TABLE backup_before_migration.users RENAME TO users;
ALTER TABLE backup_before_migration.accounts RENAME TO accounts;
ALTER TABLE backup_before_migration.sessions RENAME TO sessions;
ALTER TABLE backup_before_migration.verification_tokens RENAME TO verification_tokens;
ALTER TABLE backup_before_migration.processing_history RENAME TO processing_history;
```

### 步骤4：恢复代码
1. 回滚所有代码更改：
   - 恢复 `src/lib/credits/check.ts` 中的表名引用
   - 恢复 `src/app/api/sync-user/route.ts` 中的表名引用
   - 确保所有 `.from('users')` 恢复为 `.from('watermarkcleaner.users')`

2. 使用 Git 回滚：
```bash
git checkout HEAD~1  # 回退到上一个提交
git checkout -- src/lib/credits/check.ts src/app/api/sync-user/route.ts
```

### 步骤5：验证回滚
运行验证脚本确保回滚成功：
```bash
node migration/verify-rollback.js
```

### 步骤6：重启服务
确认回滚成功后，重启应用服务。

## 快速回滚脚本

创建 `migration/quick-rollback.sql`：

```sql
-- 快速回滚脚本
-- 执行前请确保已经备份了当前数据！

-- 1. 备份当前数据（如果还没有备份）
CREATE SCHEMA IF NOT EXISTS backup_before_rollback;
CREATE TABLE backup_before_rollback.users AS SELECT * FROM public.users;
CREATE TABLE backup_before_rollback.accounts AS SELECT * FROM public.accounts;
CREATE TABLE backup_before_rollback.sessions AS SELECT * FROM public.sessions;
CREATE TABLE backup_before_rollback.verification_tokens AS SELECT * FROM public.verification_tokens;
CREATE TABLE backup_before_rollback.processing_history AS SELECT * FROM public.processing_history;

-- 2. 删除当前表
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.verification_tokens CASCADE;
DROP TABLE IF EXISTS public.processing_history CASCADE;

-- 3. 恢复原始表（如果存在备份）
-- 注意：这里需要根据实际情况修改表名
-- ALTER TABLE backup_watermarkcleaner.users RENAME TO users;
-- ALTER TABLE backup_watermarkcleaner.accounts RENAME TO accounts;
-- ALTER TABLE backup_watermarkcleaner.sessions RENAME TO sessions;
-- ALTER TABLE backup_watermarkcleaner.verification_tokens RENAME TO verification_tokens;
-- ALTER TABLE backup_watermarkcleaner.processing_history RENAME TO processing_history;

-- 4. 或者恢复为使用 watermarkcleaner schema（如果需要）
-- 这一步需要手动执行，因为涉及 schema 变更
```

## 注意事项

1. **数据安全**：回滚前务必备份当前数据
2. **服务停机**：回滚期间服务需要停机
3. **数据一致性**：确保所有相关表都一起回滚
4. **测试环境**：建议先在测试环境验证回滚脚本

## 预防措施

1. **蓝绿部署**：考虑使用蓝绿部署策略
2. **特性开关**：添加特性开关控制新功能
3. **监控告警**：设置监控及时发现异常
4. **增量迁移**：考虑分批次迁移减少风险

## 联系支持

如果回滚遇到问题：
1. 检查 Supabase 控制台日志
2. 查看应用错误日志
3. 联系技术支持团队