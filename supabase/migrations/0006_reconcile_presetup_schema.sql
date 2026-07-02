-- Reconciles a pre-existing simplified schema (rooms/services/ai_knowledge
-- created outside these migrations, with TEXT names instead of localized
-- jsonb, no slugs, etc.) with the shapes the application expects.
--
-- On the original live database this ran BEFORE 0001 (0001's policies need
-- rooms.active to exist); on a fresh database it runs after 0001 and no-ops.
-- Every step is guarded by column existence/type checks, so both orders and
-- re-runs are safe.

-- ============================ properties ============================
alter table properties add column if not exists legal_name text;
alter table properties add column if not exists lat double precision;
alter table properties add column if not exists lng double precision;
alter table properties add column if not exists whatsapp text;
alter table properties add column if not exists check_in_time text default '14:00';
alter table properties add column if not exists check_out_time text default '11:00';

-- ============================== rooms ==============================
-- name/description: text -> localized jsonb {ro,en}
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='rooms' and column_name='name' and data_type='text') then
    alter table rooms alter column name type jsonb using jsonb_build_object('ro', coalesce(name,''), 'en', coalesce(name,''));
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='rooms' and column_name='description' and data_type='text') then
    alter table rooms alter column description type jsonb using jsonb_build_object('ro', coalesce(description,''), 'en', coalesce(description,''));
    alter table rooms alter column description set default '{}'::jsonb;
  end if;
end $$;

alter table rooms add column if not exists slug text;
alter table rooms add column if not exists gallery text[] not null default '{}';
alter table rooms add column if not exists cover_image text;
alter table rooms add column if not exists size_sqm numeric;
alter table rooms add column if not exists beds text[] not null default '{}';
alter table rooms add column if not exists amenities text[] not null default '{}';
alter table rooms add column if not exists rules jsonb not null default '{}'::jsonb;
alter table rooms add column if not exists included_service_ids uuid[] not null default '{}';
alter table rooms add column if not exists extra_service_ids uuid[] not null default '{}';
alter table rooms add column if not exists virtual_tour_url text;
alter table rooms add column if not exists active boolean not null default true;
alter table rooms add column if not exists total_units int not null default 1;

-- slug backfill from the RO name (unique-ified with a short id suffix on collision)
update rooms set slug = trim(both '-' from regexp_replace(lower(coalesce(name->>'ro', 'camera')), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';
update rooms r set slug = r.slug || '-' || left(r.id::text, 4)
where exists (select 1 from rooms o where o.slug = r.slug and o.id < r.id);
create unique index if not exists rooms_slug_key on rooms (slug);

-- active backfill from the legacy status column, when present
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='rooms' and column_name='status') then
    update rooms set active = (status is distinct from 'unavailable');
  end if;
end $$;

-- placeholder images so public pages render until the admin uploads real ones
update rooms set cover_image = '/images/rooms/deluxe-garden-1.webp' where cover_image is null or cover_image = '';
update rooms set gallery = array[cover_image] where gallery = '{}';

-- ============================= services =============================
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='services' and column_name='name' and data_type='text') then
    alter table services alter column name type jsonb using jsonb_build_object('ro', coalesce(name,''), 'en', coalesce(name,''));
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='services' and column_name='description' and data_type='text') then
    alter table services alter column description type jsonb using jsonb_build_object('ro', coalesce(description,''), 'en', coalesce(description,''));
    alter table services alter column description set default '{}'::jsonb;
  end if;
end $$;

alter table services add column if not exists slug text;
alter table services add column if not exists charge_type text not null default 'per_booking';
alter table services add column if not exists available_from date;
alter table services add column if not exists available_to date;
update services set slug = trim(both '-' from regexp_replace(lower(coalesce(name->>'ro','serviciu')), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';
create unique index if not exists services_slug_key on services (slug);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'services_charge_type_check') then
    alter table services add constraint services_charge_type_check
      check (charge_type in ('per_person', 'per_room', 'per_booking', 'per_night'));
  end if;
end $$;

-- ============================ ai_knowledge ============================
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='ai_knowledge' and column_name='question' and data_type='text') then
    alter table ai_knowledge alter column question type jsonb using jsonb_build_object('ro', coalesce(question,''), 'en', coalesce(question,''));
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='ai_knowledge' and column_name='answer' and data_type='text') then
    alter table ai_knowledge alter column answer type jsonb using jsonb_build_object('ro', coalesce(answer,''), 'en', coalesce(answer,''));
  end if;
end $$;
alter table ai_knowledge add column if not exists keywords text[] not null default '{}';
alter table ai_knowledge add column if not exists updated_at timestamptz not null default now();
