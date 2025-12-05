-- Migration: Remove affiliate system
-- This migration removes the affiliates table and related fields from users table

BEGIN;

-- Drop the affiliates table if it exists
DROP TABLE IF EXISTS "affiliates" CASCADE;

-- Remove affiliate-related columns from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "invite_code";
ALTER TABLE "users" DROP COLUMN IF EXISTS "invited_by";
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_affiliate";

COMMIT;

-- Note: After running this migration, you should also:
-- 1. Remove RLS policies related to affiliates table if any
-- 2. Update your application code to remove affiliate functionality
