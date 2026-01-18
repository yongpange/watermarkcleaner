-- =====================================
-- WatermarkCleaner Schema Setup
-- Description: Create tables for watermarkcleaner project in public schema
-- =====================================

-- 1. Tables in Public Schema

-- =====================================
-- Table: users
-- Description: User accounts (used by NextAuth.js)
-- =====================================
CREATE TABLE IF NOT EXISTS public.wmc_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  emailVerified TIMESTAMPTZ,
  image TEXT,

  -- Custom fields for watermarkcleaner
  tier TEXT DEFAULT 'unverified', -- unverified, verified, pro
  creditsUsed INTEGER DEFAULT 0,  -- Monthly usage counter
  creditsReset TIMESTAMPTZ DEFAULT NOW(),

  -- Additional fields from original users table
  uuid TEXT,  -- Supabase Auth UUID
  nickname TEXT,
  avatar_url TEXT,
  locale TEXT,
  signin_type TEXT,
  signin_ip TEXT,
  signin_provider TEXT,
  signin_openid TEXT,
  invite_code TEXT,
  invited_by TEXT,
  is_affiliate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.wmc_users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON public.wmc_users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.wmc_users(tier);

-- =====================================
-- Table: accounts
-- Description: OAuth accounts (required by NextAuth.js)
-- =====================================
CREATE TABLE IF NOT EXISTS public.wmc_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Indexes for accounts table
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider_account ON public.wmc_accounts(provider, providerAccountId);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.wmc_accounts(userId);

-- =====================================
-- Table: sessions
-- Description: User sessions (required by NextAuth.js)
-- =====================================
CREATE TABLE IF NOT EXISTS public.wmc_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL REFERENCES public.wmc_users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.wmc_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.wmc_sessions(sessionToken);

-- =====================================
-- Table: verification_tokens
-- Description: Email verification tokens (required by NextAuth.js)
-- =====================================
CREATE TABLE IF NOT EXISTS public.wmc_verification_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for verification_tokens table
CREATE INDEX IF NOT EXISTS idx_verification_identifiers ON public.wmc_verification_tokens(identifier);
CREATE INDEX IF NOT EXISTS idx_verification_token ON public.wmc_verification_tokens(token);

-- =====================================
-- Table: processing_history
-- Description: Image processing history
-- =====================================
CREATE TABLE IF NOT EXISTS public.wmc_processing_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.wmc_users(id) ON DELETE CASCADE,
  ip_address TEXT,
  image_size INTEGER,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for processing_history table
CREATE INDEX IF NOT EXISTS idx_processing_user ON public.wmc_processing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_ip ON public.wmc_processing_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_processing_created ON public.wmc_processing_history(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_user_created ON public.wmc_processing_history(user_id, created_at);

-- =====================================
-- Enable Row Level Security (important for security)
-- =====================================
ALTER TABLE public.wmc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmc_processing_history ENABLE ROW LEVEL SECURITY;

-- =====================================
-- Grant permissions
-- =====================================
GRANT USAGE ON SCHEMA watermarkcleaner TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA watermarkcleaner TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA watermarkcleaner TO postgres;

-- Grant select for anonymous and authenticated roles (for Supabase RLS)
GRANT SELECT ON ALL TABLES IN SCHEMA watermarkcleaner TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA watermarkcleaner TO authenticated;

-- =====================================
-- Comments for documentation
-- =====================================
COMMENT ON SCHEMA watermarkcleaner IS 'Schema for WatermarkCleaner application - isolated from other projects';
COMMENT ON TABLE public.wmc_users IS 'User accounts with tier and credit management';
COMMENT ON TABLE public.wmc_accounts IS 'OAuth accounts (NextAuth.js)';
COMMENT ON TABLE public.wmc_sessions IS 'User sessions (NextAuth.js)';
COMMENT ON TABLE public.wmc_verification_tokens IS 'Email verification tokens (NextAuth.js)';
COMMENT ON TABLE public.wmc_processing_history IS 'Image processing history for rate limiting and analytics';

-- =====================================
-- Sample data (uncomment to test)
-- =====================================
-- INSERT INTO public.wmc_users (email, name, tier, creditsUsed) VALUES
-- ('test@example.com', 'Test User', 'verified', 5);

-- Verify setup
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'watermarkcleaner' ORDER BY table_name;

-- Expected output:
--  accounts
--  processing_history
--  sessions
--  users
--  verification_tokens
