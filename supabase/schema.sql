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

-- Public pages (/home, /san-pham): anyone may READ the menu (names, sizes, prices), the day prices were confirmed and
-- today's crab stock (kg / pieces entered and left). Orders, expenses, customers and members stay private; changing
-- any of it still needs a member.
drop policy if exists "public read menu" on public.menu_items;
create policy "public read menu" on public.menu_items
  for select to anon, authenticated using (true);

drop policy if exists "public read menu date" on public.meta;
create policy "public read menu date" on public.meta
  for select to anon, authenticated using (key in ('menu_upd', 'stock'));

-- Order requests from customers (the public product page's "đặt giao ngày khác" form). Members review them in the
-- dashboard's waiting tab. The public can't read or write this table directly: only submit_request() below adds
-- rows, after checking every field again (the website checks them too, but anyone can call the database).
create table if not exists public.requests (
  id bigint primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.requests enable row level security;

drop policy if exists "members only" on public.requests;
create policy "members only" on public.requests
  for all to authenticated using (public.is_member()) with check (public.is_member());

create or replace function public.submit_request(p jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_now text := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI');
  v_name text := btrim(coalesce(p->>'name', ''));
  v_phone text := coalesce(p->>'phone', '');
  v_time text := coalesce(p->>'dTime', '');
  v_map text := coalesce(p->>'map', '');
  v_note text := coalesce(p->>'note', '');
  v_item text := coalesce(p->>'item', '');
  v_date date;
  v_q numeric;
  v_id bigint;
begin
  if jsonb_typeof(p) <> 'object' then raise exception 'invalid request'; end if;
  if char_length(v_name) not between 2 and 50 or v_name !~ '^[[:alpha:]][[:alpha:] .''-]*$' then raise exception 'invalid name'; end if;
  if v_phone !~ '^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$' and v_phone !~ '^02[0-9]{9}$' then raise exception 'invalid phone'; end if;
  begin v_date := (p->>'dDate')::date; exception when others then raise exception 'invalid date'; end;
  if v_date is null or v_date < v_today or v_date > v_today + 30 then raise exception 'invalid date'; end if;
  if v_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (v_date = v_today and v_time <= v_now) then raise exception 'invalid time'; end if;
  if char_length(v_map) > 500 or v_map !~* '^https://((maps\.app\.goo\.gl|goo\.gl/maps|maps\.google\.[a-z.]+)/|(www\.)?google\.[a-z.]+/maps)' then raise exception 'invalid map'; end if;
  if char_length(v_note) > 300 or v_note ~ '[\x01-\x09\x0b-\x1f\x7f]' then raise exception 'invalid note'; end if;
  if not exists (select 1 from public.menu_items where data->>'name' = v_item) then raise exception 'invalid item'; end if;
  begin v_q := (p->>'q')::numeric; exception when others then raise exception 'invalid quantity'; end;
  if v_q is null or v_q < 0.5 or v_q > 20 or v_q * 2 <> floor(v_q * 2) then raise exception 'invalid quantity'; end if;
  -- Against spam: at most 3 requests per phone a day, 60 in all an hour
  if (select count(*) from public.requests where data->>'phone' = v_phone and created_at > now() - interval '1 day') >= 3
    or (select count(*) from public.requests where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'too many requests';
  end if;
  v_id := floor(extract(epoch from clock_timestamp()) * 1000)::bigint * 1000 + floor(random() * 1000)::bigint;
  insert into public.requests (id, data) values (v_id, jsonb_build_object(
    'name', v_name, 'phone', v_phone, 'dDate', v_date::text, 'dTime', v_time, 'map', v_map,
    'note', v_note, 'item', v_item, 'q', v_q, 'at', now()));
  return v_id;
end;
$$;
revoke all on function public.submit_request(jsonb) from public;
grant execute on function public.submit_request(jsonb) to anon, authenticated;

-- Live updates: send changes to everyone who has the app open
do $$
declare t text;
begin
  foreach t in array array['orders', 'expenses', 'menu_items', 'meta', 'requests'] loop
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
