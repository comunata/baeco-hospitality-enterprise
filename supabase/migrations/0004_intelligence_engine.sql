-- Hospitality Intelligence Engine — discovery + curated area knowledge.
--
-- The engine discovers places around the property (OpenStreetMap in
-- production), classifies them into the BD taxonomy, scores them, and stores
-- them here for the admin approval workflow. Approved rows become the single
-- source of truth for Explore, AI Concierge, AI Local Guide, AI Stay Planner
-- and every future agent — the AI layer never invents places, it only reads
-- what the administrator approved.

-- ============================================================================
-- Property profile: extend the existing `properties` table with the fields
-- the discovery engine needs (2-minute onboarding: name, address, GPS,
-- category — everything else is derived or discovered).
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
-- RLS — same model as the rest of the schema: the public site reads only
-- approved content; every mutation goes through admin.
-- ============================================================================

alter table discovered_places enable row level security;
alter table discovery_scans enable row level security;

create policy "public read approved places" on discovered_places
  for select using (status = 'approved');
create policy "admin read all places" on discovered_places
  for select using (is_admin());
create policy "admin insert places" on discovered_places
  for insert with check (is_admin());
create policy "admin update places" on discovered_places
  for update using (is_admin());
create policy "admin delete places" on discovered_places
  for delete using (is_admin());

create policy "admin read scans" on discovery_scans
  for select using (is_admin());
create policy "admin insert scans" on discovery_scans
  for insert with check (is_admin());
