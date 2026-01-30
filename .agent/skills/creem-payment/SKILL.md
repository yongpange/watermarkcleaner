---
name: Creem Payment Integration
description: Automated setup of Creem payment gateway for Next.js (Edge Runtime compatible)
---

# Creem Payment Integration Skill

This skill automates the setup of Creem Payment Gateway in a Next.js App Router application. It handles environment configuration, database schema, and API route generation with strict Edge Runtime compatibility.

## Prerequisites
- Next.js 14+ (App Router)
- Supabase (or Postgres)
- Tailwind CSS

## Instructions

### Step 1: Environment Configuration
1. Check if `.env.local` exists.
2. Check if `CREEM_API_KEY` and `CREEM_SIGNING_SECRET` are present.
3. If not, append the content from `templates/env_example.txt` to `.env.local`.
4. **Action**: Prompt the user to fill in the actual keys before proceeding.

### Step 2: Database Setup
1. Read `templates/schema.sql`.
2. **Action**: Ask the user if they want to execute this SQL against their Supabase instance to create the necessary tables (`wmc_order`, `wmc_credit`).
3. If confirmed, use the `run_command` (if Supabase CLI is available) or instruct the user to run it in the Supabase Dashboard SQL Editor.

### Step 3: Backend API Routes
1. Create directory `src/app/api/payment/checkout`.
2. Copy `templates/route_checkout.ts` to `src/app/api/payment/checkout/route.ts`.
3. Create directory `src/app/api/payment/notify/creem`.
4. Copy `templates/route_webhook.ts` to `src/app/api/payment/notify/creem/route.ts`.
5. **Critical**: Ensure `export const runtime = 'edge'` is present in both files (included in templates).

### Step 4: Frontend Pages
1. Create directory `src/app/payment/success`.
2. Copy `templates/page_success.tsx` to `src/app/payment/success/page.tsx`.
3. Create directory `src/app/payment/cancel`.
4. Copy `templates/page_cancel.tsx` to `src/app/payment/cancel/page.tsx`.

### Step 5: Final Verification
1. Verify `lucide-react` is installed for icons.
2. Verify `next.config.mjs` allows `api.creem.io` if using images (optional).
3. **Action**: Notify user that setup is complete and they should test with the `/api/payment/checkout` endpoint.
