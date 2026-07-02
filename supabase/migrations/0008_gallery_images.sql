-- Commercial-grade Gallery module: structured image records (title/alt/
-- primary/order/dimensions) instead of the admin hand-editing a flat list
-- of URLs. Public Storage bucket holds the actual files; this table is the
-- metadata layer the new admin UI manages. Idempotent (safe to re-run).

create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties (id) on delete cascade,
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

create index if not exists gallery_images_sort_idx on gallery_images (sort_order);

alter table gallery_images enable row level security;

drop policy if exists "public read gallery_images" on gallery_images;
create policy "public read gallery_images" on gallery_images for select using (true);

drop policy if exists "admin manage gallery_images" on gallery_images;
create policy "admin manage gallery_images" on gallery_images for all using (is_admin()) with check (is_admin());

-- Storage bucket for uploaded gallery files. All admin writes go through
-- the service-role client (see lib/supabase/admin.ts), which bypasses
-- Storage RLS entirely, so only a public-read policy is needed here.
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "public read gallery bucket" on storage.objects;
create policy "public read gallery bucket" on storage.objects
  for select using (bucket_id = 'gallery');
