-- Hospitality Intelligence Engine — discovery + curated area knowledge.
--
-- The engine discovers places around the property (OpenStreetMap in
-- production), classifies them into the BD taxonomy, scores them, and stores
-- them here for the admin approval workflow. Approved rows become the single
-- source of truth for Explore, AI Concierge, AI Local Guide, AI Stay Planner
-- and every future agent — the AI layer never invents places, it only reads
-- what the administrator approved.
--
-- This migration is SELF-CONTAINED and IDEMPOTENT: it can be applied on a
-- database where 0001_init.sql was never (or only partially) run, and can be
-- safely re-run after a partial failure. It creates defensive versions of
-- its dependencies (`properties`, `is_admin()`) only when they are missing.

create extension if not exists "pgcrypto";

-- ============================================================================
-- Dependency guards (normally provided by 0001_init.sql)
-- ============================================================================

-- `properties`: created here with the 0001 shape if it doesn't exist yet.
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

-- `is_admin()`: created only if missing. This defensive version returns
-- false when the roles/users tables don't exist yet (pre-0001 database),
-- instead of erroring — admin writes go through the service-role client
-- (which bypasses RLS), so this stays safe either way.
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'is_admin' and n.nspname = 'public'
  ) then
    create function is_admin()
    returns boolean
    language plpgsql
    security definer
    stable
    as $fn$
    begin
      if to_regclass('public.users') is null or to_regclass('public.roles') is null then
        return false;
      end if;
      return exists (
        select 1 from users u join roles r on r.id = u.role_id
        where u.id = auth.uid() and r.key in ('owner', 'manager', 'staff')
      );
    end;
    $fn$;
  end if;
end $$;

-- ============================================================================
-- Property profile: the fields the discovery engine needs (2-minute
-- onboarding: name, address, GPS, category — the rest is derived/discovered).
-- ============================================================================

alter table properties add column if not exists category text not null default 'hotel'; -- hotel|guesthouse|villa|apartment|resort|chain
alter table properties add column if not exists locality text;
alter table properties add column if not exists county text;
alter table properties add column if not exists region text;
alter table properties add column if not exists country text;
alter table properties add column if not exists discovery_radius_km numeric not null default 25;
alter table properties add column if not exists last_discovery_at timestamptz;

-- ============================================================================
-- Discovered places: everything the engine (or the admin, manually) knows
-- about the area, with a moderation workflow.
-- ============================================================================

create table if not exists discovered_places (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,

  -- provenance
  source text not null default 'osm',            -- 'osm' | 'manual' | 'sample'
  source_ref text,                               -- e.g. 'node/123456' — dedupe key per property

  -- identity & classification (BD taxonomy, see src/lib/discovery/taxonomy.ts)
  name text not null,
  name_en text,
  category text not null,                        -- 'attraction' | 'culture' | 'nature' | 'trail' | 'adventure' | 'sport' | 'wellness' | 'family' | 'restaurant' | 'cafe' | 'bar' | 'nightlife' | 'shopping' | 'market' | 'producer' | 'transport' | 'health' | 'fuel' | 'services'
  subcategory text,                              -- raw OSM value, e.g. 'museum', 'pizza'
  description jsonb not null default '{}'::jsonb, -- localized { ro, en }
  tags text[] not null default '{}',
  good_for text[] not null default '{}',         -- personas: family|kids|romantic|rainy-day|culture|adventure|relax|evening

  -- location & practical data
  lat double precision not null,
  lng double precision not null,
  distance_km numeric not null default 0,
  drive_minutes int not null default 0,
  address text,
  phone text,
  website text,
  opening_hours text,
  image text,

  -- curation
  quality_score int not null default 0,          -- 0..100, deterministic (completeness/prominence)
  status text not null default 'pending',        -- 'pending' | 'approved' | 'rejected'
  pinned boolean not null default false,         -- admin "fixat în top"
  sort_order int not null default 0,

  payload jsonb not null default '{}'::jsonb,    -- raw source tags, for future enrichment
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists discovered_places_source_ref_key
  on discovered_places (property_id, source_ref) where source_ref is not null;
create index if not exists discovered_places_status_idx on discovered_places (status, category);

-- ============================================================================
-- Scan log: every discovery run (manual or scheduled), for the admin
-- notification flow ("3 restaurante noi, 2 evenimente").
-- ============================================================================

create table if not exists discovery_scans (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  trigger text not null default 'manual',        -- 'manual' | 'scheduled' | 'onboarding'
  radius_km numeric not null,
  categories text[] not null default '{}',
  status text not null default 'completed',      -- 'completed' | 'failed'
  found_count int not null default 0,
  new_count int not null default 0,
  message text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- RLS — the public site reads only approved content; every mutation goes
-- through admin. `drop policy if exists` before each `create policy` keeps
-- the whole block re-runnable (Postgres has no CREATE POLICY IF NOT EXISTS).
-- ============================================================================

alter table discovered_places enable row level security;
alter table discovery_scans enable row level security;

drop policy if exists "public read approved places" on discovered_places;
create policy "public read approved places" on discovered_places
  for select using (status = 'approved');

drop policy if exists "admin read all places" on discovered_places;
create policy "admin read all places" on discovered_places
  for select using (is_admin());

drop policy if exists "admin insert places" on discovered_places;
create policy "admin insert places" on discovered_places
  for insert with check (is_admin());

drop policy if exists "admin update places" on discovered_places;
create policy "admin update places" on discovered_places
  for update using (is_admin());

drop policy if exists "admin delete places" on discovered_places;
create policy "admin delete places" on discovered_places
  for delete using (is_admin());

drop policy if exists "admin read scans" on discovery_scans;
create policy "admin read scans" on discovery_scans
  for select using (is_admin());

drop policy if exists "admin insert scans" on discovery_scans;
create policy "admin insert scans" on discovery_scans
  for insert with check (is_admin());
