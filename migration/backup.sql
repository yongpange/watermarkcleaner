-- WatermarkCleaner 数据库迁移备份脚本
-- 创建时间：2025-12-30
-- 用途：备份 watermarkcleaner schema 下的所有数据

-- 创建备份schema
CREATE SCHEMA IF NOT EXISTS backup_watermarkcleaner;

-- 备份 users 表
DROP TABLE IF EXISTS backup_watermarkcleaner.users;
CREATE TABLE backup_watermarkcleaner.users AS
SELECT * FROM watermarkcleaner.users;

-- 备份 accounts 表
DROP TABLE IF EXISTS backup_watermarkcleaner.accounts;
CREATE TABLE backup_watermarkcleaner.accounts AS
SELECT * FROM watermarkcleaner.accounts;

-- 备份 sessions 表
DROP TABLE IF EXISTS backup_watermarkcleaner.sessions;
CREATE TABLE backup_watermarkcleaner.sessions AS
SELECT * FROM watermarkcleaner.sessions;

-- 备份 verification_tokens 表
DROP TABLE IF EXISTS backup_watermarkcleaner.verification_tokens;
CREATE TABLE backup_watermarkcleaner.verification_tokens AS
SELECT * FROM watermarkcleaner.verification_tokens;

-- 备份 processing_history 表
DROP TABLE IF EXISTS backup_watermarkcleaner.processing_history;
CREATE TABLE backup_watermarkcleaner.processing_history AS
SELECT * FROM watermarkcleaner.processing_history;

-- 验证备份完整性
SELECT
    'users' as table_name,
    (SELECT COUNT(*) FROM watermarkcleaner.users) as original_count,
    (SELECT COUNT(*) FROM backup_watermarkcleaner.users) as backup_count
UNION ALL
SELECT
    'accounts' as table_name,
    (SELECT COUNT(*) FROM watermarkcleaner.accounts) as original_count,
    (SELECT COUNT(*) FROM backup_watercleaner.accounts) as backup_count
UNION ALL
SELECT
    'sessions' as table_name,
    (SELECT COUNT(*) FROM watermarkcleaner.sessions) as original_count,
    (SELECT COUNT(*) FROM backup_watermarkcleaner.sessions) as backup_count
UNION ALL
SELECT
    'verification_tokens' as table_name,
    (SELECT COUNT(*) FROM watermarkcleaner.verification_tokens) as original_count,
    (SELECT COUNT(*) FROM backup_watermarkcleaner.verification_tokens) as backup_count
UNION ALL
SELECT
    'processing_history' as table_name,
    (SELECT COUNT(*) FROM watermarkcleaner.processing_history) as original_count,
    (SELECT COUNT(*) FROM backup_watermarkcleaner.processing_history) as backup_count;