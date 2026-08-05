# EarnStream — Vercel Deployment Guide

## Prerequisites
- A [Vercel](https://vercel.com) account (free tier works)
- Your Supabase project (`https://rayhnuzdewzhtrwahzas.supabase.co`)
- The clean-slate SQL migration already applied to your Supabase database

## Step 1: Download the codebase ZIP

In the Z.ai Code interface, click the **Download** button (or use the file browser to select all project files and download as ZIP). The project root contains everything you need.

## Step 2: Create a new Vercel project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Browse all templates"** → or just drag-and-drop the unzipped folder
3. **OR** push the code to a GitHub repo and import it into Vercel

## Step 3: Configure Environment Variables

In your Vercel project settings → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rayhnuzdewzhtrwahzas.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_PgCe5mWQE2srbUnv-UcDpw_gHOcULV3` |

> **Note:** The app has hardcoded fallbacks for these, so it will work even without setting them. But setting them explicitly is best practice.

## Step 4: Deploy

Vercel auto-detects Next.js. The `vercel.json` + `next.config.ts` are pre-configured. Just click **Deploy**.

### Build settings (auto-detected):
- **Framework**: Next.js
- **Build command**: `next build`
- **Output directory**: `.next` (auto)
- **Install command**: `bun install` (or `npm install`)

## Step 5: Verify

Once deployed, visit your Vercel URL. You should see the EarnStream landing page.

**Master admin login:**
- Email: `adminasadullah@ceo.com`
- Password: `asadullahceo786@#$`

## Configuration files included

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel framework config (Next.js, bun install) |
| `next.config.ts` | Next.js config (no standalone, strict types) |
| `.env.example` | Documents required env vars |
| `.vercelignore` | Excludes dev-only files from deployment |

## Troubleshooting

**Build fails with "module not found"**: Run `bun install` locally first to verify dependencies, then push to Vercel.

**Settings API returns 500**: Ensure the clean-slate SQL migration has been run in your Supabase SQL Editor, then run `NOTIFY pgrst, 'reload schema';`

**Images don't load**: The `next.config.ts` has `remotePatterns` configured for Unsplash and Supabase. Add other domains if needed.

## Local development

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.
