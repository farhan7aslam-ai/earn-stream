-- =====================================================================
-- EarnStream — Enterprise Combined Migration (0004_enterprise)
-- Merges all enterprise tables/columns into ONE migration.
-- Non-destructive: only ADDS tables/columns. Run after clean_slate.sql.
-- =====================================================================

-- ========== EXTEND platform_settings with ALL enterprise CMS fields ==========
alter table public.platform_settings add column if not exists maintenance_mode boolean not null default false;
alter table public.platform_settings add column if not exists registration_open boolean not null default true;
alter table public.platform_settings add column if not exists max_tasks_per_user_per_day integer not null default 10;
alter table public.platform_settings add column if not exists task_review_auto_approve boolean not null default false;
alter table public.platform_settings add column if not exists gmail_default_password text not null default 'aass1122';
alter table public.platform_settings add column if not exists gmail_reward numeric(12,2) not null default 5;
alter table public.platform_settings add column if not exists gmail_module_enabled boolean not null default true;
alter table public.platform_settings add column if not exists gmail_submission_enabled boolean not null default true;
alter table public.platform_settings add column if not exists gmail_screenshot_required boolean not null default false;
alter table public.platform_settings add column if not exists gmail_auto_approve boolean not null default false;
alter table public.platform_settings add column if not exists gmail_daily_limit_per_user integer not null default 0;
alter table public.platform_settings add column if not exists binance_trc20_address text not null default '';
alter table public.platform_settings add column if not exists logo_url text not null default '';
alter table public.platform_settings add column if not exists favicon_url text not null default '';
alter table public.platform_settings add column if not exists social_tiktok text not null default '';
alter table public.platform_settings add column if not exists social_instagram text not null default '';
alter table public.platform_settings add column if not exists social_youtube text not null default '';
alter table public.platform_settings add column if not exists social_facebook text not null default '';
alter table public.platform_settings add column if not exists announcement_active text;
alter table public.platform_settings add column if not exists max_withdrawal_per_day numeric(12,2) not null default 5000;
alter table public.platform_settings add column if not exists theme_primary text not null default '#8b5cf6';
alter table public.platform_settings add column if not exists theme_accent text not null default '#d946ef';
alter table public.platform_settings add column if not exists support_whatsapp text not null default '';
alter table public.platform_settings add column if not exists seo_title text not null default '';
alter table public.platform_settings add column if not exists seo_description text not null default '';
alter table public.platform_settings add column if not exists seo_keywords text not null default '';
alter table public.platform_settings add column if not exists timezone text not null default 'America/Los_Angeles';
alter table public.platform_settings add column if not exists language text not null default 'en';
alter table public.platform_settings add column if not exists referral_type text not null default 'percentage' check (referral_type in ('fixed','percentage'));
alter table public.platform_settings add column if not exists referral_fixed_amount numeric(12,2) not null default 50;
alter table public.platform_settings add column if not exists referral_lifetime boolean not null default false;
alter table public.platform_settings add column if not exists referral_max integer not null default 0;
alter table public.platform_settings add column if not exists referral_min_withdrawal numeric(12,2) not null default 0;
alter table public.platform_settings add column if not exists withdrawal_fee_percent numeric(5,2) not null default 0;
alter table public.platform_settings add column if not exists withdrawal_fee_fixed numeric(12,2) not null default 0;
alter table public.platform_settings add column if not exists password_min_length integer not null default 6;
alter table public.platform_settings add column if not exists captcha_enabled boolean not null default false;
alter table public.platform_settings add column if not exists rate_limit_per_minute integer not null default 60;
alter table public.platform_settings add column if not exists seo_canonical text not null default '';
alter table public.platform_settings add column if not exists seo_robots text not null default 'index, follow';
alter table public.platform_settings add column if not exists seo_og_image text not null default '';
alter table public.platform_settings add column if not exists seo_twitter_card text not null default 'summary_large_image';
alter table public.platform_settings add column if not exists google_analytics_id text not null default '';
alter table public.platform_settings add column if not exists google_verification text not null default '';

-- ========== EXTEND users with profile columns ==========
alter table public.users add column if not exists total_earned numeric(12,2) not null default 0;
alter table public.users add column if not exists custom_referral_bonus_percent numeric(5,2);
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists country text;
alter table public.users add column if not exists timezone text not null default 'America/Los_Angeles';
alter table public.users add column if not exists language text not null default 'en';
alter table public.users add column if not exists last_login_at timestamptz;
alter table public.users add column if not exists last_ip text;
alter table public.users add column if not exists last_device text;

-- ========== EXTEND payments with fee columns ==========
alter table public.payments add column if not exists fee numeric(12,2) not null default 0;
alter table public.payments add column if not exists net_amount numeric(12,2);
alter table public.payments add column if not exists approved_by uuid references public.users(id) on delete set null;
alter table public.payments add column if not exists rejected_by uuid references public.users(id) on delete set null;
alter table public.payments add column if not exists approved_at timestamptz;
alter table public.payments add column if not exists rejected_at timestamptz;
alter table public.payments add column if not exists admin_notes text;

-- ========== 1. tasks — TikTok micro-task definitions ==========
create table if not exists public.tasks (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text not null default '',
  platform          text not null default 'tiktok' check (platform in ('tiktok')),
  tiktok_username   text not null default '',
  tiktok_video_url  text not null default '',
  tiktok_video_id   text,
  task_type         text not null check (task_type in ('LIKE','FOLLOW','COMMENT','SHARE')),
  reward_per_user   numeric(12,2) not null default 0,
  max_participants  integer not null default 0,
  total_budget      numeric(12,2) not null default 0,
  completed_count   integer not null default 0,
  remaining_slots   integer not null default 0,
  expiry_date       timestamptz,
  priority          integer not null default 0,
  instructions      text not null default '',
  comment_text      text,
  status            text not null default 'active' check (status in ('draft','active','paused','closed','expired','cancelled','published','completed')),
  featured          boolean not null default false,
  pinned            boolean not null default false,
  visibility        text not null default 'public' check (visibility in ('public','private')),
  auto_close        boolean not null default true,
  remarks           text,
  created_by        uuid references public.users(id) on delete set null,
  updated_by        uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  deleted_by        uuid references public.users(id) on delete set null
);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_priority_idx on public.tasks(priority desc);

-- ========== 2. task_submissions ==========
create table if not exists public.task_submissions (
  id              uuid primary key default gen_random_uuid(),
  task_id         uuid not null references public.tasks(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  screenshot_url  text not null default '',
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  reward          numeric(12,2) not null default 0,
  reject_reason   text,
  approval_notes  text,
  reviewed_by     uuid references public.users(id) on delete set null,
  reviewed_at     timestamptz,
  device          text,
  browser         text,
  ip_address      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (task_id, user_id)
);
create index if not exists task_sub_status_idx on public.task_submissions(status);
create index if not exists task_sub_user_idx on public.task_submissions(user_id);

-- ========== 3. gmail_submissions ==========
create table if not exists public.gmail_submissions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  campaign_id     uuid,
  gmail_address   text not null,
  gmail_password  text not null,
  recovery_email  text,
  recovery_phone  text,
  country         text,
  creation_date   date,
  status          text not null default 'pending' check (status in ('pending','approved','rejected','sold','cancelled')),
  reward          numeric(12,2) not null default 0,
  reject_reason   text,
  admin_notes     text,
  screenshot_url  text,
  reviewed_by     uuid references public.users(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  deleted_by      uuid references public.users(id) on delete set null,
  unique (gmail_address)
);
create index if not exists gmail_sub_status_idx on public.gmail_submissions(status);

-- ========== 4. gmail_campaigns ==========
create table if not exists public.gmail_campaigns (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text not null default '',
  reward          numeric(12,2) not null default 0,
  daily_limit     integer not null default 0,
  start_date      timestamptz,
  end_date        timestamptz,
  status          text not null default 'active' check (status in ('active','paused','closed','expired')),
  rules           text not null default '',
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ========== 5. audit_logs ==========
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references public.users(id) on delete set null,
  action      text not null,
  entity_type text not null default '',
  entity_id   text,
  old_value   jsonb,
  new_value   jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_admin_idx on public.audit_logs(admin_id);
create index if not exists audit_created_idx on public.audit_logs(created_at desc);

-- ========== 6. announcements ==========
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null default '',
  type        text not null default 'info' check (type in ('info','success','warning','error')),
  is_active   boolean not null default true,
  image_url   text,
  priority    integer not null default 0,
  publish_date timestamptz,
  expiry_date timestamptz,
  visible_to  text not null default 'all' check (visible_to in ('all','users','admins')),
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ========== 7. wallet_ledger ==========
create table if not exists public.wallet_ledger (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  credit            numeric(12,2) not null default 0,
  debit             numeric(12,2) not null default 0,
  opening_balance   numeric(12,2) not null default 0,
  closing_balance   numeric(12,2) not null default 0,
  reference_type    text not null default '',
  reference_id      text,
  description       text not null default '',
  admin_id          uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists wallet_ledger_user_idx on public.wallet_ledger(user_id);

-- ========== 8. login_sessions ==========
create table if not exists public.login_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  token       text not null,
  ip_address  text,
  device      text,
  browser     text,
  user_agent  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  revoked_at  timestamptz
);
create index if not exists login_sessions_user_idx on public.login_sessions(user_id);

-- ========== 9. blocked_ips ==========
create table if not exists public.blocked_ips (
  id          uuid primary key default gen_random_uuid(),
  ip_address  text not null unique,
  reason      text not null default '',
  blocked_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ========== 10. notification_queue ==========
create table if not exists public.notification_queue (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null default '',
  type         text not null default 'info' check (type in ('info','success','warning','error','payment','task','referral')),
  target_type  text not null default 'all' check (target_type in ('all','single','multiple','country','subscription','status')),
  target_data  jsonb,
  user_id      uuid references public.users(id) on delete cascade,
  sent_by      uuid references public.users(id) on delete set null,
  status       text not null default 'sent' check (status in ('queued','sent','failed')),
  scheduled_at timestamptz,
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- ========== 11. cms_content ==========
create table if not exists public.cms_content (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  title       text not null default '',
  body        text not null default '',
  type        text not null default 'page' check (type in ('page','section','snippet')),
  is_published boolean not null default true,
  updated_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
insert into public.cms_content (key, title, body, type) values
  ('about', 'About Us', 'EarnStream is a premium micro-task earning platform.', 'page'),
  ('privacy_policy', 'Privacy Policy', 'Your privacy is important to us.', 'page'),
  ('terms', 'Terms & Conditions', 'By using EarnStream, you agree to these terms.', 'page'),
  ('faq', 'FAQ', 'Common questions about EarnStream.', 'page'),
  ('contact', 'Contact Us', 'Reach out to our support team.', 'page'),
  ('hero_banner', 'Hero Banner', 'Turn spare minutes into real earnings.', 'section')
on conflict (key) do nothing;

-- ========== STORAGE BUCKETS ==========
insert into storage.buckets (id, name, public) values ('task-screenshots', 'task-screenshots', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('payment-screenshots', 'payment-screenshots', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('joining-fees', 'joining-fees', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('gmail-submissions', 'gmail-submissions', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('banners', 'banners', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', true) on conflict (id) do nothing;

-- ========== RLS ==========
alter table public.tasks disable row level security;
alter table public.task_submissions disable row level security;
alter table public.gmail_submissions disable row level security;
alter table public.gmail_campaigns disable row level security;
alter table public.audit_logs disable row level security;
alter table public.announcements disable row level security;
alter table public.wallet_ledger disable row level security;
alter table public.login_sessions disable row level security;
alter table public.blocked_ips disable row level security;
alter table public.notification_queue disable row level security;
alter table public.cms_content disable row level security;

-- ========== TRIGGER: auto-close task on budget exhaustion ==========
create or replace function public.fn_auto_close_task()
returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    update public.tasks set completed_count = completed_count + 1, remaining_slots = greatest(0, remaining_slots - 1), updated_at = now() where id = new.task_id;
    update public.tasks set status = 'closed', updated_at = now() where id = new.task_id and remaining_slots <= 0 and auto_close = true;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_task_sub_close on public.task_submissions;
create trigger trg_task_sub_close after update of status on public.task_submissions for each row execute function public.fn_auto_close_task();

-- ========== RPC: record_wallet_transaction ==========
create or replace function public.record_wallet_transaction(
  p_user_id uuid, p_credit numeric default 0, p_debit numeric default 0,
  p_reference_type text default '', p_reference_id text default null,
  p_description text default '', p_admin_id uuid default null
) returns public.wallet_ledger language plpgsql security definer as $$
declare v_opening numeric(12,2); v_closing numeric(12,2); v_row public.wallet_ledger;
begin
  select balance into v_opening from public.users where id = p_user_id for update;
  if v_opening is null then v_opening := 0; end if;
  v_closing := v_opening + p_credit - p_debit;
  update public.users set balance = v_closing where id = p_user_id;
  insert into public.wallet_ledger (user_id, credit, debit, opening_balance, closing_balance, reference_type, reference_id, description, admin_id)
  values (p_user_id, p_credit, p_debit, v_opening, v_closing, p_reference_type, p_reference_id, p_description, p_admin_id) returning * into v_row;
  return v_row;
end;
$$;

NOTIFY pgrst, 'reload schema';
