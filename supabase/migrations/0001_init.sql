-- Muncie Maids M1 schema: pricing config, service areas, bookings.
-- Bookings are never written or read directly by the client — only by
-- Edge Functions using the service role key — so quoted prices and
-- booking status can't be tampered with from the browser.

create table pricing_config (
  id int primary key default 1,
  base_price numeric not null,
  per_bedroom numeric not null,
  per_bathroom numeric not null,
  sqft_band_multipliers jsonb not null,   -- {"under_1000":1.0,"1000_1800":1.15,...}
  clean_type_multipliers jsonb not null,  -- {"standard":1.0,"deep":1.5,"moveout":1.75}
  frequency_discounts jsonb not null,     -- {"one_time":0,"weekly":0.20,"biweekly":0.15,"monthly":0.10}
  constraint single_row check (id = 1)
);

create table service_areas (
  id serial primary key,
  city text not null,          -- Muncie, Yorktown, Gaston, Albany
  zip_prefixes text[] not null,
  active boolean not null default true
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'open', 'cancelled')),

  -- quote inputs (persisted for audit)
  bedrooms int not null,
  -- numeric, not int: half-bathrooms (1.5, 2.5+) are a real quote option
  bathrooms numeric not null,
  sqft_band text not null,
  clean_type text not null,
  frequency text not null,
  quoted_price numeric not null,

  -- schedule
  service_date date not null,
  time_window text not null,          -- e.g. '8:00-11:00 AM'

  -- customer & location
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  address_line text not null,
  city text not null,
  zip text not null,
  entry_notes text,
  has_pets boolean not null default false,

  -- payment
  stripe_payment_intent_id text,

  created_at timestamptz not null default now()
);

create index bookings_service_date_time_window_idx
  on bookings (service_date, time_window)
  where status <> 'cancelled';

-- Row Level Security ---------------------------------------------------

alter table pricing_config enable row level security;
alter table service_areas enable row level security;
alter table bookings enable row level security;

-- pricing_config: public read, no public write
create policy "pricing_config is publicly readable"
  on pricing_config for select
  to anon, authenticated
  using (true);

-- service_areas: public read, no public write
create policy "service_areas are publicly readable"
  on service_areas for select
  to anon, authenticated
  using (true);

-- bookings: no public select/insert/update/delete of any kind.
-- All access goes through Edge Functions using the service role key,
-- which bypasses RLS. No policies are created for anon/authenticated,
-- so every client-side query against this table is denied by default.
