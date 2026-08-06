-- =====================================================================
-- EarnStream — Phase 6 CMS Extension Migration (0005)
-- Non-destructive: only ADDS columns. Run after 0004_enterprise.sql.
-- =====================================================================

-- ========== EXTEND platform_settings with full CMS control fields ==========
alter table public.platform_settings add column if not exists custom_head_code text not null default '';
alter table public.platform_settings add column if not exists custom_footer_code text not null default '';
alter table public.platform_settings add column if not exists popup_enabled boolean not null default false;
alter table public.platform_settings add column if not exists popup_message text not null default '';
alter table public.platform_settings add column if not exists popup_title text not null default '';
alter table public.platform_settings add column if not exists announcement_bar text not null default '';
alter table public.platform_settings add column if not exists announcement_bar_enabled boolean not null default false;
alter table public.platform_settings add column if not exists maintenance_message text not null default 'We are performing maintenance. Please check back soon.';
alter table public.platform_settings add column if not exists facebook_pixel text not null default '';
alter table public.platform_settings add column if not exists microsoft_clarity text not null default '';
alter table public.platform_settings add column if not exists social_telegram text not null default '';
alter table public.platform_settings add column if not exists social_discord text not null default '';
alter table public.platform_settings add column if not exists hero_title text not null default 'Turn spare minutes into real earnings.';
alter table public.platform_settings add column if not exists hero_subtitle text not null default 'Complete TikTok tasks and withdraw instantly to EasyPaisa, JazzCash, or Binance.';
alter table public.platform_settings add column if not exists hero_image text not null default '';
alter table public.platform_settings add column if not exists meta_image text not null default '';
alter table public.platform_settings add column if not exists og_title text not null default '';
alter table public.platform_settings add column if not exists og_description text not null default '';
alter table public.platform_settings add column if not exists twitter_title text not null default '';
alter table public.platform_settings add column if not exists twitter_description text not null default '';

-- ========== EXTEND gmail_submissions with weekly/monthly limits support ==========
-- (columns already exist from 0004, this just ensures limits are in platform_settings)
alter table public.platform_settings add column if not exists gmail_weekly_limit_per_user integer not null default 0;
alter table public.platform_settings add column if not exists gmail_monthly_limit_per_user integer not null default 0;
alter table public.platform_settings add column if not exists gmail_min_age_days integer not null default 0;
alter table public.platform_settings add column if not exists gmail_recovery_email_required boolean not null default false;
alter table public.platform_settings add column if not exists gmail_recovery_phone_required boolean not null default false;
alter table public.platform_settings add column if not exists gmail_country_restriction text not null default '';
alter table public.platform_settings add column if not exists gmail_auto_reject boolean not null default false;

-- ========== EXTEND withdrawal settings ==========
alter table public.platform_settings add column if not exists withdrawal_max_amount numeric(12,2) not null default 50000;
alter table public.platform_settings add column if not exists withdrawal_weekly_limit numeric(12,2) not null default 0;
alter table public.platform_settings add column if not exists withdrawal_monthly_limit numeric(12,2) not null default 0;
alter table public.platform_settings add column if not exists withdrawal_auto_approve boolean not null default false;
alter table public.platform_settings add column if not exists withdrawal_processing_hours integer not null default 24;
alter table public.platform_settings add column if not exists withdrawal_maintenance boolean not null default false;

-- ========== EXTEND referral system ==========
alter table public.platform_settings add column if not exists referral_banner text not null default '';
alter table public.platform_settings add column if not exists referral_message text not null default 'Join EarnStream and start earning today!';
alter table public.platform_settings add column if not exists referral_expiry_days integer not null default 0;

-- ========== EXTEND task settings ==========
alter table public.platform_settings add column if not exists task_screenshot_required boolean not null default true;
alter table public.platform_settings add column if not exists task_min_account_age_days integer not null default 0;
alter table public.platform_settings add column if not exists task_min_followers integer not null default 0;
alter table public.platform_settings add column if not exists task_min_likes integer not null default 0;
alter table public.platform_settings add column if not exists task_allow_resubmission boolean not null default false;
alter table public.platform_settings add column if not exists task_auto_reject boolean not null default false;

-- ========== Seed additional CMS content pages ==========
insert into public.cms_content (key, title, body, type) values
  ('homepage_hero', 'Homepage Hero', 'Turn spare minutes into real earnings. Complete TikTok tasks and withdraw instantly.', 'section'),
  ('homepage_sections', 'Homepage Sections', 'Features and benefits displayed on the landing page.', 'section'),
  ('popup', 'Popup Message', 'Special announcement shown to users on login.', 'snippet')
on conflict (key) do nothing;

NOTIFY pgrst, 'reload schema';
