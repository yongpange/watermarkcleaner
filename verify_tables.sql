-- =====================================
-- 验证 watermarkcleaner schema 和表格是否存在
-- =====================================

-- 1. 检查 schema 是否存在
SELECT nspname as schema_name
FROM pg_namespace
WHERE nspname = 'watermarkcleaner';

-- Expected: 应该返回 1 行，显示 "watermarkcleaner"

-- 2. 检查 watermarkcleaner schema 中的所有表格
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'watermarkcleaner'
ORDER BY tablename;

-- Expected: 应该返回 5 行
-- watermarkcleaner | accounts
-- watermarkcleaner | processing_history
-- watermarkcleaner | sessions
-- watermarkcleaner | users
-- watermarkcleaner | verification_tokens

-- 3. 检查表格详情
SELECT
  table_schema,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'watermarkcleaner'
  AND table_name = 'users'
ORDER BY ordinal_position
LIMIT 10;

-- Expected: 应该显示 users 表的前 10 列（id, name, email 等）

-- 4. 如果表格不存在，重新创建单个表格测试
DO $$
BEGIN
  -- 测试创建 schema
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS watermarkcleaner_test';

  -- 测试创建表
  EXECUTE 'CREATE TABLE IF NOT EXISTS watermarkcleaner_test.test_table (
    id SERIAL PRIMARY KEY,
    name TEXT
  )';

  -- 清理测试
  EXECUTE 'DROP TABLE IF EXISTS watermarkcleaner_test.test_table';
  EXECUTE 'DROP SCHEMA IF EXISTS watermarkcleaner_test';

  RAISE NOTICE '✅ 测试创建成功 - 你的权限正常';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ 错误: %', SQLERRM;
END $$;

-- 5. 检查执行日志（如果提供了日志链接）
-- 查看 https://supabase.com/dashboard/project/hatwvsjfedokodofiqsb/database/backups

-- 6. 完整的重新创建语句（如果确实没有创建成功）
-- 请手动复制以下部分到新的 SQL 查询中执行

-- DROP SCHEMA IF EXISTS watermarkcleaner CASCADE;
-- CREATE SCHEMA watermarkcleaner;

-- CREATE TABLE watermarkcleaner.users (
--   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()
-- );

-- SELECT 'Schema and test table created successfully' as status;
