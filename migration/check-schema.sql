-- 检查 watermarkcleaner schema 下各表的结构

-- 检查 processing_history 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'watermarkcleaner' AND table_name = 'processing_history'
ORDER BY ordinal_position;

-- 检查所有表的结构
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'watermarkcleaner'
ORDER BY table_name, ordinal_position;