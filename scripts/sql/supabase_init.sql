-- Supabase initialization SQL for ai-turbolearn-template
-- This script creates all required tables, constraints, and indexes.
-- Run this once in Supabase SQL Editor (Database > SQL > New query) against your project's database.

BEGIN;

-- 1) affiliates
CREATE TABLE IF NOT EXISTS "affiliates" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "affiliates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "user_uuid" varchar(255) NOT NULL,
    "created_at" timestamp with time zone,
    "status" varchar(50) DEFAULT '' NOT NULL,
    "invited_by" varchar(255) NOT NULL,
    "paid_order_no" varchar(255) DEFAULT '' NOT NULL,
    "paid_amount" integer DEFAULT 0 NOT NULL,
    "reward_percent" integer DEFAULT 0 NOT NULL,
    "reward_amount" integer DEFAULT 0 NOT NULL
);

-- 2) apikeys
CREATE TABLE IF NOT EXISTS "apikeys" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "apikeys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "api_key" varchar(255) NOT NULL,
    "title" varchar(100),
    "user_uuid" varchar(255) NOT NULL,
    "created_at" timestamp with time zone,
    "status" varchar(50),
    CONSTRAINT "apikeys_api_key_unique" UNIQUE("api_key")
);

-- 3) credits
CREATE TABLE IF NOT EXISTS "credits" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "credits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "trans_no" varchar(255) NOT NULL,
    "created_at" timestamp with time zone,
    "user_uuid" varchar(255) NOT NULL,
    "trans_type" varchar(50) NOT NULL,
    "credits" integer NOT NULL,
    "order_no" varchar(255),
    "expired_at" timestamp with time zone,
    CONSTRAINT "credits_trans_no_unique" UNIQUE("trans_no")
);

-- 4) feedbacks
CREATE TABLE IF NOT EXISTS "feedbacks" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feedbacks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "created_at" timestamp with time zone,
    "status" varchar(50),
    "user_uuid" varchar(255),
    "content" text,
    "rating" integer
);

-- 5) orders
CREATE TABLE IF NOT EXISTS "orders" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "order_no" varchar(255) NOT NULL,
    "created_at" timestamp with time zone,
    "user_uuid" varchar(255) DEFAULT '' NOT NULL,
    "user_email" varchar(255) DEFAULT '' NOT NULL,
    "amount" integer NOT NULL,
    "interval" varchar(50),
    "expired_at" timestamp with time zone,
    "status" varchar(50) NOT NULL,
    "stripe_session_id" varchar(255),
    "credits" integer NOT NULL,
    "currency" varchar(50),
    "sub_id" varchar(255),
    "sub_interval_count" integer,
    "sub_cycle_anchor" integer,
    "sub_period_end" integer,
    "sub_period_start" integer,
    "sub_times" integer,
    "product_id" varchar(255),
    "product_name" varchar(255),
    "valid_months" integer,
    "order_detail" text,
    "paid_at" timestamp with time zone,
    "paid_email" varchar(255),
    "paid_detail" text,
    CONSTRAINT "orders_order_no_unique" UNIQUE("order_no")
);

-- 6) posts
CREATE TABLE IF NOT EXISTS "posts" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "uuid" varchar(255) NOT NULL,
    "slug" varchar(255),
    "title" varchar(255),
    "description" text,
    "content" text,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "status" varchar(50),
    "cover_url" varchar(255),
    "author_name" varchar(255),
    "author_avatar_url" varchar(255),
    "locale" varchar(50),
    CONSTRAINT "posts_uuid_unique" UNIQUE("uuid")
);

-- 7) users
CREATE TABLE IF NOT EXISTS "users" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "uuid" varchar(255) NOT NULL,
    "email" varchar(255) NOT NULL,
    "created_at" timestamp with time zone,
    "nickname" varchar(255),
    "avatar_url" varchar(255),
    "locale" varchar(50),
    "signin_type" varchar(50),
    "signin_ip" varchar(255),
    "signin_provider" varchar(50),
    "signin_openid" varchar(255),
    "invite_code" varchar(255) DEFAULT '' NOT NULL,
    "updated_at" timestamp with time zone,
    "invited_by" varchar(255) DEFAULT '' NOT NULL,
    "is_affiliate" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_uuid_unique" UNIQUE("uuid")
);

-- index for users
CREATE UNIQUE INDEX IF NOT EXISTS "email_provider_unique_idx" ON "users" USING btree ("email","signin_provider");

-- 8) conversions
CREATE TABLE IF NOT EXISTS "conversions" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "conversions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "uuid" varchar(255) NOT NULL,
    "user_uuid" varchar(255),
    "file_id" varchar(255) NOT NULL,
    "file_name" varchar(500) NOT NULL,
    "file_size" bigint NOT NULL,
    "file_type" varchar(100) NOT NULL,
    "file_url" text,
    "status" varchar(50) DEFAULT 'pending' NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "result" jsonb,
    "error" jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    CONSTRAINT "conversions_uuid_unique" UNIQUE("uuid")
);

-- indexes for conversions
CREATE INDEX IF NOT EXISTS "conversions_user_uuid_idx" ON "conversions" USING btree ("user_uuid");
CREATE INDEX IF NOT EXISTS "conversions_status_idx" ON "conversions" USING btree ("status");
CREATE INDEX IF NOT EXISTS "conversions_created_at_idx" ON "conversions" USING btree ("created_at");

-- 9) user_preferences
CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_preferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "user_uuid" varchar(255) NOT NULL,
    "locale" varchar(10) DEFAULT 'en' NOT NULL,
    "theme" varchar(20) DEFAULT 'light' NOT NULL,
    "auto_detect_language" boolean DEFAULT true NOT NULL,
    "default_export_format" varchar(20) DEFAULT 'md' NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "user_preferences_user_uuid_unique" UNIQUE("user_uuid")
);

COMMIT;

