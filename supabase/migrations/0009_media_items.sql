-- Generalizes the Gallery module's storage table into a polymorphic
-- media_items table (owner_type + owner_id), so the exact same upload/
-- manage system now serves both the site Gallery (owner_type='gallery',
-- owner_id null) and per-room image sets (owner_type='room',
-- owner_id=rooms.id) without any duplicated schema or code. Idempotent
-- (safe to re-run): renames gallery_images once if it still exists, then
-- every other step is a plain "if not exists"/"or replace".

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'gallery_images')
     and not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'media_items') then
    alter table gallery_images rename to media_items;
  end if;
end $$;

create table if not exists media_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
  owner_type text not null default 'gallery',
  owner_id uuid,
  url text not null,
  storage_path text,
  title jsonb not null default '{}'::jsonb,
  alt jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  width int,
  height int,
  size_bytes int,
  created_at timestamptz not null default now()
);

alter table media_items add column if not exists owner_type text not null default 'gallery';
alter table media_items add column if not exists owner_id uuid;

-- Rows that pre-date owner_type (the original gallery_images table) are
-- the site gallery by definition.
update media_items set owner_type = 'gallery' where owner_type is null;

drop index if exists gallery_images_sort_idx;
create index if not exists media_items_owner_idx on media_items (owner_type, owner_id, sort_order);

alter table media_items enable row level security;

drop policy if exists "public read gallery_images" on media_items;
drop policy if exists "admin manage gallery_images" on media_items;

drop policy if exists "public read media_items" on media_items;
create policy "public read media_items" on media_items for select using (true);

drop policy if exists "admin manage media_items" on media_items;
create policy "admin manage media_items" on media_items for all using (is_admin()) with check (is_admin());

-- The "gallery" Storage bucket now holds both site-gallery and room
-- images (under gallery/... and rooms/<roomId>/... path prefixes
-- respectively) — already public-read from migration 0008, no change
-- needed there.
