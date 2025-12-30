-- 最终解决方案：重命名表
-- 这样 NextAuth.js 不需要任何修改

-- 1. 备份现有的 public 表（如果还有数据）
CREATE SCHEMA IF NOT EXISTS backup_original_tables;

-- 备份原始表（如果存在）
CREATE TABLE IF NOT EXISTS backup_original_tables.users AS SELECT * FROM public.users WHERE 1=0;
CREATE TABLE IF NOT EXISTS backup_original_tables.accounts AS SELECT * FROM public.accounts WHERE 1=0;
CREATE TABLE IF NOT EXISTS backup_original_tables.sessions AS SELECT * FROM public.sessions WHERE 1=0;
CREATE TABLE IF NOT EXISTS backup_original_tables.verification_tokens AS SELECT * FROM public.verification_tokens WHERE 1=0;
CREATE TABLE IF NOT EXISTS backup_original_tables.processing_history AS SELECT * FROM public.processing_history WHERE 1=0;

-- 2. 如果原始表有数据，先备份
INSERT INTO backup_original_tables.users SELECT * FROM public.users;
INSERT INTO backup_original_tables.accounts SELECT * FROM public.accounts;
INSERT INTO backup_original_tables.sessions SELECT * FROM public.sessions;
INSERT INTO backup_original_tables.verification_tokens SELECT * FROM public.verification_tokens;
INSERT INTO backup_original_tables.processing_history SELECT * FROM public.processing_history;

-- 3. 删除原始表（如果存在）
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.verification_tokens CASCADE;
DROP TABLE IF EXISTS public.processing_history CASCADE;

-- 4. 重命名 wmc_ 表为原始表名
-- 注意：这会保留所有数据、索引和约束
ALTER TABLE public.wmc_users RENAME TO users;
ALTER TABLE public.wmc_accounts RENAME TO accounts;
ALTER TABLE public.wmc_sessions RENAME TO sessions;
ALTER TABLE public.wmc_verification_tokens RENAME TO verification_tokens;
ALTER TABLE public.wmc_processing_history RENAME TO processing_history;

-- 5. 重命名相关的序列（如果有）
-- 用户表的序列
ALTER SEQUENCE IF EXISTS public.wmc_users_id_seq RENAME TO users_id_seq;
ALTER SEQUENCE IF EXISTS public.wmc_accounts_id_seq RENAME TO accounts_id_seq;
ALTER SEQUENCE IF EXISTS public.wmc_sessions_id_seq RENAME TO sessions_id_seq;
ALTER SEQUENCE IF EXISTS public.wmc_verification_tokens_id_seq RENAME TO verification_tokens_id_seq;
ALTER SEQUENCE IF EXISTS public.wmc_processing_history_id_seq RENAME TO processing_history_id_seq;

-- 6. 验证结果
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'accounts' as table_name, COUNT(*) as count FROM public.accounts
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as count FROM public.sessions
UNION ALL
SELECT 'verification_tokens' as table_name, COUNT(*) as count FROM public.verification_tokens
UNION ALL
SELECT 'processing_history' as table_name, COUNT(*) as count FROM public.processing_history;