-- =====================================
-- WatermarkCleaner Schema Setup
-- Description: Create isolated schema for watermarkcleaner project
-- =====================================

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS watermarkcleaner;

-- =====================================
-- Table: users
-- Description: User accounts (used by NextAuth.js)
-- =====================================
CREATE TABLE IF NOT EXISTS watermarkcleaner.users (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON watermarkcleaner.users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON watermarkcleaner.users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_tier ON watermarkcleaner.users(tier);

-- =====================================
-- Table: accounts
-- Description: OAuth accounts (required by NextAuth.js)
-- =====================================
CREATE TABLE IF NOT EXISTS watermarkcleaner.accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL REFERENCES watermarkcleaner.users(id) ON DELETE CASCADE,
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider_account ON watermarkcleaner.accounts(provider, providerAccountId);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON watermarkcleaner.accounts(userId);

-- =====================================
-- Table: sessions
-- Description: User sessions (required by NextAuth.js)
-- =====================================
CREATE TABLE IF NOT EXISTS watermarkcleaner.sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL REFERENCES watermarkcleaner.users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user ON watermarkcleaner.sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON watermarkcleaner.sessions(sessionToken);

-- =====================================
-- Table: verification_tokens
-- Description: Email verification tokens (required by NextAuth.js)
-- =====================================
CREATE TABLE IF NOT EXISTS watermarkcleaner.verification_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for verification_tokens table
CREATE INDEX IF NOT EXISTS idx_verification_identifiers ON watermarkcleaner.verification_tokens(identifier);
CREATE INDEX IF NOT EXISTS idx_verification_token ON watermarkcleaner.verification_tokens(token);

-- =====================================
-- Table: processing_history
-- Description: Image processing history
-- =====================================
CREATE TABLE IF NOT EXISTS watermarkcleaner.processing_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES watermarkcleaner.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  image_size INTEGER,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for processing_history table
CREATE INDEX IF NOT EXISTS idx_processing_user ON watermarkcleaner.processing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_ip ON watermarkcleaner.processing_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_processing_created ON watermarkcleaner.processing_history(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_user_created ON watermarkcleaner.processing_history(user_id, created_at);

-- =====================================
-- Enable Row Level Security (important for security)
-- =====================================
ALTER TABLE watermarkcleaner.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watermarkcleaner.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE watermarkcleaner.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watermarkcleaner.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE watermarkcleaner.processing_history ENABLE ROW LEVEL SECURITY;

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
COMMENT ON TABLE watermarkcleaner.users IS 'User accounts with tier and credit management';
COMMENT ON TABLE watermarkcleaner.accounts IS 'OAuth accounts (NextAuth.js)';
COMMENT ON TABLE watermarkcleaner.sessions IS 'User sessions (NextAuth.js)';
COMMENT ON TABLE watermarkcleaner.verification_tokens IS 'Email verification tokens (NextAuth.js)';
COMMENT ON TABLE watermarkcleaner.processing_history IS 'Image processing history for rate limiting and analytics';

-- =====================================
-- Sample data (uncomment to test)
-- =====================================
-- INSERT INTO watermarkcleaner.users (email, name, tier, creditsUsed) VALUES
-- ('test@example.com', 'Test User', 'verified', 5);

-- Verify setup
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'watermarkcleaner' ORDER BY table_name;

-- Expected output:
--  accounts
--  processing_history
--  sessions
--  users
--  verification_tokens
