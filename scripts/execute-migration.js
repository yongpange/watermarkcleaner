/**
 * 执行数据库迁移
 * 将 watermarkcleaner schema 下的表迁移到 public schema，并添加 wmc_ 前缀
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 读取环境变量
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 迁移SQL语句
const migrationSteps = [
  {
    name: '创建备份schema',
    sql: `CREATE SCHEMA IF NOT EXISTS backup_watermarkcleaner;`
  },
  {
    name: '备份数据',
    sql: `
      -- 备份 users 表
      DROP TABLE IF EXISTS backup_watermarkcleaner.users;
      CREATE TABLE backup_watermarkcleaner.users AS SELECT * FROM watermarkcleaner.users;

      -- 备份 accounts 表
      DROP TABLE IF EXISTS backup_watermarkcleaner.accounts;
      CREATE TABLE backup_watermarkcleaner.accounts AS SELECT * FROM watermarkcleaner.accounts;

      -- 备份 sessions 表
      DROP TABLE IF EXISTS backup_watermarkcleaner.sessions;
      CREATE TABLE backup_watermarkcleaner.sessions AS SELECT * FROM watermarkcleaner.sessions;

      -- 备份 verification_tokens 表
      DROP TABLE IF EXISTS backup_watermarkcleaner.verification_tokens;
      CREATE TABLE backup_watermarkcleaner.verification_tokens AS SELECT * FROM watermarkcleaner.verification_tokens;

      -- 备份 processing_history 表
      DROP TABLE IF EXISTS backup_watermarkcleaner.processing_history;
      CREATE TABLE backup_watermarkcleaner.processing_history AS SELECT * FROM watermarkcleaner.processing_history;
    `
  },
  {
    name: '创建新表结构',
    sql: `
      -- 创建 wmc_users 表
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

      -- 创建 wmc_accounts 表 (NextAuth.js)
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

      -- 创建 wmc_sessions 表 (NextAuth.js)
      CREATE TABLE IF NOT EXISTS public.wmc_sessions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        sessionToken TEXT UNIQUE NOT NULL,
        userId TEXT NOT NULL REFERENCES public.wmc_users(id) ON DELETE CASCADE,
        expires TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 创建 wmc_verification_tokens 表 (NextAuth.js)
      CREATE TABLE IF NOT EXISTS public.wmc_verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (identifier, token)
      );

      -- 创建 wmc_processing_history 表
      CREATE TABLE IF NOT EXISTS public.wmc_processing_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES public.wmc_users(id) ON DELETE CASCADE,
        ip_address TEXT,
        image_size INTEGER,
        success BOOLEAN,
        processing_time_ms INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: '迁移数据',
    sql: `
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
    `
  },
  {
    name: '创建索引',
    sql: `
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
    `
  },
  {
    name: '启用 RLS',
    sql: `
      ALTER TABLE public.wmc_users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.wmc_accounts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.wmc_sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.wmc_verification_tokens ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.wmc_processing_history ENABLE ROW LEVEL SECURITY;
    `
  }
];

async function executeMigration() {
  console.log('🚀 开始执行数据库迁移...\n');

  for (const step of migrationSteps) {
    console.log(`📦 正在执行: ${step.name}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: step.sql
      });

      if (error) {
        console.error(`❌ ${step.name} 失败:`, error);
        throw new Error(`迁移步骤失败: ${step.name}`);
      }

      console.log(`✅ ${step.name} 完成\n`);

    } catch (error) {
      console.error('\n❌ 迁移失败:', error);
      console.log('\n请手动执行回滚操作或联系技术支持。');
      process.exit(1);
    }
  }

  console.log('🎉 数据库迁移完成！');
  console.log('\n📊 验证数据完整性...');

  // 验证迁移结果
  const tables = ['wmc_users', 'wmc_accounts', 'wmc_sessions', 'wmc_verification_tokens', 'wmc_processing_history'];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ 查询 ${table} 失败:`, error);
      } else {
        console.log(`✓ ${table}: ${count} 条记录`);
      }
    } catch (error) {
      console.error(`❌ 验证 ${table} 时出错:`, error);
    }
  }

  console.log('\n✅ 迁移验证完成！');
  console.log('\n⚠️  下一步：');
  console.log('1. 更新代码中所有的 watermarkcleaner. 替换为 wmc_');
  console.log('2. 更新 NextAuth.js 配置');
  console.log('3. 更新 TypeScript 类型定义');
  console.log('4. 测试所有功能是否正常');
}

// 执行迁移
executeMigration().catch(console.error);