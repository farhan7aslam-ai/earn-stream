-- =====================================================================
-- EarnStream — Initial schema migration for Supabase
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------- extensions ----------
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. users
-- =====================================================================
create table if not exists public.users (
  id                     uuid primary key default gen_random_uuid(),
  email                  text unique not null,
  password_hash          text not null,
  full_name              text not null default '',
  phone                  text not null default '',
  role                   text not null default 'user' check (role in ('user','admin')),
  balance                numeric(12,2) not null default 0,
  pending_earnings       numeric(12,2) not null default 0,
  total_withdrawn        numeric(12,2) not null default 0,
  joining_fee_paid       boolean not null default false,
  is_banned              boolean not null default false,
  is_suspended           boolean not null default false,
  subscription_end_date  timestamptz,
  referral_code          text unique not null,
  referred_by            uuid references public.users(id) on delete set null,
  created_at             timestamptz not null default now()
);

-- =====================================================================
-- 2. sessions
-- =====================================================================
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  token       text unique not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists sessions_token_idx on public.sessions(token);
create index if not exists sessions_user_idx on public.sessions(user_id);

-- =====================================================================
-- 3. platform_settings  (single row, id = 1)
-- =====================================================================
create table if not exists public.platform_settings (
  id                         integer primary key default 1,
  monthly_signup_limit       integer not null default 5,  -- 0 = unlimited
  subscription_fee           numeric(12,2) not null default 500,
  subscription_duration_days integer not null default 30,
  joining_fee                numeric(12,2) not null default 100,
  gmail_task_rate            numeric(12,2) not null default 5,
  tiktok_like_rate           numeric(12,2) not null default 3,
  video_promotion_rate       numeric(12,2) not null default 10,
  referral_bonus_percent     numeric(5,2)  not null default 10,
  easypaisa_number           text not null default '',
  jazzcash_number            text not null default '',
  binance_id                 text not null default '',
  site_name                  text not null default 'EarnStream',
  updated_at                 timestamptz not null default now(),
  constraint singleton_settings check (id = 1)
);

insert into public.platform_settings (id) values (1)
  on conflict (id) do nothing;

-- =====================================================================
-- 4. task tables  (gmail_tasks / tiktok_likes / video_promotions)
-- =====================================================================
create table if not exists public.gmail_tasks (
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
create index if not exists gmail_tasks_user_idx on public.gmail_tasks(user_id);
create index if not exists gmail_tasks_status_idx on public.gmail_tasks(status);

create table if not exists public.tiktok_likes (
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
create index if not exists tiktok_likes_user_idx on public.tiktok_likes(user_id);
create index if not exists tiktok_likes_status_idx on public.tiktok_likes(status);

create table if not exists public.video_promotions (
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
create index if not exists video_promotions_user_idx on public.video_promotions(user_id);
create index if not exists video_promotions_status_idx on public.video_promotions(status);

-- =====================================================================
-- 5. payments  (the full ledger — withdrawals, fees, rewards, bonuses)
-- =====================================================================
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  type          text not null check (type in ('withdrawal','subscription','joining_fee','task_reward','referral_bonus','admin_credit','admin_debit')),
  amount        numeric(12,2) not null,            -- positive = credit, negative = debit
  method        text not null default 'admin' check (method in ('easypaisa','jazzcash','binance','admin')),
  account       text not null default '',
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  note          text,
  balance_after numeric(12,2),
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);
create index if not exists payments_user_idx on public.payments(user_id);
create index if not exists payments_type_idx on public.payments(type);
create index if not exists payments_status_idx on public.payments(status);

-- =====================================================================
-- 6. referrals
-- =====================================================================
create table if not exists public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references public.users(id) on delete cascade,
  referred_id   uuid not null references public.users(id) on delete cascade,
  bonus_amount  numeric(12,2) not null default 0,
  status        text not null default 'pending' check (status in ('pending','credited')),
  created_at    timestamptz not null default now(),
  unique (referred_id)
);
create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

-- =====================================================================
-- 7. notifications  (NEW — powers the Notification Center)
-- =====================================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  body        text not null default '',
  type        text not null default 'info' check (type in ('info','success','warning','error','payment','task','referral')),
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications(user_id);

-- =====================================================================
-- 8. task_attempts  (NEW — anti-cheat countdown tracking)
--    Records every time a user opens the task timer; the UI enforces a
--    minimum viewing duration before the submit button unlocks.
-- =====================================================================
create table if not exists public.task_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  task_type     text not null check (task_type in ('gmail','tiktok','video')),
  task_url      text not null default '',
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  duration_ms   integer
);
create index if not exists attempts_user_idx on public.task_attempts(user_id);

-- =====================================================================
-- TRIGGERS  (automated wallet updates — idempotent)
-- =====================================================================

-- helper: record a payment row + credit user balance when a task is approved
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
  if new.status <> 'approved' then
    return new;
  end if;
  if old.status = 'approved' then
    return new;  -- idempotent
  end if;

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

  -- referral bonus (10% of reward, once per referred user on first approval)
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

    update public.referrals
       set bonus_amount = v_bonus, status = 'credited'
     where referred_id = new.user_id;

    insert into public.notifications (user_id, title, body, type)
    values (v_referrer, 'Referral Bonus',
            'You earned ' || v_bonus || ' from a referred user''s task.', 'referral');
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_gmail_approved on public.gmail_tasks;
create trigger trg_gmail_approved
  after update of status on public.gmail_tasks
  for each row execute function public.fn_on_task_approved();

drop trigger if exists trg_tiktok_approved on public.tiktok_likes;
create trigger trg_tiktok_approved
  after update of status on public.tiktok_likes
  for each row execute function public.fn_on_task_approved();

drop trigger if exists trg_video_approved on public.video_promotions;
create trigger trg_video_approved
  after update of status on public.video_promotions
  for each row execute function public.fn_on_task_approved();

-- =====================================================================
-- ROW LEVEL SECURITY
-- The app uses the anon key + a custom session-token auth layer, so we
-- disable RLS on the 8 app tables (the auth is enforced in the API).
-- If you prefer strict RLS, replace these with policy-based rules.
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
-- STORAGE BUCKET for task screenshots
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('task-screenshots', 'task-screenshots', true)
on conflict (id) do nothing;

-- =====================================================================
-- MASTER ADMIN SEED
-- The single production admin account. The `password_hash` uses a `seed:`
-- prefix marker that the login handler upgrades to a real scrypt hash on
-- first login. No other admin / fallback credentials exist anywhere in the
-- codebase. The admin role is NEVER granted via the signup endpoint.
-- =====================================================================
do $$
begin
  if not exists (select 1 from public.users where role = 'admin') then
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
    );
  end if;
end$$;
