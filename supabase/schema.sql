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
  v_steam boolean := coalesce(p->'steam' = 'true'::jsonb, false);
  v_items jsonb := '[]'::jsonb;
  v_it jsonb;
  v_item text;
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
  -- 1 to 10 different dishes from the menu, each 0.5–20 kg in half kilos (rebuilt so nothing else is stored)
  if jsonb_typeof(p->'items') is distinct from 'array' or jsonb_array_length(p->'items') not between 1 and 10 then raise exception 'invalid items'; end if;
  for v_it in select value from jsonb_array_elements(p->'items') loop
    v_item := coalesce(v_it->>'item', '');
    if not exists (select 1 from public.menu_items where data->>'name' = v_item) then raise exception 'invalid item'; end if;
    if v_items @> jsonb_build_array(jsonb_build_object('item', v_item)) then raise exception 'invalid items'; end if;
    begin v_q := (v_it->>'q')::numeric; exception when others then raise exception 'invalid quantity'; end;
    if v_q is null or v_q < 0.5 or v_q > 20 or v_q * 2 <> floor(v_q * 2) then raise exception 'invalid quantity'; end if;
    v_items := v_items || jsonb_build_array(jsonb_build_object('item', v_item, 'q', v_q));
  end loop;
  -- Against spam: at most 3 requests per phone a day, 60 in all an hour
  if (select count(*) from public.requests where data->>'phone' = v_phone and created_at > now() - interval '1 day') >= 3
    or (select count(*) from public.requests where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'too many requests';
  end if;
  v_id := floor(extract(epoch from clock_timestamp()) * 1000)::bigint * 1000 + floor(random() * 1000)::bigint;
  insert into public.requests (id, data) values (v_id, jsonb_build_object(
    'name', v_name, 'phone', v_phone, 'dDate', v_date::text, 'dTime', v_time, 'map', v_map,
    'note', v_note, 'items', v_items, 'steam', v_steam, 'at', now()));
  return v_id;
end;
$$;
revoke all on function public.submit_request(jsonb) from public;
grant execute on function public.submit_request(jsonb) to anon, authenticated;

-- Secrets only database functions read: RLS is on and there is no policy, so nobody can read this through the API.
--   sepay_webhook = the API key you typed in SePay's webhook (24+ letters/digits)
--   sepay_account = (optional) your receiving account number; transfers to other accounts are ignored
create table if not exists public.app_secrets (
  key text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

-- Bank transfers reported by SePay (POST /api/sepay → sepay_payment below). Each SePay transaction id is stored once,
-- so SePay's retries can't count the same money twice. Members can read them; only sepay_payment() writes.
create table if not exists public.payments (
  id bigint primary key,
  order_id bigint,
  amount bigint not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;

drop policy if exists "members read" on public.payments;
create policy "members read" on public.payments
  for select to authenticated using (public.is_member());

-- One incoming transfer. `k` is the key SePay sent; it must match app_secrets.sepay_webhook. The order is found from
-- "CNE<order id>" in the transfer note (or SePay's payment code). Money counts towards the order: once it reaches the
-- 30% deposit the order moves to "Đã chuyển cọc" (2), once it covers everything (goods + steaming + shipping) to
-- "Đã thanh toán" (3). Less than the deposit is kept in `part` until the rest arrives. Returns what happened.
create or replace function public.sepay_payment(p jsonb, k text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := (select value from public.app_secrets where key = 'sepay_webhook');
  v_acc text := (select value from public.app_secrets where key = 'sepay_account');
  v_today text := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD');
  v_id bigint;
  v_amt bigint;
  v_note text;
  v_m text[];
  v_oid bigint;
  v_o jsonb;
  v_stage int;
  v_goods numeric;
  v_total numeric;
  v_dep numeric;
  v_got numeric;
begin
  if v_key is null or char_length(v_key) < 24 or k is null or k <> v_key then raise exception 'unauthorized'; end if;
  if jsonb_typeof(p) <> 'object' or jsonb_typeof(p->'id') <> 'number' or jsonb_typeof(p->'transferAmount') <> 'number' then
    raise exception 'invalid payment';
  end if;
  begin
    v_id := (p->>'id')::bigint;
    v_amt := (p->>'transferAmount')::bigint;
  exception when others then raise exception 'invalid payment'; end;
  if v_id <= 0 or v_amt <= 0 or v_amt > 10000000000 then raise exception 'invalid payment'; end if;
  if coalesce(p->>'transferType', '') <> 'in' then return 'ignored'; end if;
  if v_acc is not null and coalesce(p->>'accountNumber', '') <> v_acc then return 'ignored'; end if;

  v_note := left(coalesce(p->>'code', '') || ' ' || coalesce(p->>'content', ''), 600);
  insert into public.payments (id, amount, data) values (v_id, v_amt, jsonb_build_object(
    'content', left(coalesce(p->>'content', ''), 500), 'code', left(p->>'code', 50), 'gateway', left(p->>'gateway', 50),
    'date', left(p->>'transactionDate', 30), 'ref', left(p->>'referenceCode', 60), 'acc', left(p->>'accountNumber', 30)))
  on conflict (id) do nothing;
  if not found then return 'duplicate'; end if;

  v_m := regexp_match(upper(v_note), 'CNE\s*([0-9]{10,18})');
  if v_m is null then return 'unmatched'; end if;
  v_oid := v_m[1]::bigint;
  select data into v_o from public.orders where id = v_oid for update;
  if v_o is null or jsonb_typeof(v_o->'delAt') = 'number' then return 'unmatched'; end if;
  update public.payments set order_id = v_oid where id = v_id;

  v_stage := coalesce((v_o->>'stage')::int, 0);
  v_goods := coalesce((v_o->>'amt')::numeric, 0);
  v_total := v_goods + coalesce((v_o->>'steamFee')::numeric, 0) + coalesce((v_o->>'ship')::numeric, 0);
  v_dep := round(v_goods * 0.3 / 1000) * 1000;
  v_o := jsonb_set(v_o, '{pays}', coalesce(v_o->'pays', '[]'::jsonb)
    || jsonb_build_array(jsonb_build_object('id', v_id, 'amt', v_amt, 'at', now())));

  if v_stage < 2 then
    v_got := coalesce((v_o->>'part')::numeric, 0) + v_amt;
    if v_got >= v_dep then
      v_o := (v_o - 'part') || jsonb_build_object('dep', v_got, 'depDate', v_today,
        'stage', case when v_got >= v_total then 3 else 2 end);
    else
      v_o := v_o || jsonb_build_object('part', v_got);
    end if;
  elsif v_stage = 2 then
    v_got := coalesce((v_o->>'dep')::numeric, 0) + v_amt;
    v_o := v_o || jsonb_build_object('dep', v_got, 'stage', case when v_got >= v_total then 3 else 2 end);
  end if;

  update public.orders set data = v_o, updated_at = now() where id = v_oid;
  return 'matched';
end;
$$;
revoke all on function public.sepay_payment(jsonb, text) from public;
grant execute on function public.sepay_payment(jsonb, text) to anon, authenticated;

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
