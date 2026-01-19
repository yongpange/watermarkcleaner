-- NextAuth.js Supabase Adapter Schema
-- This creates the necessary tables for @auth/supabase-adapter

-- Create profiles schema for NextAuth internal tables
CREATE SCHEMA IF NOT EXISTS profiles;

-- Users table (managed by NextAuth)
CREATE TABLE profiles.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table for OAuth providers
CREATE TABLE profiles.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Sessions table
CREATE TABLE profiles.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles.users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification tokens
CREATE TABLE profiles.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (identifier, token)
);

-- Indexes for performance
CREATE INDEX idx_accounts_user_id ON profiles.accounts(user_id);
CREATE INDEX idx_sessions_user_id ON profiles.sessions(user_id);
CREATE INDEX idx_verification_tokens_identifier ON profiles.verification_tokens(identifier);
CREATE INDEX idx_verification_tokens_token ON profiles.verification_tokens(token);

-- Function to automatically sync users to wmc_users table
CREATE OR REPLACE FUNCTION sync_user_to_app_table()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user in wmc_users table
  INSERT INTO public.wmc_users (
    id,
    email,
    name,
    image,
    tier,
    creditsused,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.name,
    NEW.image,
    'verified', -- Google users are automatically verified
    0,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    image = EXCLUDED.image,
    tier = 'verified',
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync users after insert
CREATE TRIGGER trigger_sync_user_after_insert
  AFTER INSERT ON profiles.users
  FOR EACH ROW
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION sync_user_to_app_table();

-- Trigger to sync users after update
CREATE TRIGGER trigger_sync_user_after_update
  AFTER UPDATE ON profiles.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email OR
        NEW.name IS DISTINCT FROM OLD.name OR
        NEW.image IS DISTINCT FROM OLD.image)
  EXECUTE FUNCTION sync_user_to_app_table();
