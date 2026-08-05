-- =====================================================================
-- EarnStream — Master Configuration Portal migration (incremental)
-- Run after 0002_joining_fee_verification.sql. Idempotent.
-- =====================================================================

-- ---------- new platform_settings columns ----------
alter table public.platform_settings
  add column if not exists minimum_payout numeric(12,2) not null default 50;

alter table public.platform_settings
  add column if not exists easypaisa_account_name text not null default '';

alter table public.platform_settings
  add column if not exists jazzcash_account_name text not null default '';

alter table public.platform_settings
  add column if not exists nav_logo_text text not null default 'EarnStream';

alter table public.platform_settings
  add column if not exists support_email text not null default '';

alter table public.platform_settings
  add column if not exists footer_notice text not null default '';

alter table public.platform_settings
  add column if not exists currency_symbol text not null default 'Rs';

-- backfill the single settings row from defaults if empty
update public.platform_settings
   set easypaisa_account_name = 'EarnStream Official'
 where easypaisa_account_name = '';
update public.platform_settings
   set jazzcash_account_name = 'EarnStream Official'
 where jazzcash_account_name = '';
update public.platform_settings
   set support_email = 'support@earnstream.io'
 where support_email = '';
update public.platform_settings
   set footer_notice = '© EarnStream. All rights reserved.'
 where footer_notice = '';

-- ---------- new users columns ----------
alter table public.users
  add column if not exists total_earned numeric(12,2) not null default 0;

alter table public.users
  add column if not exists custom_referral_bonus_percent numeric(5,2);
-- (nullable; null = use global platform_settings.referral_bonus_percent)
