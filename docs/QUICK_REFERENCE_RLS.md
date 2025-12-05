# 🚀 RLS 快速参考卡片

一页纸搞定 Supabase RLS 配置！

---

## 📋 3 步完成配置

### Step 1: 创建表（如果缺失）
```bash
文件：src/db/migrations/create_all_tables.sql
位置：Supabase Dashboard → SQL Editor → New query
操作：复制粘贴 → Run
```

### Step 2: 配置 RLS
```bash
文件：src/db/migrations/rls_all_tables.sql
位置：Supabase Dashboard → SQL Editor → New query
操作：复制粘贴 → Run
```

### Step 3: 验证
```sql
-- 检查 RLS 状态
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 检查策略数量
SELECT tablename, COUNT(*) FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename;
```

---

## 🔍 常用 SQL 查询

### 查看所有表
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 查看 RLS 状态
```sql
SELECT tablename, 
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END AS rls
FROM pg_tables WHERE schemaname = 'public';
```

### 查看所有策略
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### 查看表结构
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'flashcards'
ORDER BY ordinal_position;
```

---

## 🛡️ RLS 策略模板

### 登录用户（标准模式）
```sql
-- SELECT
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid()::text = user_uuid);

-- INSERT
CREATE POLICY "Users can insert own data"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid()::text = user_uuid);

-- UPDATE
CREATE POLICY "Users can update own data"
  ON table_name FOR UPDATE
  USING (auth.uid()::text = user_uuid);

-- DELETE
CREATE POLICY "Users can delete own data"
  ON table_name FOR DELETE
  USING (auth.uid()::text = user_uuid);
```

### 匿名用户（24h 过期）
```sql
-- SELECT
CREATE POLICY "Anonymous can view unexpired data"
  ON table_name FOR SELECT
  USING (
    auth.uid()::text = user_uuid
    OR (user_uuid IS NULL AND (expires_at IS NULL OR expires_at > NOW()))
  );

-- INSERT
CREATE POLICY "Anonymous can insert data"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid()::text = user_uuid OR user_uuid IS NULL);

-- UPDATE
CREATE POLICY "Anonymous can update unexpired data"
  ON table_name FOR UPDATE
  USING (
    auth.uid()::text = user_uuid
    OR (user_uuid IS NULL AND (expires_at IS NULL OR expires_at > NOW()))
  );

-- DELETE (仅登录用户)
CREATE POLICY "Only logged users can delete"
  ON table_name FOR DELETE
  USING (auth.uid()::text = user_uuid);
```

### 公开访问
```sql
CREATE POLICY "Anyone can view published data"
  ON table_name FOR SELECT
  USING (status = 'published');
```

---

## 📊 表和策略对照表

| 表名 | 策略数 | 匿名支持 | 备注 |
|------|--------|---------|------|
| users | 2 | ❌ | 只读+更新 |
| orders | 1 | ❌ | 只读 |
| apikeys | 4 | ❌ | 完整 CRUD |
| credits | 1 | ❌ | 只读 |
| posts | 1 | ❌ | 公开只读 |
| affiliates | 1 | ❌ | 只读 |
| feedbacks | 4 | ✅ | 完整 CRUD |
| conversions | 4 | ✅ 24h | 完整 CRUD |
| user_preferences | 4 | ❌ | 完整 CRUD |
| chat_sessions | 4 | ✅ 24h | 完整 CRUD |
| flashcards | 4 | ✅ 24h | 完整 CRUD |

---

## ⚠️ 常见错误

### 错误 1: relation does not exist
**原因**：表未创建  
**解决**：执行 `create_all_tables.sql`

### 错误 2: policy already exists
**原因**：策略已存在  
**解决**：
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### 错误 3: 启用 RLS 后无法查询
**原因**：策略未创建  
**解决**：执行 `rls_all_tables.sql`

### 错误 4: 匿名用户无法插入
**原因**：INSERT 策略未允许 `user_uuid IS NULL`  
**解决**：检查策略是否包含匿名用户条件

---

## 🔑 关键概念

### auth.uid()
当前登录用户的 UUID
```sql
auth.uid()::text = user_uuid
```

### USING vs WITH CHECK
- **USING**: SELECT, UPDATE, DELETE
- **WITH CHECK**: INSERT, UPDATE

### 匿名用户判断
```sql
user_uuid IS NULL
AND (expires_at IS NULL OR expires_at > NOW())
```

---

## 🧪 测试命令

### 测试登录用户
```sql
SELECT * FROM flashcards;  -- 应该只返回自己的数据
```

### 测试匿名用户
```sql
SELECT * FROM flashcards WHERE user_uuid IS NULL;  -- 应该返回未过期的匿名数据
```

### 测试插入
```sql
INSERT INTO flashcards (uuid, file_id, question, answer, user_uuid)
VALUES ('test', 'test', 'Q', 'A', auth.uid()::text);
```

### 清理测试数据
```sql
DELETE FROM flashcards WHERE uuid = 'test';
```

---

## 📚 文档索引

| 文档 | 用途 |
|------|------|
| `DATABASE_AUDIT_SUMMARY.md` | 完整审计总结 |
| `SUPABASE_DATABASE_SETUP_GUIDE.md` | 详细配置指南 |
| `RLS_POLICIES_REFERENCE.md` | 策略详细说明 |
| `QUICK_REFERENCE_RLS.md` | 本文档（快速参考） |
| `create_all_tables.sql` | 创建表脚本 |
| `rls_all_tables.sql` | RLS 配置脚本 |

---

## 🎯 检查清单

配置前：
- [ ] 登录 Supabase Dashboard
- [ ] 备份现有数据（如果有）
- [ ] 准备好 SQL 脚本

配置中：
- [ ] 执行创建表脚本
- [ ] 执行 RLS 配置脚本
- [ ] 验证表和策略

配置后：
- [ ] 测试登录用户访问
- [ ] 测试匿名用户访问
- [ ] 测试前端功能
- [ ] 监控错误日志

---

## 💡 最佳实践

1. **开发环境**：可以临时禁用 RLS 调试
2. **生产环境**：必须启用 RLS
3. **策略命名**：使用描述性名称
4. **定期审计**：每月检查策略配置
5. **监控日志**：关注异常访问

---

## 🆘 紧急操作

### 临时禁用 RLS（仅开发环境）
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### 重新启用 RLS
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 删除所有策略
```sql
DROP POLICY IF EXISTS "policy_name_1" ON table_name;
DROP POLICY IF EXISTS "policy_name_2" ON table_name;
-- ...
```

### 查看当前用户
```sql
SELECT auth.uid();
```

---

**快速参考版本**: 1.0  
**最后更新**: 2025-11-05  
**打印友好**: ✅

