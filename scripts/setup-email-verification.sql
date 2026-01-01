-- ============================================================
-- 邮箱验证码表（用于无密码认证）- 直接执行版本
-- 执行方式：在Supabase SQL编辑器中运行
-- ============================================================

-- 1. 创建邮箱验证码表
CREATE TABLE IF NOT EXISTS public.wmc_email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,  -- 6位数字验证码
    purpose TEXT NOT NULL CHECK (purpose IN ('register', 'login', 'update_email')), -- 用途
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0), -- 验证尝试次数（防止暴力破解）
    used BOOLEAN DEFAULT FALSE, -- 是否已使用（确保一次性）
    expires_at TIMESTAMPTZ NOT NULL, -- 过期时间（5分钟）
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email
ON public.wmc_email_verification_codes(email);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code
ON public.wmc_email_verification_codes(code);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires
ON public.wmc_email_verification_codes(expires_at, used)
WHERE used = FALSE;

-- 3. 为wmc_users表添加username字段（如果不存在）
ALTER TABLE public.wmc_users
ADD COLUMN IF NOT EXISTS username TEXT;

-- 4. 为已有用户生成用户名
UPDATE public.wmc_users
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL;

-- 5. 确保username唯一（重名的添加随机后缀）
DO $$
DECLARE
    duplicate RECORD;
    counter INTEGER := 0;
BEGIN
    -- 循环处理直到没有重复
    LOOP
        -- 查找第一个重复的用户名
        SELECT username INTO duplicate
        FROM public.wmc_users
        WHERE username IS NOT NULL
        GROUP BY username
        HAVING COUNT(*) > 1
        LIMIT 1;

        EXIT WHEN duplicate IS NULL OR counter > 100;

        -- 为重复的用户名添加随机后缀（保留一个）
        UPDATE public.wmc_users u1
        SET username = u1.username || '_' || substr(md5(random()::text), 1, 8)
        WHERE u1.id IN (
            SELECT id FROM (
                SELECT id,
                       row_number() OVER (PARTITION BY username ORDER BY created_at) as rn
                FROM public.wmc_users
                WHERE username = duplicate.username
            ) sub
            WHERE sub.rn > 1
        );

        counter := counter + 1;
    END LOOP;
END $$;

-- 6. 添加唯一约束（如果还不存在）
-- 注意：如果已经存在其他唯一约束，你可能需要先删除
ALTER TABLE public.wmc_users
ADD CONSTRAINT IF NOT EXISTS unique_username UNIQUE (username);

-- 7. 添加唯一约束到email字段（如果不存在）
ALTER TABLE public.wmc_users
ADD CONSTRAINT IF NOT EXISTS unique_email UNIQUE (email);

-- 成功提示
DO $$
BEGIN
    RAISE NOTICE '✅ 邮箱验证码表创建成功!';
    RAISE NOTICE '✅ wmc_users表已添加username字段!';
    RAISE NOTICE '📝 请手动执行以下操作：';
    RAISE NOTICE '   1. 在 Supabase > Authentication > URL Configuration 中配置';
    RAISE NOTICE '   2. 添加重定向 URL: http://localhost:3002/api/auth/callback/email-code';
END $$;
