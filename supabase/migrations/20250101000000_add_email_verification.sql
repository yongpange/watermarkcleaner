-- ============================================================
-- 邮箱验证码表（用于无密码认证）
-- 创建时间: 2025-01-01
-- 创建人: Claude Code AI
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wmc_email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,  -- 6位数字验证码
    purpose TEXT NOT NULL CHECK (purpose IN ('register', 'login', 'update_email')), -- 用途
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0), -- 验证尝试次数（防止暴力破解）
    used BOOLEAN DEFAULT FALSE, -- 是否已使用（确保一次性）
    expires_at TIMESTAMPTZ NOT NULL, -- 过期时间（5分钟）
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_unused_code UNIQUE (email, code, used) WHERE used = FALSE
);

-- 数据库索引（优化查询性能）
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email
ON public.wmc_email_verification_codes(email);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code
ON public.wmc_email_verification_codes(code);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires
ON public.wmc_email_verification_codes(expires_at, used)
WHERE used = FALSE;

-- 表注释
COMMENT ON TABLE public.wmc_email_verification_codes IS '邮箱验证码表，用于无密码认证系统';
COMMENT ON COLUMN public.wmc_email_verification_codes.email IS '用户邮箱地址';
COMMENT ON COLUMN public.wmc_email_verification_codes.code IS '6位数字验证码';
COMMENT ON COLUMN public.wmc_email_verification_codes.purpose IS '验证码用途（register/login/update_email）';
COMMENT ON COLUMN public.wmc_email_verification_codes.attempts IS '验证尝试次数，最多3次';
COMMENT ON COLUMN public.wmc_email_verification_codes.used IS '是否已使用，确保一次性';
COMMENT ON COLUMN public.wmc_email_verification_codes.expires_at IS '过期时间，默认5分钟后';


-- ============================================================
-- 为wmc_users表添加username字段（如果不存在）
-- ============================================================
DO $$
BEGIN
    -- 检查username字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'wmc_users'
        AND column_name = 'username'
    ) THEN
        -- 添加username字段
        ALTER TABLE public.wmc_users
        ADD COLUMN username TEXT;

        -- 为已有用户生成用户名（从邮箱前缀）
        UPDATE public.wmc_users
        SET username = lower(split_part(email, '@', 1))
        WHERE username IS NULL;

        -- 处理重复的用户名
        WITH duplicate_users AS (
            SELECT id,
                   email,
                   row_number() OVER (PARTITION BY username ORDER BY created_at) as rn
            FROM public.wmc_users
            WHERE username IN (
                SELECT username
                FROM public.wmc_users
                GROUP BY username
                HAVING COUNT(*) > 1
            )
        )
        UPDATE public.wmc_users u
        SET username = u.username || '_' || substr(md5(random()::text), 1, 8)
        FROM duplicate_users du
        WHERE u.id = du.id AND du.rn > 1;

        RAISE NOTICE 'Added username column to wmc_users table';
    ELSE
        RAISE NOTICE 'username column already exists in wmc_users table';
    END IF;
END $$;


-- ============================================================
-- 确保username字段唯一
-- ============================================================
DO $$
BEGIN
    -- 检查unique约束是否存在
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_username'
        AND conrelid = 'public.wmc_users'::regclass
    ) THEN
        -- 检查是否有重复的username
        IF EXISTS (
            SELECT username FROM public.wmc_users
            WHERE username IS NOT NULL
            GROUP BY username
            HAVING COUNT(*) > 1
        ) THEN
            -- 为重复的用户名添加随机后缀
            UPDATE public.wmc_users u1
            SET username = u1.username || '_' || substr(md5(random()::text), 1, 8)
            WHERE u1.id IN (
                SELECT id FROM (
                    SELECT id,
                           row_number() OVER (PARTITION BY username ORDER BY created_at) as rn
                    FROM public.wmc_users
                    WHERE username IN (
                        SELECT username
                        FROM public.wmc_users
                        WHERE username IS NOT NULL
                        GROUP BY username
                        HAVING COUNT(*) > 1
                    )
                ) sub
                WHERE sub.rn > 1
            );
        END IF;

        -- 添加唯一约束
        ALTER TABLE public.wmc_users
        ADD CONSTRAINT unique_username UNIQUE (username);

        RAISE NOTICE 'Added unique constraint to username column';
    ELSE
        RAISE NOTICE 'unique_username constraint already exists';
    END IF;
END $$;


-- ============================================================
-- 添加RLS（Row Level Security）策略（可选）
-- ============================================================
-- 如果需要启用RLS，取消以下注释

-- ALTER TABLE public.wmc_email_verification_codes ENABLE ROW LEVEL SECURITY;

-- 允许所有用户插入（发送验证码）
-- CREATE POLICY "任何人可以发送验证码"
-- ON public.wmc_email_verification_codes FOR INSERT
-- WITH CHECK (true);

-- 不允许直接查询（通过 API 验证）
-- CREATE POLICY "不允许直接查询验证码"
-- ON public.wmc_email_verification_codes FOR SELECT
-- USING (false);

-- 允许更新（标记为已使用）
-- CREATE POLICY "可以更新自己的验证码"
-- ON public.wmc_email_verification_codes FOR UPDATE
-- USING (true);


-- ============================================================
-- 数据清理函数（可选：定期清理过期数据）
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_rows INTEGER;
BEGIN
    DELETE FROM public.wmc_email_verification_codes
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_rows = ROW_COUNT;

    RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 创建清理过期验证码的定期任务
-- 使用 Supabase 的 pg_cron 或手动调用
-- ============================================================
-- 如果使用 pg_cron，取消以下注释：

-- SELECT cron.schedule(
--     'cleanup-expired-codes',
--     '0 4 * * *', -- 每天凌晨4点执行
--     $$SELECT cleanup_expired_verification_codes()$$
-- );


-- ============================================================
-- 验证函数（返回void或抛出异常）
-- ============================================================
CREATE OR REPLACE FUNCTION verify_verification_code(
    p_email TEXT,
    p_code TEXT,
    p_purpose TEXT
) RETURNS TABLE (
    code_id UUID,
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        evc.id,
        CASE
            WHEN evc.used = TRUE THEN FALSE
            WHEN evc.expires_at < NOW() THEN FALSE
            WHEN evc.purpose != p_purpose THEN FALSE
            ELSE TRUE
        END,
        CASE
            WHEN evc.used = TRUE THEN 'Code already used'
            WHEN evc.expires_at < NOW() THEN 'Code expired'
            WHEN evc.purpose != p_purpose THEN 'Invalid purpose'
            ELSE NULL
        END::TEXT
    FROM public.wmc_email_verification_codes evc
    WHERE evc.email = p_email
    AND evc.code = p_code
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 插入示例数据（测试用，生产环境应删除）
-- ============================================================
-- INSERT INTO public.wmc_email_verification_codes (email, code, purpose, expires_at)
-- VALUES (
--     'test@example.com',
--     '123456',
--     'register',
--     NOW() + INTERVAL '5 minutes'
-- );


-- ============================================================
-- 迁移完成标记
-- ============================================================
INSERT INTO public.migration_history (migration_name, applied_at)
VALUES ('add_email_verification_codes', NOW())
ON CONFLICT (migration_name)
DO UPDATE SET applied_at = NOW();


-- Success message
RAISE NOTICE 'Email verification migration completed successfully!';

