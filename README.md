# EarnStream — Production Deployment Guide

## Quick Start

### 1. Download & Unzip
Download `earnstream-final.zip` and extract it locally.

### 2. Install Dependencies
```bash
bun install
# or
npm install
```

### 3. Environment Variables
Create a `.env` file (or set these in Vercel):
```
NEXT_PUBLIC_SUPABASE_URL=https://rayhnuzdewzhtrwahzas.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_PgCe5mWQE2srbUnv-UcDpw_gHOcULV3
```

### 4. Run Database Migrations
In your Supabase SQL Editor, run these files **in order**:
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_joining_fee_verification.sql`
3. `supabase/migrations/0003_master_config.sql`
4. `supabase/migrations/0004_enterprise.sql`
5. `supabase/migrations/0005_phase6_cms.sql`

Then run: `NOTIFY pgrst, 'reload schema';`

### 5. Deploy to Vercel
1. Push the code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel Settings
4. Click **Deploy**

### 6. Admin Login
- Email: `adminasadullah@ceo.com`
- Password: `asadullahceo786@#$`

---

## Architecture

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (8 buckets)
- **Auth**: Custom session-token auth (scrypt-hashed passwords)

## Project Structure

```
src/
├── app/
│   ├── api/          (41 API route files, 44 endpoints)
│   ├── globals.css   (Premium dark theme)
│   ├── layout.tsx    (Root layout)
│   └── page.tsx      (SPA shell)
├── components/
│   ├── admin/        (22 section files)
│   ├── auth/         (Landing + payment required)
│   ├── premium/      (Glass UI design system)
│   ├── shared/       (Topbar + page shell)
│   └── user/         (7 section files)
├── lib/
│   ├── api.ts        (Auth helpers + error handling)
│   ├── auth.ts       (Session management)
│   ├── client.ts     (Client-side helpers)
│   ├── currency.tsx  (Currency context)
│   ├── data.ts       (Store singleton)
│   ├── password.ts   (Scrypt hashing)
│   ├── store.ts      (Store interface)
│   ├── supabase/     (Supabase store implementation)
│   └── types.ts      (All TypeScript types)
└── middleware.ts     (Security headers + rate limiting)

supabase/migrations/  (5 SQL migration files)
```

## Database (21 tables)
users, sessions, platform_settings, gmail_tasks, tiktok_likes, video_promotions, payments, referrals, notifications, task_attempts, tasks, task_submissions, gmail_submissions, gmail_campaigns, audit_logs, announcements, wallet_ledger, login_sessions, blocked_ips, notification_queue, cms_content

## Admin Panel (22 modules)
Dashboard, Users, TikTok Tasks, Task Verification, Gmail Selling, Gmail Campaigns, Wallet, Withdrawals, Joining Fees, Subscriptions, Referral System, Announcements, Notifications, Reports, Analytics, Audit Logs, Storage Manager, CMS, SEO, Website Settings, Security, System Health, Admin Profile

## User Panel (7 modules)
Overview, Legacy Tasks, TikTok Tasks, Gmail Selling, Wallet, Referrals, Withdraw

## Security Features
- Content Security Policy (CSP) headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Rate limiting (login, signup, withdraw, tasks, gmail)
- Brute-force login protection (5 attempts → 15-min lock)
- Input sanitization (XSS prevention)
- Scrypt password hashing
- httpOnly + sameSite session cookies
- Structured error responses with error codes
- requireActiveUser() for joining fee + subscription verification

## Build Verification
```
Lint:     0 errors, 0 warnings
TypeScript: 0 errors
Build:    ✓ 44/44 routes compiled successfully
```
