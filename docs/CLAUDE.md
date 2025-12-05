# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Analysis and Docker
- `npm run analyze` - Bundle analysis with webpack-bundle-analyzer
- `npm run docker:build` - Build Docker image

## Tech Stack & Architecture

### Core Technologies
- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS** with Shadcn UI components
- **Supabase Client** with PostgreSQL database
- **NextAuth.js** for authentication (Google, GitHub, One-tap)
- **next-intl** for internationalization (en/zh locales)
- **Stripe** for payment processing

### Key Architecture Patterns

#### Multi-language Support
- Locale-based routing with `src/app/[locale]/` structure
- Page-specific translations in `src/i18n/pages/`
- Global messages in `src/i18n/messages/`

#### Authentication Flow
- NextAuth.js configuration in `src/auth/config.ts`
- Support for multiple providers (Google, GitHub, One-tap)
- Custom JWT and session handling with user persistence

#### Database Layer
- Supabase Client with PostgreSQL (11 tables: users, orders, credits, apikeys, posts, affiliates, feedbacks, conversions, user_preferences, chat_sessions, flashcards)
- TypeScript types generated in `src/types/database.types.ts`
- Supabase client configuration in `src/lib/supabase.ts`
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Key business logic: credit system, affiliate program (20% commission), API key management
- Database schema managed through Supabase Dashboard or SQL migrations

#### API Structure
- Route handlers in `src/app/api/`
- Text-to-image generation with FAL API (`src/app/api/text2image/route.ts`)
- Stripe payment integration
- Database operations for users, orders, credits

#### AI SDK Integration
- Custom AI SDK providers in `src/aisdk/` with modular provider pattern
- Kling provider: complete implementation with JWT authentication
- Video generation: text-to-video with async polling (30-second intervals)
- Image generation: FAL API with Flux Pro model, 5-minute timeout with 60 attempts
- Extensible provider system with TypeScript interfaces

#### Route Group Architecture
- `(admin)` - Admin dashboard with user/order/content management, requires admin email whitelist
- `(default)` - Public and authenticated pages with header/footer layout
  - `(console)` - Nested user dashboard for credits, orders, API keys, requires authentication
- `(legal)` - Legal pages (privacy, terms) with MDX content, no locale routing
- Middleware handles 2 locales (en/zh) with "as-needed" prefix strategy

### Component Organization
- **blocks/**: Landing page sections (hero, features, pricing, etc.)
- **ui/**: Reusable Shadcn UI components
- **dashboard/**: Admin dashboard components
- **console/**: User console components

### Business Logic
- **models/**: Data models and database operations
- **services/**: Business logic layer
- **types/**: TypeScript definitions organized by feature

## Environment Setup

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `AUTH_SECRET` - NextAuth.js secret
- `FAL_KEY` - For text-to-image and image-to-image API (not in .env.example but required)
- `KLING_ACCESS_KEY` / `KLING_SECRET_KEY` - For Kling video generation provider (not in .env.example but required)
- `STRIPE_*` - Payment processing keys (PUBLIC_KEY, PRIVATE_KEY, WEBHOOK_SECRET)
- `AUTH_GOOGLE_*` / `AUTH_GITHUB_*` - OAuth provider credentials
- `STORAGE_*` - AWS S3 compatible storage configuration
- `NEXT_PUBLIC_*` - Analytics (Google Analytics, OpenPanel, Plausible) and app configuration
- `ADMIN_EMAILS` - Comma-separated list of admin email addresses

## Development Workflow

1. Copy `.env.example` to `.env.development`
2. Configure Supabase project URL and anon key
3. Configure other external service credentials
4. Use `npm run dev` for development with hot reload
5. Test payment flows require Stripe webhook configuration

## Special Features

### AI Generation Features
- **Text-to-Image**: Integrated with FAL API (Flux Pro model)
- **Image-to-Image**: Enhancement and transformation capabilities
- **Video Generation**: Kling provider for text-to-video generation
- Async task processing with polling for all generation types
- Located in `src/app/api/text2image/route.ts` and `src/aisdk/`

### Admin Dashboard
- User management, order tracking, feedback system
- Located in `src/app/[locale]/(admin)/`

### Internationalization
- 2 supported locales: en, zh (configured for 9 locales in middleware but only 2 implemented)
- Dynamic locale detection with "as-needed" prefix strategy
- SEO-friendly alternate language links
- Separate translation files for different page sections
- Middleware excludes API routes, static files, and legal pages from locale handling

## Testing

Currently no testing framework is configured. To add testing:
- Consider Jest or Vitest for unit testing
- Consider Playwright or Cypress for E2E testing
- Add test scripts to package.json

## Coding Standards

From `.cursorrules`:
- Use functional React components in CamelCase
- Prefer React Context for state management
- Use sonner for toast notifications
- Maintain consistent internationalization structure
- Keep components modular and reusable
- Follow responsive design with Tailwind CSS and Shadcn UI