-- =====================================================================
-- EarnStream — Joining-Fee Verification migration (incremental)
-- Run after 0001_init.sql. Idempotent.
-- =====================================================================

-- ---------- new columns on users ----------
alter table public.users
  add column if not exists joining_fee_status text not null default 'none'
    check (joining_fee_status in ('none','pending_approval','approved','rejected'));

alter table public.users
  add column if not exists joining_fee_screenshot text;

alter table public.users
  add column if not exists joining_fee_submitted_at timestamptz;

-- backfill status from the existing joining_fee_paid flag
update public.users
   set joining_fee_status = 'approved'
 where joining_fee_paid = true
   and joining_fee_status = 'none';

create index if not exists users_joining_fee_status_idx
  on public.users(joining_fee_status);

-- ---------- storage bucket for payment screenshots ----------
insert into storage.buckets (id, name, public)
values ('payment-screenshots', 'payment-screenshots', true)
on conflict (id) do nothing;

-- permissive policies so the anon-key server client can upload/list/get
drop policy if exists "payment-screenshots public read" on storage.objects;
create policy "payment-screenshots public read"
  on storage.objects for select
  using ( bucket_id = 'payment-screenshots' );

drop policy if exists "payment-screenshots anon upload" on storage.objects;
create policy "payment-screenshots anon upload"
  on storage.objects for insert
  with check ( bucket_id = 'payment-screenshots' );

drop policy if exists "payment-screenshots anon update" on storage.objects;
create policy "payment-screenshots anon update"
  on storage.objects for update
  using ( bucket_id = 'payment-screenshots' );
