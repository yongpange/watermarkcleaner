-- =====================================
-- 验证 wmc_ 表格是否存在 (public schema)
-- =====================================

-- 1. 检查 wmc_ 前缀的表格是否存在
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'wmc_%'
ORDER BY tablename;

-- Expected: 应该返回以下表格:
-- wmc_accounts
-- wmc_processing_history
-- wmc_sessions
-- wmc_users
-- wmc_verification_tokens

-- 2. 检查表格详细信息
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'wmc_%'
ORDER BY table_name, ordinal_position;

-- 3. 检查索引
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'wmc_%'
ORDER BY tablename, indexname;

-- 4. 检查外键约束
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name LIKE 'wmc_%'
ORDER BY tc.table_name;

-- 5. 检查 RLS (Row Level Security) 是否启用
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'wmc_%'
  AND rowsecurity = true;

-- Expected: 所有表格都应该启用 RLS

-- 6. 检查表格注释
SELECT
  schemaname,
  tablename,
  obj_description(pgc.oid, 'pg_class') as description
FROM pg_class pgc
JOIN pg_namespace pgn ON pgc.relnamespace = pgn.oid
WHERE pgn.nspname = 'public'
  AND pgc.relname LIKE 'wmc_%'
  AND pgc.relkind = 'r'
ORDER BY tablename;
