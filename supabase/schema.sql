-- Velmont schema for Supabase Postgres.
-- Run once in the Supabase SQL editor (or `supabase db execute` / psql) against
-- a fresh project. Safe to re-run individual CREATE statements via IF NOT EXISTS
-- where present; the RPC functions use CREATE OR REPLACE so they can be re-run freely.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  avatar_url text,
  is_admin boolean not null default false,
  security_question text,
  security_answer_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  address_line text not null,
  city text not null,
  country text not null default 'Kenya',
  is_default boolean not null default false,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.products (
  id text primary key,
  brand_id text not null,
  name text not null,
  price integer not null,
  rating real not null default 4.5,
  review_count integer not null default 0,
  image text,
  case_color text not null,
  dial_color text not null,
  strap_type text not null,
  strap_color text not null,
  case_size_mm integer not null,
  movement text not null,
  case_shape text not null,
  resistance_m integer not null,
  gender text not null,
  warranty_years integer not null,
  description text not null,
  stock_quantity integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  location_id bigint references public.locations(id) on delete set null,
  status text not null default 'placed',
  subtotal integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  brand_name text not null,
  unit_price integer not null,
  quantity integer not null
);

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  session_id text not null,
  path text not null,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_page_views_created_at on public.page_views(created_at);
create index if not exists idx_page_views_session on public.page_views(session_id);

-- RLS on, no policies: the API only ever talks to Postgres with the service-role
-- key (which bypasses RLS), so this just blocks any accidental anon/authenticated
-- access via the public Supabase client.
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.favorites enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.page_views enable row level security;

-- Atomically validates stock, creates an order + its items, and decrements
-- stock in one round trip. p_items is a JSON array of {"productId": text, "quantity": int}.
create or replace function public.create_order(
  p_user_id uuid,
  p_location_id bigint,
  p_items jsonb
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id bigint;
  v_subtotal integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
begin
  -- Lock the involved product rows up front so concurrent checkouts can't both
  -- pass the stock check for the same item.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;

    select * into v_product
    from public.products
    where id = v_item->>'productId'
    for update;

    if not found then
      raise exception 'Unknown product: %', v_item->>'productId';
    end if;
    if v_quantity is null or v_quantity < 1 or v_quantity > 20 then
      raise exception 'Invalid quantity for %', v_product.name;
    end if;
    if v_product.stock_quantity < v_quantity then
      if v_product.stock_quantity = 0 then
        raise exception '% is out of stock.', v_product.name;
      end if;
      raise exception 'Only % left of %.', v_product.stock_quantity, v_product.name;
    end if;

    v_subtotal := v_subtotal + v_product.price * v_quantity;
  end loop;

  insert into public.orders (user_id, location_id, subtotal)
  values (p_user_id, p_location_id, v_subtotal)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;

    select * into v_product from public.products where id = v_item->>'productId';

    insert into public.order_items (order_id, product_id, product_name, brand_name, unit_price, quantity)
    values (v_order_id, v_product.id, v_product.name, v_item->>'brandName', v_product.price, v_quantity);

    update public.products set stock_quantity = stock_quantity - v_quantity where id = v_product.id;
  end loop;

  return v_order_id;
end;
$$;

-- Mirrors the four visitor-analytics queries in server/routes/admin.js as one
-- round trip, returning JSON in the exact shape the Admin Dashboard expects.
create or replace function public.get_visitor_stats(p_days integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_views bigint;
  v_unique_visitors bigint;
  v_last24h_views bigint;
  v_last24h_visitors bigint;
  v_daily json;
  v_top_pages json;
  v_recent json;
begin
  select count(*), count(distinct session_id)
  into v_total_views, v_unique_visitors
  from public.page_views;

  select count(*), count(distinct session_id)
  into v_last24h_views, v_last24h_visitors
  from public.page_views
  where created_at >= now() - interval '1 day';

  select coalesce(json_agg(row_to_json(d) order by d.day), '[]'::json) into v_daily
  from (
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
           count(*) as views,
           count(distinct session_id) as visitors
    from public.page_views
    where created_at >= now() - (p_days || ' days')::interval
    group by 1
  ) d;

  select coalesce(json_agg(row_to_json(t) order by t.views desc), '[]'::json) into v_top_pages
  from (
    select path, count(*) as views
    from public.page_views
    where created_at >= now() - (p_days || ' days')::interval
    group by path
    order by views desc
    limit 10
  ) t;

  select coalesce(json_agg(row_to_json(r)), '[]'::json) into v_recent
  from (
    select pv.path, pv."createdAt", pr."userName"
    from (
      select path, created_at as "createdAt", user_id
      from public.page_views
      order by created_at desc
      limit 20
    ) pv
    left join lateral (
      select name as "userName" from public.profiles where id = pv.user_id
    ) pr on true
  ) r;

  return json_build_object(
    'totalViews', v_total_views,
    'uniqueVisitors', v_unique_visitors,
    'last24h', json_build_object('views', v_last24h_views, 'visitors', v_last24h_visitors),
    'daily', v_daily,
    'topPages', v_top_pages,
    'recent', v_recent
  );
end;
$$;
