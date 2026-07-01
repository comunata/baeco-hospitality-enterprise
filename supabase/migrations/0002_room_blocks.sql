-- Etapa 2: Admin Comercial — availability blocks (maintenance / manual closures).
-- These are date ranges where a room is not bookable, independent of actual
-- bookings (e.g. renovation, deep cleaning, owner use).

create table if not exists room_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table room_blocks enable row level security;

create policy "admin manage room_blocks" on room_blocks for all using (is_admin()) with check (is_admin());

comment on table room_blocks is 'Manual availability blocks set from the admin calendar (maintenance, closures), separate from guest bookings.';
