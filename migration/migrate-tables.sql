-- WatermarkCleaner 数据库迁移脚本
-- 执行步骤：
-- 1. 备份数据
-- 2. 创建新表
-- 3. 迁移数据
-- 4. 创建索引和约束
-- 5. 启用RLS

-- 开始事务
BEGIN;

-- =====================================================
-- 阶段1：创建备份（如果不存在则创建）
-- =====================================================
CREATE SCHEMA IF NOT EXISTS backup_watermarkcleaner;

-- 备份现有数据（如果备份表不存在）
DO $$
BEGIN
    -- 检查并备份 users 表
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'backup_watermarkcleaner'
                   AND table_name = 'users') THEN
        EXECUTE 'CREATE TABLE backup_watermarkcleaner.users AS SELECT * FROM watermarkcleaner.users';
        RAISE NOTICE '已备份 users 表';
    ELSE
        RAISE NOTICE 'users 表备份已存在，跳过';
    END IF;

    -- 检查并备份 accounts 表
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'backup_watermarkcleaner'
                   AND table_name = 'accounts') THEN
        EXECUTE 'CREATE TABLE backup_watermarkcleaner.accounts AS SELECT * FROM watermarkcleaner.accounts';
        RAISE NOTICE '已备份 accounts 表';
    ELSE
        RAISE NOTICE 'accounts 表备份已存在，跳过';
    END IF;

    -- 检查并备份 sessions 表
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'backup_watermarkcleaner'
                   AND table_name = 'sessions') THEN
        EXECUTE 'CREATE TABLE backup_watermarkcleaner.sessions AS SELECT * FROM watermarkcleaner.sessions';
        RAISE NOTICE '已备份 sessions 表';
    ELSE
        RAISE NOTICE 'sessions 表备份已存在，跳过';
    END IF;

    -- 检查并备份 verification_tokens 表
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'backup_watermarkcleaner'
                   AND table_name = 'verification_tokens') THEN
        EXECUTE 'CREATE TABLE backup_watermarkcleaner.verification_tokens AS SELECT * FROM watermarkcleaner.verification_tokens';
        RAISE NOTICE '已备份 verification_tokens 表';
    ELSE
        RAISE NOTICE 'verification_tokens 表备份已存在，跳过';
    END IF;

    -- 检查并备份 processing_history 表
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'backup_watermarkcleaner'
                   AND table_name = 'processing_history') THEN
        EXECUTE 'CREATE TABLE backup_watermarkcleaner.processing_history AS SELECT * FROM watermarkcleaner.processing_history';
        RAISE NOTICE '已备份 processing_history 表';
    ELSE
        RAISE NOTICE 'processing_history 表备份已存在，跳过';
    END IF;
END $$;

-- =====================================================
-- 阶段2：创建新表结构
-- =====================================================

-- 1. 创建 wmc_users 表
CREATE TABLE IF NOT EXISTS public.wmc_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    emailVerified TIMESTAMPTZ,
    tier TEXT DEFAULT 'unverified',
    creditsUsed INTEGER DEFAULT 0,
    creditsReset TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建 wmc_accounts 表 (NextAuth.js)
CREATE TABLE IF NOT EXISTS public.wmc_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userId TEXT NOT NULL REFERENCES public.wmc_users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建 wmc_sessions 表 (NextAuth.js)
CREATE TABLE IF NOT EXISTS public.wmc_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sessionToken TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL REFERENCES public.wmc_users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 wmc_verification_tokens 表 (NextAuth.js)
CREATE TABLE IF NOT EXISTS public.wmc_verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (identifier, token)
);

-- 5. 创建 wmc_processing_history 表
CREATE TABLE IF NOT EXISTS public.wmc_processing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.wmc_users(id) ON DELETE CASCADE,
    ip_address TEXT,
    image_size INTEGER,
    success BOOLEAN,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 阶段3：迁移数据（只迁移不存在的记录）
-- =====================================================

-- 迁移用户数据
INSERT INTO public.wmc_users (id, email, name, image, emailVerified, tier, creditsUsed, creditsReset, created_at, updated_at)
SELECT id, email, name, image, emailVerified, tier, creditsUsed, creditsReset, created_at, updated_at
FROM watermarkcleaner.users
ON CONFLICT (id) DO NOTHING;

-- 迁移账户数据
INSERT INTO public.wmc_accounts (id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, created_at, updated_at)
SELECT id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, created_at, updated_at
FROM watermarkcleaner.accounts
ON CONFLICT (id) DO NOTHING;

-- 迁移会话数据
INSERT INTO public.wmc_sessions (id, sessionToken, userId, expires, created_at)
SELECT id, sessionToken, userId, expires, created_at
FROM watermarkcleaner.sessions
ON CONFLICT (id) DO NOTHING;

-- 迁移验证令牌数据
INSERT INTO public.wmc_verification_tokens (identifier, token, expires, created_at)
SELECT identifier, token, expires, created_at
FROM watermarkcleaner.verification_tokens
ON CONFLICT (identifier, token) DO NOTHING;

-- 迁移处理历史数据
INSERT INTO public.wmc_processing_history (id, user_id, ip_address, image_size, success, processing_time_ms, created_at)
SELECT id, user_id, ip_address, image_size, success, processing_time_ms, created_at
FROM watermarkcleaner.processing_history
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 阶段4：创建索引（如果不存在）
-- =====================================================

-- wmc_users 索引
CREATE INDEX IF NOT EXISTS idx_wmc_users_email ON public.wmc_users(email);
CREATE INDEX IF NOT EXISTS idx_wmc_users_uuid ON public.wmc_users(id);
CREATE INDEX IF NOT EXISTS idx_wmc_users_tier ON public.wmc_users(tier);

-- wmc_accounts 索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_wmc_accounts_provider_account ON public.wmc_accounts(provider, providerAccountId);
CREATE INDEX IF NOT EXISTS idx_wmc_accounts_user ON public.wmc_accounts(userId);

-- wmc_sessions 索引
CREATE INDEX IF NOT EXISTS idx_wmc_sessions_user ON public.wmc_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_wmc_sessions_token ON public.wmc_sessions(sessionToken);

-- wmc_verification_tokens 索引
CREATE INDEX IF NOT EXISTS idx_wmc_verification_identifiers ON public.wmc_verification_tokens(identifier);
CREATE INDEX IF NOT EXISTS idx_wmc_verification_token ON public.wmc_verification_tokens(token);

-- wmc_processing_history 索引
CREATE INDEX IF NOT EXISTS idx_wmc_processing_user ON public.wmc_processing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wmc_processing_ip ON public.wmc_processing_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_wmc_processing_created ON public.wmc_processing_history(created_at);
CREATE INDEX IF NOT EXISTS idx_wmc_processing_user_created ON public.wmc_processing_history(user_id, created_at);

-- =====================================================
-- 阶段5：启用 RLS（如果不存在）
-- =====================================================

-- 启用 RLS（如果不存在）
ALTER TABLE public.wmc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_processing_history ENABLE ROW LEVEL SECURITY;

-- 提交事务
COMMIT;

-- =====================================================
-- 阶段6：验证迁移结果
-- =====================================================

-- 显示迁移统计
SELECT
    'wmc_users' as table_name,
    (SELECT COUNT(*) FROM public.wmc_users) as new_count,
    (SELECT COUNT(*) FROM watermarkcleaner.users) as old_count
UNION ALL
SELECT
    'wmc_accounts' as table_name,
    (SELECT COUNT(*) FROM public.wmc_accounts) as new_count,
    (SELECT COUNT(*) FROM watermarkcleaner.accounts) as old_count
UNION ALL
SELECT
    'wmc_sessions' as table_name,
    (SELECT COUNT(*) FROM public.wmc_sessions) as new_count,
    (SELECT COUNT(*) FROM watermarkcleaner.sessions) as old_count
UNION ALL
SELECT
    'wmc_verification_tokens' as table_name,
    (SELECT COUNT(*) FROM public.wmc_verification_tokens) as new_count,
    (SELECT COUNT(*) FROM watermarkcleaner.verification_tokens) as old_count
UNION ALL
SELECT
    'wmc_processing_history' as table_name,
    (SELECT COUNT(*) FROM public.wmc_processing_history) as new_count,
    (SELECT COUNT(*) FROM watermarkcleaner.processing_history) as old_count
ORDER BY table_name;