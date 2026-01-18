-- ========================================
-- 积分系统升级 - 最终版 🎯
-- 执行日期: 2026-01-17
-- 架构: public schema + wmc_ 前缀
-- 说明：采用最佳实践 - 删除外键 → 转换字段 → 重建外键
-- 注意：完全不碰 imposter_ 前缀的表
-- ========================================

-- ========================================
-- 0. 验证当前数据库架构（只查询 wmc_ 表）
-- ========================================

-- 检查 wmc_ 前缀表的字段类型
SELECT table_schema, table_name,
       (SELECT data_type FROM information_schema.columns
        WHERE table_schema = t.table_schema
          AND table_name = t.table_name
          AND column_name = 'id') as id_type,
       (SELECT data_type FROM information_schema.columns
        WHERE table_schema = t.table_schema
          AND table_name = t.table_name
          AND column_name = 'user_id') as user_id_type,
       (SELECT data_type FROM information_schema.columns
        WHERE table_schema = t.table_schema
          AND table_name = t.table_name
          AND column_name = 'userId') as "userId_type"
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('wmc_processing_history', 'wmc_email_verification_codes', 'wmc_users', 'wmc_accounts', 'wmc_sessions', 'wmc_verification_tokens')
ORDER BY table_name;

-- 检查 auth.users.id 的类型（应该是 UUID）
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'users'
  AND column_name = 'id';

-- 检查当前外键约束（只查询 wmc_ 表）
SELECT
  tc.table_name,
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
  AND tc.table_name LIKE 'wmc_%'
ORDER BY tc.table_name;

-- ========================================
-- 0.1 删除 wmc_ 表的外键约束（只删 wmc_ 的）
-- ========================================

-- 删除 wmc_accounts 的外键（约束名可能不用引号）
ALTER TABLE wmc_accounts DROP CONSTRAINT IF EXISTS wmc_accounts_userId_fkey;
ALTER TABLE wmc_accounts DROP CONSTRAINT IF EXISTS "wmc_accounts_userId_fkey";

-- 删除 wmc_sessions 的外键
ALTER TABLE wmc_sessions DROP CONSTRAINT IF EXISTS wmc_sessions_userId_fkey;
ALTER TABLE wmc_sessions DROP CONSTRAINT IF EXISTS "wmc_sessions_userId_fkey";

-- ========================================
-- 0.2 转换所有字段类型（只处理 wmc_ 表）
-- ========================================

-- 转换 wmc_accounts.userid（列名是小写）
ALTER TABLE wmc_accounts ALTER COLUMN userid TYPE UUID USING userid::uuid;

-- 转换 wmc_sessions.userid（列名是小写）
ALTER TABLE wmc_sessions ALTER COLUMN userid TYPE UUID USING userid::uuid;

-- 转换 wmc_processing_history.user_id
ALTER TABLE wmc_processing_history ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- ⚠️ 注意：不转换 wmc_users.id，保持为 TEXT 类型
-- 因为 imposter_rooms.host_id 引用了 wmc_users.id，转换会导致外键约束失败
-- 新表（wmc_credit, wmc_subscription）的 user_id 使用 TEXT 类型匹配

-- ========================================
-- 0.3 重建 wmc_ 表的外键约束
-- ========================================

-- 重建 wmc_accounts 的外键
ALTER TABLE wmc_accounts ADD CONSTRAINT wmc_accounts_userId_fkey
  FOREIGN KEY (userid) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 重建 wmc_sessions 的外键
ALTER TABLE wmc_sessions ADD CONSTRAINT wmc_sessions_userId_fkey
  FOREIGN KEY (userid) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========================================
-- 1. 创建 wmc_credit 表 (积分交易记录)
-- ========================================

CREATE TABLE IF NOT EXISTS wmc_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- 使用 UUID 匹配 auth.users.id 类型
  user_email TEXT,
  order_no TEXT,
  subscription_no TEXT,
  subscription_id UUID,  -- 外键在 wmc_subscription 表创建后添加
  transaction_no TEXT NOT NULL UNIQUE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('grant', 'consume')),
  transaction_scene TEXT,
  credits INTEGER NOT NULL, -- Positive for grant, negative for consume
  description TEXT,
  metadata TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 1.1 添加索引
CREATE INDEX IF NOT EXISTS idx_wmc_credit_user ON wmc_credit(user_id);
CREATE INDEX IF NOT EXISTS idx_wmc_credit_transaction ON wmc_credit(transaction_no);
CREATE INDEX IF NOT EXISTS idx_wmc_credit_type ON wmc_credit(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wmc_credit_status ON wmc_credit(status);
CREATE INDEX IF NOT EXISTS idx_wmc_credit_expires ON wmc_credit(expires_at);
CREATE INDEX IF NOT EXISTS idx_wmc_credit_user_expires ON wmc_credit(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_wmc_credit_subscription ON wmc_credit(subscription_id);
CREATE INDEX IF NOT EXISTS idx_wmc_credit_created ON wmc_credit(created_at DESC);

-- ========================================
-- 2. 创建 wmc_subscription 表 (订阅信息)
-- ========================================

CREATE TABLE IF NOT EXISTS wmc_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- 使用 UUID 匹配 auth.users.id 类型
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'trialing')),
  payment_provider TEXT,
  subscription_id TEXT, -- ID from payment provider
  subscription_result TEXT,
  subscription_no TEXT UNIQUE,
  product_id TEXT NOT NULL,
  product_name TEXT,
  credits_amount INTEGER,
  credits_valid_days INTEGER,
  amount INTEGER, -- In cents (e.g., 999 for $9.99)
  currency TEXT DEFAULT 'usd',
  interval TEXT CHECK (interval IN ('month', 'year')),
  interval_count INTEGER DEFAULT 1,
  trial_period_days INTEGER,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  canceled_end_at TIMESTAMPTZ,
  canceled_reason TEXT,
  canceled_reason_type TEXT,
  plan_name TEXT,
  billing_url TEXT,
  payment_product_id TEXT,
  payment_user_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 2.1 添加索引
CREATE INDEX IF NOT EXISTS idx_wmc_subscription_user ON wmc_subscription(user_id);
CREATE INDEX IF NOT EXISTS idx_wmc_subscription_status ON wmc_subscription(status);
CREATE INDEX IF NOT EXISTS idx_wmc_subscription_product ON wmc_subscription(product_id);
CREATE INDEX IF NOT EXISTS idx_wmc_subscription_provider ON wmc_subscription(payment_provider, subscription_id);
CREATE INDEX IF NOT EXISTS idx_wmc_subscription_period ON wmc_subscription(current_period_end);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wmc_subscription_unique_active ON wmc_subscription(user_id, product_id) WHERE status = 'active' AND deleted_at IS NULL;

-- 2.1.1 为 wmc_credit.subscription_id 添加外键（在 wmc_subscription 表创建后）
ALTER TABLE wmc_credit ADD CONSTRAINT wmc_credit_subscription_id_fkey
  FOREIGN KEY (subscription_id) REFERENCES wmc_subscription(id) ON DELETE SET NULL;

-- ========================================
-- 2.2 修改 wmc_processing_history 表
-- ========================================

-- 添加 credit_transaction_id 外键（关联到积分消费记录）
ALTER TABLE wmc_processing_history ADD COLUMN IF NOT EXISTS credit_transaction_id TEXT REFERENCES wmc_credit(transaction_no) ON DELETE SET NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_wmc_processing_credit_txn ON wmc_processing_history(credit_transaction_id);

-- ========================================
-- 3. 创建 wmc_config 表 (配置信息)
-- ========================================

CREATE TABLE IF NOT EXISTS wmc_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.1 添加产品映射配置（用于支付提供商）
INSERT INTO wmc_config (name, value, description) VALUES
(
  'creem_product_ids',
  '{
    "free-plan": "free_plan",
    "basic-monthly": "basic_monthly",
    "pro-monthly": "pro_monthly",
    "business-monthly": "business_monthly",
    "basic-yearly": "basic_yearly",
    "pro-yearly": "pro_yearly"
  }',
  'Lookup table for Creem product IDs'
)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 4. 为 wmc_credit 表启用行级安全
-- ========================================

ALTER TABLE wmc_credit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credits" ON wmc_credit;
CREATE POLICY "Users can view own credits" ON wmc_credit
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credit consume" ON wmc_credit;
CREATE POLICY "Users can insert own credit consume" ON wmc_credit
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND transaction_type = 'consume'
  );

DROP POLICY IF EXISTS "Service role can manage all credits" ON wmc_credit;
CREATE POLICY "Service role can manage all credits" ON wmc_credit
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ========================================
-- 5. 为 wmc_subscription 表启用行级安全
-- ========================================

ALTER TABLE wmc_subscription ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON wmc_subscription;
CREATE POLICY "Users can view own subscriptions" ON wmc_subscription
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON wmc_subscription;
CREATE POLICY "Service role can manage all subscriptions" ON wmc_subscription
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ========================================
-- 6. 创建数据库函数（用于查询积分余额）
-- ========================================

-- 6.1 查询积分余额函数
CREATE OR REPLACE FUNCTION public.get_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(credits), 0)
  INTO v_balance
  FROM wmc_credit
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2 过期积分函数
CREATE OR REPLACE FUNCTION public.expire_credits()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE wmc_credit
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND transaction_type = 'grant'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 6.3 处理图片并扣费函数（原子操作）
CREATE OR REPLACE FUNCTION public.process_with_credit(
  p_user_id UUID,
  p_image_size INTEGER,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id TEXT, error TEXT) AS $$
DECLARE
  v_balance INTEGER;
  v_transaction_id TEXT;
  v_error TEXT;
BEGIN
  -- 检查积分余额
  SELECT public.get_credit_balance(p_user_id) INTO v_balance;

  IF v_balance <= 0 THEN
    RETURN QUERY SELECT FALSE, NULL, 'Insufficient credits: ' || v_balance;
    RETURN;
  END IF;

  -- 生成事务ID
  v_transaction_id := 'TXN-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || substr(md5(random()::TEXT), 1, 8);

  -- 扣除积分
  INSERT INTO wmc_credit (
    user_id, transaction_no, transaction_type, transaction_scene, credits, status
  ) VALUES (
    p_user_id, v_transaction_id, 'consume', 'image_processing', -1, 'active'
  );

  -- 记录处理历史
  INSERT INTO wmc_processing_history (
    user_id, ip_address, image_size, success, credit_transaction_id
  ) VALUES (
    p_user_id, p_ip_address, p_image_size, TRUE, v_transaction_id
  );

  RETURN QUERY SELECT TRUE, v_transaction_id, NULL;

EXCEPTION WHEN OTHERS THEN
  v_error := SQLERRM;
  RETURN QUERY SELECT FALSE, NULL, v_error;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. 数据完整性检查
-- ========================================

-- 7.1 检查所有表是否创建成功
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('wmc_credit', 'wmc_subscription', 'wmc_processing_history', 'wmc_config', 'wmc_users', 'wmc_accounts', 'wmc_sessions', 'wmc_verification_tokens')
ORDER BY table_name;

-- 7.2 验证 RLS 启用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('wmc_credit', 'wmc_subscription')
ORDER BY tablename;

-- ========================================
-- 8. 执行完成提示
-- ========================================

-- 8.1 验证新表结构
SELECT
  '✅ Table Created' as status,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('wmc_credit', 'wmc_subscription', 'wmc_config')
ORDER BY table_name;

-- 8.2 验证函数创建
SELECT
  '✅ Function Created' as status,
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_credit_balance', 'expire_credits', 'process_with_credit')
ORDER BY routine_name;

-- 8.3 总结报告
SELECT
  '✅ Credit System Upgrade Complete!' as message,
  'All tables created with wmc_ prefix in public schema' as details;

-- ========================================
-- 9. 执行说明
-- ========================================

-- 请在 Supabase SQL Editor 中执行此脚本
-- 或使用 psql 命令行：
-- psql "postgresql://postgres:[YOUR_PASSWORD]@hatwvsjfedokodofiqsb.supabase.co:5432/postgres" -f update-credit-system-20260117-FINAL.sql

-- 执行后请重启应用并测试新用户注册流程
