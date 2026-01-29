-- ============================================================================
-- WMC_ORDER 表创建脚本
-- 用于存储支付订单信息
-- 创建日期: 2026-01-28
-- ============================================================================

-- 1. 创建 wmc_order 表
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wmc_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    user_email TEXT,
    
    -- 订单状态: pending, processing, paid, failed, canceled, refunded
    status TEXT NOT NULL DEFAULT 'pending',
    
    -- 金额信息
    amount INTEGER NOT NULL DEFAULT 0,  -- 订单金额 (分)
    currency TEXT NOT NULL DEFAULT 'usd',
    payment_amount INTEGER,  -- 实际支付金额 (分)
    payment_currency TEXT,
    
    -- 支付类型信息
    payment_type TEXT,  -- one_time, subscription
    payment_interval TEXT,  -- month, year
    payment_provider TEXT NOT NULL,  -- creem, stripe, paypal
    payment_session_id TEXT,
    
    -- Checkout 信息
    checkout_info TEXT NOT NULL,  -- JSON string
    checkout_result TEXT,
    checkout_url TEXT,
    callback_url TEXT,
    
    -- 支付结果
    payment_result TEXT,
    payment_email TEXT,
    transaction_id TEXT,
    paid_at TIMESTAMPTZ,
    
    -- 订阅关联
    subscription_id TEXT,
    subscription_result TEXT,
    
    -- 折扣信息
    discount_code TEXT,
    discount_amount INTEGER,
    discount_currency TEXT,
    
    -- 积分信息
    credits_amount INTEGER,
    credits_valid_days INTEGER,
    
    -- 产品信息
    product_id TEXT,
    product_name TEXT,
    plan_name TEXT,
    description TEXT,
    
    -- 发票信息
    invoice_id TEXT,
    invoice_url TEXT,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- 外键约束 (可选，如果需要严格关联)
    CONSTRAINT fk_wmc_order_user_id FOREIGN KEY (user_id) 
        REFERENCES public.wmc_users(id) ON DELETE CASCADE
);

-- 2. 创建索引以提高查询性能
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_wmc_order_user_id ON public.wmc_order(user_id);
CREATE INDEX IF NOT EXISTS idx_wmc_order_order_no ON public.wmc_order(order_no);
CREATE INDEX IF NOT EXISTS idx_wmc_order_status ON public.wmc_order(status);
CREATE INDEX IF NOT EXISTS idx_wmc_order_product_id ON public.wmc_order(product_id);
CREATE INDEX IF NOT EXISTS idx_wmc_order_transaction_id ON public.wmc_order(transaction_id);
CREATE INDEX IF NOT EXISTS idx_wmc_order_created_at ON public.wmc_order(created_at DESC);

-- 3. 启用 RLS (Row Level Security)
-- ----------------------------------------------------------------------------
ALTER TABLE public.wmc_order ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
-- ----------------------------------------------------------------------------

-- 4.1 允许用户查看自己的订单
CREATE POLICY "Users can view their own orders"
    ON public.wmc_order
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- 4.2 允许用户创建自己的订单 (通常由后端 Service Role 处理)
CREATE POLICY "Users can create their own orders"
    ON public.wmc_order
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- 4.3 允许用户更新自己的订单 (有限制)
CREATE POLICY "Users can update their own orders"
    ON public.wmc_order
    FOR UPDATE
    USING (auth.uid()::text = user_id);

-- 4.4 Service Role 可以执行所有操作 (用于 Webhook 和后台处理)
-- 注意: Service Role 默认绑过 RLS，此策略是额外保障
CREATE POLICY "Service role has full access"
    ON public.wmc_order
    FOR ALL
    USING (auth.role() = 'service_role');

-- 5. 添加触发器自动更新 updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_wmc_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wmc_order_updated_at
    BEFORE UPDATE ON public.wmc_order
    FOR EACH ROW
    EXECUTE FUNCTION update_wmc_order_updated_at();

-- ============================================================================
-- 补充: 检查现有表的 RLS 策略是否完善
-- ============================================================================

-- 6. wmc_subscription 表 RLS 策略 (如果尚未设置)
-- ----------------------------------------------------------------------------
ALTER TABLE public.wmc_subscription ENABLE ROW LEVEL SECURITY;

-- 用户查看自己的订阅
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.wmc_subscription;
CREATE POLICY "Users can view their own subscriptions"
    ON public.wmc_subscription
    FOR SELECT
    USING (user_id::text = auth.uid()::text);

-- Service Role 完全访问
DROP POLICY IF EXISTS "Service role has full access to subscriptions" ON public.wmc_subscription;
CREATE POLICY "Service role has full access to subscriptions"
    ON public.wmc_subscription
    FOR ALL
    USING (auth.role() = 'service_role');

-- 7. wmc_credit 表 RLS 策略 (如果尚未设置)
-- ----------------------------------------------------------------------------
ALTER TABLE public.wmc_credit ENABLE ROW LEVEL SECURITY;

-- 用户查看自己的积分记录
DROP POLICY IF EXISTS "Users can view their own credits" ON public.wmc_credit;
CREATE POLICY "Users can view their own credits"
    ON public.wmc_credit
    FOR SELECT
    USING (user_id::text = auth.uid()::text);

-- Service Role 完全访问
DROP POLICY IF EXISTS "Service role has full access to credits" ON public.wmc_credit;
CREATE POLICY "Service role has full access to credits"
    ON public.wmc_credit
    FOR ALL
    USING (auth.role() = 'service_role');

-- 8. wmc_processing_history 表 RLS 策略
-- ----------------------------------------------------------------------------
ALTER TABLE public.wmc_processing_history ENABLE ROW LEVEL SECURITY;

-- 用户查看自己的处理历史
DROP POLICY IF EXISTS "Users can view their own processing history" ON public.wmc_processing_history;
CREATE POLICY "Users can view their own processing history"
    ON public.wmc_processing_history
    FOR SELECT
    USING (user_id::text = auth.uid()::text);

-- Service Role 完全访问
DROP POLICY IF EXISTS "Service role has full access to processing history" ON public.wmc_processing_history;
CREATE POLICY "Service role has full access to processing history"
    ON public.wmc_processing_history
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- 执行完成后，请在终端运行以下命令重新生成 TypeScript 类型:
-- npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
-- ============================================================================
