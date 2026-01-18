-- ========================================
-- 解耦操作：删除 imposter_rooms 的外键依赖
-- 目标：让 wmc_ 项目和 imposter_ 项目完全独立
-- ========================================

BEGIN;  -- 开始事务，确保操作原子性

-- ========================================
-- 1. 备份与检查（先查询再操作）
-- ========================================

-- 1.1 检查当前外键约束
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('imposter_rooms', 'wmc_accounts', 'wmc_sessions')
ORDER BY tc.table_name;

-- 1.2 检查是否有孤儿数据（引用不存在的 user_id）
SELECT
  'imposter_rooms' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE u.id IS NULL) as orphan_records,
  CASE
    WHEN COUNT(*) = 0 THEN 0.00
    ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE u.id IS NULL) / COUNT(*), 2)
  END as orphan_percentage
FROM imposter_rooms r
LEFT JOIN wmc_users u ON r.host_id = u.id;  -- 两边都是 TEXT 类型，直接关联

-- 查看具体的孤儿记录（如果有）
SELECT
  r.id,
  r.host_id,
  r.created_at,
  '⚠️ 这个 host_id 在 wmc_users 中不存在' as warning
FROM imposter_rooms r
LEFT JOIN wmc_users u ON r.host_id = u.id  -- 两边都是 TEXT 类型，直接关联
WHERE u.id IS NULL
ORDER BY r.created_at DESC;

-- ========================================
-- 2. 删除外键约束（核心操作）
-- ========================================

-- 2.1 删除 imposter_rooms 的外键
ALTER TABLE imposter_rooms DROP CONSTRAINT IF EXISTS imposter_rooms_host_id_fkey;

-- 2.2 验证是否删除成功
SELECT
  '✅ imposter_rooms 外键已删除' as status,
  tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'imposter_rooms';
-- 应该返回 0 行

-- ========================================
-- 3. 数据一致性检查
-- ========================================

-- 3.1 检查删除后能否正常插入数据（测试）
-- 注意：下面的测试语句会实际插入数据，如果你想测试，请取消注释
/*
-- 测试1：插入不存在的 user_id（使用合法UUID格式，应该成功，因为没有外键验证了）
INSERT INTO imposter_rooms (id, host_id, name)
VALUES ('test-orphan-' || EXTRACT(EPOCH FROM NOW())::TEXT, '00000000-0000-0000-0000-000000000000', '测试孤儿记录');

-- 验证插入成功
SELECT * FROM imposter_rooms WHERE id LIKE 'test-orphan-%' ORDER BY created_at DESC LIMIT 1;

-- 清理测试数据
DELETE FROM imposter_rooms WHERE id LIKE 'test-orphan-%';
*/

-- 3.2 统计外键删除前后的数据分布
SELECT
  'wmc_users' as table_name,
  COUNT(*) as record_count,
  'TEXT' as id_type
FROM wmc_users

UNION ALL

SELECT
  'imposter_rooms' as table_name,
  COUNT(*) as record_count,
  'TEXT (no FK)' as id_type
FROM imposter_rooms

UNION ALL

SELECT
  'wmc_accounts' as table_name,
  COUNT(*) as record_count,
  'UUID (FK to auth.users)' as id_type
FROM wmc_accounts

UNION ALL

SELECT
  'wmc_sessions' as table_name,
  COUNT(*) as record_count,
  'UUID (FK to auth.users)' as id_type
FROM wmc_sessions;

-- ========================================
-- 4. 执行积分系统升级（解耦后可以安全执行）
-- ========================================

SELECT
  '✅ 现在可以安全执行积分系统升级了！' as message,
  'wmc_users.id 可以转换为 UUID 类型' as details;

-- 下面是完整的积分系统升级脚本引用
-- 请打开 update-credit-system-20260117.sql 文件并执行

/*
-- 步骤：
-- 1. 执行此解耦脚本（当前文件）
-- 2. 执行 update-credit-system-20260117.sql
-- 3. 重启应用
-- 4. 测试新用户注册流程
*/

-- ========================================
-- 5. 后续建议（可选）
-- ========================================

-- 5.1 在应用层实现数据完整性验证（替代数据库外键）
/*
// 示例：在创建房间时的代码验证
async function createImposterRoom(hostId, roomData) {
  // 1. 检查 host_id 是否存在
  const { data: user } = await supabase
    .from('wmc_users')
    .select('id')
    .eq('id', hostId)
    .single();

  if (!user) {
    throw new Error('Host user does not exist');
  }

  // 2. 执行插入
  return await supabase
    .from('imposter_rooms')
    .insert({ host_id: hostId, ...roomData });
}
*/

-- 5.2 如果 imposter_ 项目真的独立，建议创建自己的用户表
/*
CREATE TABLE IF NOT EXISTS imposter_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 然后修改 imposter_rooms 使用自己的用户表
ALTER TABLE imposter_rooms RENAME COLUMN host_id TO user_id;
-- 后续可以添加外键到 imposter_users.id
*/

-- 5.3 定期数据清理（删除孤儿记录）
/*
-- 每月运行一次，清理不存在的 host_id
DELETE FROM imposter_rooms r
WHERE NOT EXISTS (
  SELECT 1 FROM wmc_users u WHERE u.id = r.host_id
);
*/

-- ========================================
-- 6. 执行完成检查
-- ========================================

SELECT
  '✅ 解耦完成！' as status,
  'imposter_rooms 和 wmc_ 项目已完全独立' as details;

SELECT
  '⚠️  重要提醒' as reminder,
  '从现在开始，应用层需要负责数据完整性验证！' as details;

COMMIT;  -- 提交事务，所有更改正式生效

-- ========================================
-- 执行说明
-- ========================================

-- 请在 Supabase SQL Editor 中执行此脚本
-- 或使用 psql 命令行：
-- psql "postgresql://postgres:[YOUR_PASSWORD]@hatwvsjfedokodofiqsb.supabase.co:5432/postgres" -f decouple-imposter-rooms.sql

-- 执行顺序：
-- 1. 先在 Supabase 中粘贴此脚本并执行
-- 2. 确认外键已删除（第 45-50 行的查询返回 0 行）
-- 3. 执行 update-credit-system-20260117.sql
-- 4. 重启应用
-- 5. 测试新用户注册流程
