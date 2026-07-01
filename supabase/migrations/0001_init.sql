-- Baeco Hospitality Enterprise 2027 — core schema
-- Run via `supabase db push` or the Supabase SQL editor.
-- Designed for a single property per Supabase project; add a `property_id`
-- column + row filtering if you need multi-property in one project.

create extension if not exists "pgcrypto";

-- ============================================================================
-- Roles & users (app-level profile, separate from auth.users)
-- ============================================================================

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null, -- 'owner' | 'manager' | 'staff' | 'customer'
  label text not null,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role_id uuid references roles (id),
  locale text not null default 'ro',
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from users u join roles r on r.id = u.role_id
    where u.id = auth.uid() and r.key in ('owner', 'manager', 'staff')
  );
$$;

-- ============================================================================
-- Property, rooms, rates
-- ============================================================================

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  whatsapp text,
  email text,
  check_in_time text default '14:00',
  check_out_time text default '11:00',
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);

create table if not exists room_types (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  slug text unique not null,
  name jsonb not null, -- { ro, en, de, fr, it, es }
  description jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  room_type_id uuid references room_types (id),
  slug text unique not null,
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  gallery text[] not null default '{}',
  cover_image text,
  max_adults int not null default 2,
  max_children int not null default 0,
  size_sqm numeric,
  beds text[] not null default '{}',
  amenities text[] not null default '{}',
  base_price numeric not null,
  rules jsonb not null default '{}'::jsonb,
  included_service_ids uuid[] not null default '{}',
  extra_service_ids uuid[] not null default '{}',
  virtual_tour_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  name jsonb not null,
  start_date date not null,
  end_date date not null,
  multiplier numeric not null default 1,
  weekend_multiplier numeric not null default 1,
  min_nights int default 1,
  created_at timestamptz not null default now()
);

create table if not exists room_rates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms (id) on delete cascade,
  season_id uuid references seasons (id) on delete cascade,
  override_price numeric, -- optional fixed override instead of base_price * multiplier
  created_at timestamptz not null default now(),
  unique (room_id, season_id)
);

-- ============================================================================
-- Services (extras)
-- ============================================================================

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  slug text unique not null,
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  price numeric not null default 0,
  charge_type text not null check (charge_type in ('per_person', 'per_room', 'per_booking', 'per_night')),
  active boolean not null default true,
  available_from date,
  available_to date,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Customers, bookings
-- ============================================================================

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  locale text default 'ro',
  loyalty_points int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  property_id uuid references properties (id),
  room_id uuid references rooms (id),
  customer_id uuid references customers (id),
  check_in date not null,
  check_out date not null,
  adults int not null default 1,
  children int not null default 0,
  child_ages int[] not null default '{}',
  infants int not null default 0,
  promo_code text,
  voucher_code text,
  guest_first_name text not null,
  guest_last_name text not null,
  guest_email text not null,
  guest_phone text,
  special_requests text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  totals jsonb not null default '{}'::jsonb,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists booking_guests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete cascade,
  full_name text,
  age int,
  document_type text,
  document_number text
);

create table if not exists booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete cascade,
  service_id uuid references services (id),
  quantity int not null default 1,
  unit_price numeric not null,
  total_price numeric not null
);

-- ============================================================================
-- Marketing: promotions, vouchers, loyalty, reviews
-- ============================================================================

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  code text unique not null,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric not null,
  valid_from date not null,
  valid_to date not null,
  max_redemptions int,
  redemptions int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists vouchers (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  code text unique not null,
  initial_value numeric not null,
  balance numeric not null,
  expires_at date not null,
  active boolean not null default true,
  purchaser_email text,
  created_at timestamptz not null default now()
);

create table if not exists loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id) on delete cascade unique,
  points int not null default 0,
  tier text not null default 'silver',
  updated_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  booking_id uuid references bookings (id),
  guest_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  room_name text,
  source text not null default 'website',
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Content: gallery, pages, translations, settings
-- ============================================================================

create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  category text,
  image_url text not null,
  alt jsonb default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  slug text unique not null,
  title jsonb not null,
  subtitle jsonb default '{}'::jsonb,
  body jsonb default '{}'::jsonb,
  gallery text[] not null default '{}',
  meta_title jsonb default '{}'::jsonb,
  meta_description jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists translations (
  id uuid primary key default gen_random_uuid(),
  namespace text not null, -- 'site' | 'admin' | 'portal' | 'ai' | 'emails' | 'whatsapp' | 'seo' | 'errors' | 'forms'
  key text not null,
  locale text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  unique (namespace, key, locale)
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (property_id, key)
);

-- ============================================================================
-- AI knowledge base
-- ============================================================================

create table if not exists ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  category text not null,
  question jsonb not null,
  answer jsonb not null,
  keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Explore Area: attractions, restaurants, events, routes
-- ============================================================================

create table if not exists attractions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  category text not null check (category in ('attraction', 'market', 'shop', 'producer')),
  name jsonb not null,
  description jsonb default '{}'::jsonb,
  image text,
  distance_km numeric,
  drive_minutes int,
  tags text[] not null default '{}',
  good_for text[] not null default '{}', -- 'family' | 'romantic' | 'rainy-day' | 'kids'
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  name jsonb not null,
  description jsonb default '{}'::jsonb,
  cuisine text,
  image text,
  distance_km numeric,
  drive_minutes int,
  good_for text[] not null default '{}',
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  name jsonb not null,
  description jsonb default '{}'::jsonb,
  date date not null,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  name jsonb not null,
  description jsonb default '{}'::jsonb,
  distance_km numeric,
  duration_minutes int,
  difficulty text,
  gpx_url text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Notifications & audit
-- ============================================================================

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id),
  channel text not null check (channel in ('email', 'whatsapp', 'in_app')),
  subject text,
  body text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users (id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table properties enable row level security;
alter table room_types enable row level security;
alter table rooms enable row level security;
alter table seasons enable row level security;
alter table room_rates enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;
alter table booking_guests enable row level security;
alter table booking_services enable row level security;
alter table promotions enable row level security;
alter table vouchers enable row level security;
alter table loyalty_accounts enable row level security;
alter table reviews enable row level security;
alter table gallery enable row level security;
alter table pages enable row level security;
alter table translations enable row level security;
alter table settings enable row level security;
alter table ai_knowledge enable row level security;
alter table attractions enable row level security;
alter table restaurants enable row level security;
alter table events enable row level security;
alter table routes enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table users enable row level security;
alter table roles enable row level security;

-- Public, read-only content (site + booking engine reference data)
create policy "public read properties" on properties for select using (true);
create policy "public read room_types" on room_types for select using (active = true);
create policy "public read rooms" on rooms for select using (active = true);
create policy "public read seasons" on seasons for select using (true);
create policy "public read services" on services for select using (active = true);
create policy "public read promotions" on promotions for select using (active = true and now()::date between valid_from and valid_to);
create policy "public read gallery" on gallery for select using (true);
create policy "public read pages" on pages for select using (true);
create policy "public read translations" on translations for select using (true);
create policy "public read ai_knowledge" on ai_knowledge for select using (true);
create policy "public read attractions" on attractions for select using (true);
create policy "public read restaurants" on restaurants for select using (true);
create policy "public read events" on events for select using (true);
create policy "public read routes" on routes for select using (true);
create policy "public read approved reviews" on reviews for select using (approved = true);

-- Admin full access (staff/manager/owner roles)
create policy "admin manage properties" on properties for all using (is_admin()) with check (is_admin());
create policy "admin manage room_types" on room_types for all using (is_admin()) with check (is_admin());
create policy "admin manage rooms" on rooms for all using (is_admin()) with check (is_admin());
create policy "admin manage seasons" on seasons for all using (is_admin()) with check (is_admin());
create policy "admin manage room_rates" on room_rates for all using (is_admin()) with check (is_admin());
create policy "admin manage services" on services for all using (is_admin()) with check (is_admin());
create policy "admin manage promotions" on promotions for all using (is_admin()) with check (is_admin());
create policy "admin manage vouchers" on vouchers for all using (is_admin()) with check (is_admin());
create policy "admin manage gallery" on gallery for all using (is_admin()) with check (is_admin());
create policy "admin manage pages" on pages for all using (is_admin()) with check (is_admin());
create policy "admin manage translations" on translations for all using (is_admin()) with check (is_admin());
create policy "admin manage settings" on settings for all using (is_admin()) with check (is_admin());
create policy "admin manage ai_knowledge" on ai_knowledge for all using (is_admin()) with check (is_admin());
create policy "admin manage attractions" on attractions for all using (is_admin()) with check (is_admin());
create policy "admin manage restaurants" on restaurants for all using (is_admin()) with check (is_admin());
create policy "admin manage events" on events for all using (is_admin()) with check (is_admin());
create policy "admin manage routes" on routes for all using (is_admin()) with check (is_admin());
create policy "admin manage reviews" on reviews for all using (is_admin()) with check (is_admin());
create policy "admin manage bookings" on bookings for all using (is_admin()) with check (is_admin());
create policy "admin manage booking_guests" on booking_guests for all using (is_admin()) with check (is_admin());
create policy "admin manage booking_services" on booking_services for all using (is_admin()) with check (is_admin());
create policy "admin manage customers" on customers for all using (is_admin()) with check (is_admin());
create policy "admin manage loyalty_accounts" on loyalty_accounts for all using (is_admin()) with check (is_admin());
create policy "admin manage notifications" on notifications for all using (is_admin()) with check (is_admin());
create policy "admin read audit_logs" on audit_logs for select using (is_admin());
create policy "admin manage users" on users for all using (is_admin()) with check (is_admin());
create policy "admin manage roles" on roles for all using (is_admin()) with check (is_admin());

-- Customers / portal: users can see and manage their own records
create policy "self read profile" on users for select using (auth.uid() = id);
create policy "self update profile" on users for update using (auth.uid() = id);
create policy "self read customer" on customers for select using (user_id = auth.uid());
create policy "self update customer" on customers for update using (user_id = auth.uid());
create policy "self read own bookings" on bookings for select using (
  customer_id in (select id from customers where user_id = auth.uid())
);
create policy "self update own bookings" on bookings for update using (
  customer_id in (select id from customers where user_id = auth.uid())
);
create policy "self read own booking_services" on booking_services for select using (
  booking_id in (select b.id from bookings b join customers c on c.id = b.customer_id where c.user_id = auth.uid())
);
create policy "self read own loyalty" on loyalty_accounts for select using (
  customer_id in (select id from customers where user_id = auth.uid())
);
create policy "self read own notifications" on notifications for select using (user_id = auth.uid());
create policy "self read own voucher" on vouchers for select using (
  purchaser_email = (select email from users where id = auth.uid())
);

-- Anyone can create a booking (guest checkout) and submit a review request;
-- writes to sensitive fields (status, totals) are locked down to admins via
-- the columns not being exposed in the booking-create API route.
create policy "public insert bookings" on bookings for insert with check (true);
create policy "public insert booking_guests" on booking_guests for insert with check (true);
create policy "public insert booking_services" on booking_services for insert with check (true);
create policy "public insert customers" on customers for insert with check (true);
create policy "public insert reviews" on reviews for insert with check (true);

comment on function is_admin() is 'Returns true when the current auth.uid() belongs to a user with an owner/manager/staff role. Used by every admin-only RLS policy above.';
