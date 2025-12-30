-- 简单的解决方案：创建数据库级别的兼容
-- 这样就不需要修改 NextAuth.js 配置

-- =====================================================
-- 方案1：重命名表（最简单）
-- =====================================================

-- 如果已经创建了 wmc_ 表，我们可以直接重命名
-- 先备份现有的 public 表（如果有数据的话）

-- 重命名原始表（添加 old 前缀）
ALTER TABLE IF EXISTS public.users RENAME TO old_users;
ALTER TABLE IF EXISTS public.accounts RENAME TO old_accounts;
ALTER TABLE IF EXISTS public.sessions RENAME TO old_sessions;
ALTER TABLE IF EXISTS public.verification_tokens RENAME TO old_verification_tokens;
ALTER TABLE IF EXISTS public.processing_history RENAME TO old_processing_history;

-- 重命名 wmc_ 表为原始表名
ALTER TABLE IF EXISTS public.wmc_users RENAME TO users;
ALTER TABLE IF EXISTS public.wmc_accounts RENAME TO accounts;
ALTER TABLE IF EXISTS public.wmc_sessions RENAME TO sessions;
ALTER TABLE IF EXISTS public.wmc_verification_tokens RENAME TO verification_tokens;
ALTER TABLE IF EXISTS public.wmc_processing_history RENAME TO processing_history;

-- =====================================================
-- 方案2：如果方案1有问题，使用视图（更灵活）
-- =====================================================

-- 创建与原表名相同的视图，指向 wmc_ 表
-- 这样 NextAuth.js 会继续使用原来的表名，但实际上访问的是 wmc_ 表

-- 首先删除已经重命名的表（如果执行了方案1）
-- DROP TABLE IF EXISTS public.users;
-- DROP TABLE IF EXISTS public.accounts;
-- DROP TABLE IF EXISTS public.sessions;
-- DROP TABLE IF EXISTS public.verification_tokens;
-- DROP TABLE IF EXISTS public.processing_history;

-- 创建视图
CREATE OR REPLACE VIEW public.users AS SELECT * FROM public.wmc_users;
CREATE OR REPLACE VIEW public.accounts AS SELECT * FROM public.wmc_accounts;
CREATE OR REPLACE VIEW public.sessions AS SELECT * FROM public.wmc_sessions;
CREATE OR REPLACE VIEW public.verification_tokens AS SELECT * FROM public.wmc_verification_tokens;
CREATE OR REPLACE VIEW public.processing_history AS SELECT * FROM public.wmc_processing_history;

-- 设置视图上的 RLS（如果需要）
ALTER VIEW public.users ALTER COLUMN id SET DEFAULT nextval('public.wmc_users_id_seq'::regclass);

-- =====================================================
-- 验证结果
-- =====================================================

-- 检查表和视图
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens', 'processing_history', 'wmc_users', 'wmc_accounts', 'wmc_sessions', 'wmc_verification_tokens', 'wmc_processing_history')
ORDER BY table_name;

-- 检查数据
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'accounts' as table_name, COUNT(*) as count FROM public.accounts
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as count FROM public.sessions
UNION ALL
SELECT 'verification_tokens' as table_name, COUNT(*) as count FROM public.verification_tokens
UNION ALL
SELECT 'processing_history' as table_name, COUNT(*) as count FROM public.processing_history;