-- ========================================
-- 为 imposter 项目恢复数据库层验证
-- 目标：重新创建外键约束，确保数据完整性
-- ========================================

-- ========================================
-- 检查当前表结构
-- ========================================

-- 检查 imposter_rooms 表结构
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'imposter_rooms'
ORDER BY ordinal_position;

-- 检查 wmc_users 表结构
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'wmc_users'
ORDER BY ordinal_position;

-- ========================================
-- 重新创建外键约束
-- ========================================

-- 前提条件：
-- 1. wmc_users.id 必须是 TEXT 类型（当前状态）
-- 2. imposter_rooms.host_id 必须是 TEXT 类型（当前状态）
-- 3. wmc_users.id 必须是 PRIMARY KEY
-- 4. 所有 imposter_rooms.host_id 的值必须在 wmc_users.id 中存在

-- 步骤1：验证数据完整性（先查询，确保没有孤儿记录）
SELECT
  'imposter_rooms' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE u.id IS NULL) as orphan_records
FROM imposter_rooms r
LEFT JOIN wmc_users u ON r.host_id = u.id;

-- 如果有孤儿记录，需要先清理或修复
-- 如果有孤儿记录，执行下面的查询查看详情：
-- SELECT * FROM imposter_rooms r LEFT JOIN wmc_users u ON r.host_id = u.id WHERE u.id IS NULL;

-- 步骤2：创建外键约束
-- 注意：wmc_users.id 和 imposter_rooms.host_id 都是 TEXT 类型
ALTER TABLE imposter_rooms ADD CONSTRAINT imposter_rooms_host_id_fkey
  FOREIGN KEY (host_id) REFERENCES wmc_users(id) ON DELETE RESTRICT;

-- RESTRICT 模式：如果 wmc_users 中的记录被 imposter_rooms 引用，则不允许删除
-- 如果你想允许级联删除（删除用户时自动删除其房间），使用 ON DELETE CASCADE

-- 步骤3：验证外键创建成功
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS referenced_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'imposter_rooms';

-- 应该返回 1 行，显示外键已创建

-- ========================================
-- 测试外键约束
-- ========================================

-- 测试1：尝试插入不存在的 user_id（应该失败）
/*
INSERT INTO imposter_rooms (id, host_id, name)
VALUES ('test-fail-' || EXTRACT(EPOCH FROM NOW())::TEXT, 'non-existent-user', '测试失败');
-- 期望结果：ERROR: insert or update on table "imposter_rooms" violates foreign key constraint
*/

-- 测试2：插入存在的 user_id（应该成功）
/*
-- 先获取一个存在的 user_id
SELECT id FROM wmc_users LIMIT 1;

-- 然后使用这个 ID 插入（替换下面的 'EXISTING_USER_ID'）
INSERT INTO imposter_rooms (id, host_id, name)
VALUES ('test-success-' || EXTRACT(EPOCH FROM NOW())::TEXT, 'EXISTING_USER_ID', '测试成功');

-- 验证插入成功
SELECT * FROM imposter_rooms WHERE id LIKE 'test-success-%' ORDER BY created_at DESC LIMIT 1;

-- 清理测试数据
DELETE FROM imposter_rooms WHERE id LIKE 'test-success-%';
*/

-- ========================================
-- 应用层注意事项
-- ========================================

-- 恢复外键后，应用层代码可以简化：
-- 不再需要手动验证 user 是否存在，数据库会自动验证

-- 之前（没有外键）：
/*
async function createRoom(hostId, roomData) {
  // 必须手动验证
  const { data: user } = await supabase.from('wmc_users').select('id').eq('id', hostId).single();
  if (!user) throw new Error('User not found');

  return await supabase.from('imposter_rooms').insert({ host_id: hostId, ...roomData });
}
*/

-- 之后（有外键）：
/*
async function createRoom(hostId, roomData) {
  // 直接插入，数据库会验证
  const { data, error } = await supabase
    .from('imposter_rooms')
    .insert({ host_id: hostId, ...roomData });

  if (error) {
    if (error.code === '23503') {  -- 外键约束违反
      throw new Error('Host user does not exist');
    }
    throw error;
  }

  return data;
}
*/

-- ========================================
-- 总结
-- ========================================

SELECT
  '✅ 外键已恢复' as status,
  'imposter_rooms.host_id 现在引用 wmc_users.id' as details;

SELECT
  '✅ 数据完整性由数据库层保护' as status,
  '无需应用层手动验证' as details;

SELECT
  '⚠️  注意' as note,
  '确保 imposter_rooms.host_id 的值都在 wmc_users.id 中存在' as reminder;

-- ========================================
-- 执行说明
-- ========================================

-- 请在 Supabase SQL Editor 中执行此脚本
-- 或使用 psql 命令行：
-- psql "postgresql://postgres:[YOUR_PASSWORD]@hatwvsjfedokodofiqsb.supabase.co:5432/postgres" -f restore-imposter-foreign-key.sql

-- 执行顺序：
-- 1. 在 imposter 项目中执行此脚本
-- 2. 应用层代码可以移除手动验证逻辑
-- 3. 测试外键约束是否正常工作
-- 4. 部署更新后的应用代码
