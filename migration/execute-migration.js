/**
 * WatermarkCleaner 数据库迁移执行脚本
 * 执行数据库迁移操作
 */

const { createClient } = require('@supabase/supabase-js');

// 从环境变量或手动配置数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hatwvsjfedokodofiqsb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdHd2c2pmZWRva29kb2ZpcXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5OTE5MzQsImV4cCI6MjA1MDU2NzkzNH0.6c6XhU1lR4wH8wW3y3zL0lJ8sJ0sJ0sJ0sJ0sJ0sJ0s';

const supabase = createClient(supabaseUrl, supabaseKey);

// 迁移SQL语句
const migrationSQL = `
-- WatermarkCleaner 数据库迁移
-- 创建备份schema
CREATE SCHEMA IF NOT EXISTS backup_watermarkcleaner;

-- 备份现有数据
CREATE TABLE IF NOT EXISTS backup_watermarkcleaner.users AS
SELECT * FROM watermarkcleaner.users WHERE NOT EXISTS (SELECT 1 FROM backup_watermarkcleaner.users);

CREATE TABLE IF NOT EXISTS backup_watermarkcleaner.accounts AS
SELECT * FROM watermarkcleaner.accounts WHERE NOT EXISTS (SELECT 1 FROM backup_watermarkcleaner.accounts);

CREATE TABLE IF NOT EXISTS backup_watermarkcleaner.sessions AS
SELECT * FROM watermarkcleaner.sessions WHERE NOT EXISTS (SELECT 1 FROM backup_watermarkcleaner.sessions);

CREATE TABLE IF NOT EXISTS backup_watermarkcleaner.verification_tokens AS
SELECT * FROM watermarkcleaner.verification_tokens WHERE NOT EXISTS (SELECT 1 FROM backup_watermarkcleaner.verification_tokens);

CREATE TABLE IF NOT EXISTS backup_watermarkcleaner.processing_history AS
SELECT * FROM watermarkcleaner.processing_history WHERE NOT EXISTS (SELECT 1 FROM backup_watermarkcleaner.processing_history);

-- 创建新表结构
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

CREATE TABLE IF NOT EXISTS public.wmc_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sessionToken TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL REFERENCES public.wmc_users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wmc_verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS public.wmc_processing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.wmc_users(id) ON DELETE CASCADE,
    ip_address TEXT,
    image_size INTEGER,
    success BOOLEAN,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 迁移数据（忽略冲突）
INSERT INTO public.wmc_users (id, email, name, image, emailVerified, tier, creditsUsed, creditsReset, created_at, updated_at)
SELECT id, email, name, image, emailVerified, tier, creditsUsed, creditsReset, created_at, updated_at
FROM watermarkcleaner.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wmc_accounts (id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, created_at, updated_at)
SELECT id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, created_at, updated_at
FROM watermarkcleaner.accounts
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wmc_sessions (id, sessionToken, userId, expires, created_at)
SELECT id, sessionToken, userId, expires, created_at
FROM watermarkcleaner.sessions
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wmc_verification_tokens (identifier, token, expires, created_at)
SELECT identifier, token, expires, created_at
FROM watermarkcleaner.verification_tokens
ON CONFLICT (identifier, token) DO NOTHING;

INSERT INTO public.wmc_processing_history (id, user_id, ip_address, image_size, success, processing_time_ms, created_at)
SELECT id, user_id, ip_address, image_size, success, processing_time_ms, created_at
FROM watermarkcleaner.processing_history
ON CONFLICT (id) DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wmc_users_email ON public.wmc_users(email);
CREATE INDEX IF NOT EXISTS idx_wmc_users_uuid ON public.wmc_users(id);
CREATE INDEX IF NOT EXISTS idx_wmc_users_tier ON public.wmc_users(tier);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wmc_accounts_provider_account ON public.wmc_accounts(provider, providerAccountId);
CREATE INDEX IF NOT EXISTS idx_wmc_accounts_user ON public.wmc_accounts(userId);
CREATE INDEX IF NOT EXISTS idx_wmc_sessions_user ON public.wmc_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_wmc_sessions_token ON public.wmc_sessions(sessionToken);
CREATE INDEX IF NOT EXISTS idx_wmc_verification_identifiers ON public.wmc_verification_tokens(identifier);
CREATE INDEX IF NOT EXISTS idx_wmc_verification_token ON public.wmc_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_wmc_processing_user ON public.wmc_processing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wmc_processing_ip ON public.wmc_processing_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_wmc_processing_created ON public.wmc_processing_history(created_at);
CREATE INDEX IF NOT EXISTS idx_wmc_processing_user_created ON public.wmc_processing_history(user_id, created_at);

-- 启用 RLS
ALTER TABLE public.wmc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_processing_history ENABLE ROW LEVEL SECURITY;
`;

async function executeMigration() {
  console.log('🚀 开始执行数据库迁移...\n');

  try {
    // 1. 执行迁移SQL
    console.log('📦 执行迁移SQL...');
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ 迁移执行失败:', error);
      throw error;
    }

    console.log('✅ 迁移SQL执行成功\n');

    // 2. 验证迁移结果
    console.log('🔍 验证迁移结果...');
    const tables = ['wmc_users', 'wmc_accounts', 'wmc_sessions', 'wmc_verification_tokens', 'wmc_processing_history'];

    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error(`❌ 查询 ${table} 失败:`, countError);
      } else {
        console.log(`✓ ${table}: ${count} 条记录`);
      }
    }

    console.log('\n🎉 数据库迁移完成！');
    console.log('\n⚠️  下一步：更新代码中的表名引用');
    console.log('请将代码中所有的 watermarkcleaner. 替换为 wmc_');

  } catch (error) {
    console.error('迁移失败:', error);
    console.log('\n请执行回滚操作：');
    console.log('1. 删除新创建的表');
    console.log('2. 恢复代码中的表名引用');
    process.exit(1);
  }
}

// 执行迁移
executeMigration();