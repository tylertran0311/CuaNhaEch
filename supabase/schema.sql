-- Cua Nhà Ếch — database setup for Supabase.
-- Paste this whole file into Supabase → SQL Editor → Run. It is safe to run again.
--
-- Access: only signed-in users whose email is in public.members can read or change shop data.
-- To give someone access: create their user in Authentication → Users, then add their email
-- (see the insert at the bottom).

-- People allowed to use the app
create table if not exists public.members (
  email text primary key,
  created_at timestamptz not null default now()
);

-- True when the signed-in user's email is in members. SECURITY DEFINER so it can read
-- members without tripping that table's own policy.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Shop data. Each row keeps the record as JSON so the app's data shape can grow without migrations.
create table if not exists public.orders (
  id bigint primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id bigint primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id text primary key,
  data jsonb not null,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Small shared settings, e.g. menu_upd = the day prices were last confirmed
create table if not exists public.meta (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.orders enable row level security;
alter table public.expenses enable row level security;
alter table public.menu_items enable row level security;
alter table public.meta enable row level security;

drop policy if exists "members read members" on public.members;
create policy "members read members" on public.members
  for select to authenticated using (public.is_member());

drop policy if exists "members only" on public.orders;
create policy "members only" on public.orders
  for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "members only" on public.expenses;
create policy "members only" on public.expenses
  for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "members only" on public.menu_items;
create policy "members only" on public.menu_items
  for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "members only" on public.meta;
create policy "members only" on public.meta
  for all to authenticated using (public.is_member()) with check (public.is_member());

-- Public landing page (/home): anyone may READ the menu (names, sizes, prices) and the day prices were confirmed.
-- Orders, expenses, customers and members stay private; changing the menu still needs a member.
drop policy if exists "public read menu" on public.menu_items;
create policy "public read menu" on public.menu_items
  for select to anon, authenticated using (true);

drop policy if exists "public read menu date" on public.meta;
create policy "public read menu date" on public.meta
  for select to anon, authenticated using (key = 'menu_upd');

-- Live updates: send changes to everyone who has the app open
do $$
declare t text;
begin
  foreach t in array array['orders', 'expenses', 'menu_items', 'meta'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ↓↓↓ Put your own email here (and one line per extra person), then run.
insert into public.members (email) values
  ('cuanhaech@gmail.com')
on conflict do nothing;
