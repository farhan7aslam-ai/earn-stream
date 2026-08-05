-- =====================================================================
-- EarnStream — CLEAN SLATE schema (drops partial tables, recreates all)
-- Run this in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

-- ---------- drop existing partial tables (cascade handles FKs) ----------
drop table if exists public.task_attempts cascade;
drop table if exists public.notifications cascade;
drop table if exists public.referrals cascade;
drop table if exists public.payments cascade;
drop table if exists public.video_promotions cascade;
drop table if exists public.tiktok_likes cascade;
drop table if exists public.gmail_tasks cascade;
drop table if exists public.sessions cascade;
drop table if exists public.users cascade;
drop table if exists public.platform_settings cascade;

-- ---------- extensions ----------
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. users  (full schema, all columns)
-- =====================================================================
create table public.users (
  id                              uuid primary key default gen_random_uuid(),
  email                           text unique not null,
  password_hash                   text not null,
  full_name                       text not null default '',
  phone                           text not null default '',
  role                            text not null default 'user' check (role in ('user','admin')),
  balance                         numeric(12,2) not null default 0,
  pending_earnings                numeric(12,2) not null default 0,
  total_withdrawn                 numeric(12,2) not null default 0,
  total_earned                    numeric(12,2) not null default 0,
  joining_fee_paid                boolean not null default false,
  joining_fee_status              text not null default 'none' check (joining_fee_status in ('none','pending_approval','approved','rejected')),
  joining_fee_screenshot          text,
  joining_fee_submitted_at        timestamptz,
  is_banned                       boolean not null default false,
  is_suspended                    boolean not null default false,
  subscription_end_date           timestamptz,
  referral_code                   text unique not null,
  referred_by                     uuid references public.users(id) on delete set null,
  custom_referral_bonus_percent   numeric(5,2),
  created_at                      timestamptz not null default now()
);
create index users_joining_fee_status_idx on public.users(joining_fee_status);

-- =====================================================================
-- 2. sessions
-- =====================================================================
create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  token       text unique not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index sessions_token_idx on public.sessions(token);
create index sessions_user_idx on public.sessions(user_id);

-- =====================================================================
-- 3. platform_settings  (single row, id = 1, ALL columns)
-- =====================================================================
create table public.platform_settings (
  id                         integer primary key default 1,
  monthly_signup_limit       integer not null default 5,
  subscription_fee           numeric(12,2) not null default 500,
  subscription_duration_days integer not null default 30,
  joining_fee                numeric(12,2) not null default 100,
  gmail_task_rate            numeric(12,2) not null default 5,
  tiktok_like_rate           numeric(12,2) not null default 3,
  video_promotion_rate       numeric(12,2) not null default 10,
  referral_bonus_percent     numeric(5,2)  not null default 10,
  minimum_payout             numeric(12,2) not null default 50,
  easypaisa_number           text not null default '',
  easypaisa_account_name     text not null default '',
  jazzcash_number            text not null default '',
  jazzcash_account_name      text not null default '',
  binance_id                 text not null default '',
  site_name                  text not null default 'EarnStream',
  nav_logo_text              text not null default 'EarnStream',
  support_email              text not null default '',
  footer_notice              text not null default '',
  currency_symbol            text not null default 'Rs',
  updated_at                 timestamptz not null default now(),
  constraint singleton_settings check (id = 1)
);

-- bootstrap the single settings row with sensible defaults
insert into public.platform_settings (id, easypaisa_account_name, jazzcash_account_name, support_email, footer_notice)
values (1, 'EarnStream Official', 'EarnStream Official', 'support@earnstream.io', '© EarnStream. All rights reserved.');

-- =====================================================================
-- 4. task tables
-- =====================================================================
create table public.gmail_tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  task_url       text not null default '',
  screenshot_url text not null default '',
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  reward         numeric(12,2) not null default 0,
  note           text,
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz
);
create index gmail_tasks_user_idx on public.gmail_tasks(user_id);
create index gmail_tasks_status_idx on public.gmail_tasks(status);

create table public.tiktok_likes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  task_url       text not null default '',
  screenshot_url text not null default '',
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  reward         numeric(12,2) not null default 0,
  note           text,
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz
);
create index tiktok_likes_user_idx on public.tiktok_likes(user_id);
create index tiktok_likes_status_idx on public.tiktok_likes(status);

create table public.video_promotions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  task_url       text not null default '',
  screenshot_url text not null default '',
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  reward         numeric(12,2) not null default 0,
  note           text,
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz
);
create index video_promotions_user_idx on public.video_promotions(user_id);
create index video_promotions_status_idx on public.video_promotions(status);

-- =====================================================================
-- 5. payments
-- =====================================================================
create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  type          text not null check (type in ('withdrawal','subscription','joining_fee','task_reward','referral_bonus','admin_credit','admin_debit')),
  amount        numeric(12,2) not null,
  method        text not null default 'admin' check (method in ('easypaisa','jazzcash','binance','admin')),
  account       text not null default '',
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  note          text,
  balance_after numeric(12,2),
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);
create index payments_user_idx on public.payments(user_id);
create index payments_type_idx on public.payments(type);
create index payments_status_idx on public.payments(status);

-- =====================================================================
-- 6. referrals
-- =====================================================================
create table public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references public.users(id) on delete cascade,
  referred_id   uuid not null references public.users(id) on delete cascade,
  bonus_amount  numeric(12,2) not null default 0,
  status        text not null default 'pending' check (status in ('pending','credited')),
  created_at    timestamptz not null default now(),
  unique (referred_id)
);
create index referrals_referrer_idx on public.referrals(referrer_id);

-- =====================================================================
-- 7. notifications
-- =====================================================================
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  body        text not null default '',
  type        text not null default 'info' check (type in ('info','success','warning','error','payment','task','referral')),
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notif_user_idx on public.notifications(user_id);

-- =====================================================================
-- 8. task_attempts
-- =====================================================================
create table public.task_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  task_type     text not null check (task_type in ('gmail','tiktok','video')),
  task_url      text not null default '',
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  duration_ms   integer
);
create index attempts_user_idx on public.task_attempts(user_id);

-- =====================================================================
-- TRIGGERS  (automated wallet updates — idempotent)
-- =====================================================================
create or replace function public.fn_on_task_approved()
returns trigger as $$
declare
  v_reward numeric(12,2);
  v_new_bal numeric(12,2);
  v_referrer uuid;
  v_bonus numeric(12,2);
  v_ref_bal numeric(12,2);
  v_pct numeric(5,2);
begin
  if new.status <> 'approved' then return new; end if;
  if old.status = 'approved' then return new; end if;

  v_reward := new.reward;
  select balance into v_new_bal from public.users where id = new.user_id for update;
  v_new_bal := v_new_bal + v_reward;
  update public.users set balance = v_new_bal where id = new.user_id;

  insert into public.payments (user_id, type, amount, method, status, note, balance_after, processed_at)
  values (new.user_id, 'task_reward', v_reward, 'admin', 'approved',
          TG_TABLE_NAME || ' reward', v_new_bal, now());

  insert into public.notifications (user_id, title, body, type)
  values (new.user_id, 'Task Approved',
          'Your ' || TG_TABLE_NAME || ' submission was approved. +' || v_reward || ' added to your wallet.',
          'task');

  select referred_by into v_referrer from public.users where id = new.user_id;
  if v_referrer is not null then
    select referral_bonus_percent into v_pct from public.platform_settings where id = 1;
    v_bonus := round((v_reward * coalesce(v_pct,10) / 100)::numeric, 2);
    select balance into v_ref_bal from public.users where id = v_referrer for update;
    v_ref_bal := v_ref_bal + v_bonus;
    update public.users set balance = v_ref_bal where id = v_referrer;
    insert into public.payments (user_id, type, amount, method, status, note, balance_after, processed_at)
    values (v_referrer, 'referral_bonus', v_bonus, 'admin', 'approved',
            'Referral bonus for user ' || new.user_id, v_ref_bal, now());
    update public.referrals set bonus_amount = v_bonus, status = 'credited' where referred_id = new.user_id;
    insert into public.notifications (user_id, title, body, type)
    values (v_referrer, 'Referral Bonus',
            'You earned ' || v_bonus || ' from a referred user''s task.', 'referral');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_gmail_approved after update of status on public.gmail_tasks
  for each row execute function public.fn_on_task_approved();
create trigger trg_tiktok_approved after update of status on public.tiktok_likes
  for each row execute function public.fn_on_task_approved();
create trigger trg_video_approved after update of status on public.video_promotions
  for each row execute function public.fn_on_task_approved();

-- =====================================================================
-- ROW LEVEL SECURITY  (disabled — auth enforced in the API layer)
-- =====================================================================
alter table public.users              disable row level security;
alter table public.sessions           disable row level security;
alter table public.platform_settings  disable row level security;
alter table public.gmail_tasks        disable row level security;
alter table public.tiktok_likes       disable row level security;
alter table public.video_promotions   disable row level security;
alter table public.payments           disable row level security;
alter table public.referrals          disable row level security;
alter table public.notifications      disable row level security;
alter table public.task_attempts      disable row level security;

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================
insert into storage.buckets (id, name, public) values ('task-screenshots', 'task-screenshots', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('payment-screenshots', 'payment-screenshots', true) on conflict (id) do nothing;

drop policy if exists "payment-screenshots public read" on storage.objects;
create policy "payment-screenshots public read" on storage.objects for select using ( bucket_id = 'payment-screenshots' );
drop policy if exists "payment-screenshots anon upload" on storage.objects;
create policy "payment-screenshots anon upload" on storage.objects for insert with check ( bucket_id = 'payment-screenshots' );
drop policy if exists "payment-screenshots anon update" on storage.objects;
create policy "payment-screenshots anon update" on storage.objects for update using ( bucket_id = 'payment-screenshots' );

-- =====================================================================
-- MASTER ADMIN SEED
-- =====================================================================
insert into public.users (
  email, password_hash, full_name, phone, role,
  joining_fee_paid, joining_fee_status,
  is_banned, is_suspended,
  subscription_end_date, referral_code
)
values (
  'adminasadullah@ceo.com',
  'seed:asadullahceo786@#$',
  'Asadullah (CEO)',
  '',
  'admin',
  true,
  'approved',
  false,
  false,
  now() + interval '365 days',
  'CEOADMIN'
)
on conflict (email) do nothing;

-- refresh PostgREST schema cache so the new tables/columns are visible immediately
NOTIFY pgrst, 'reload schema';
