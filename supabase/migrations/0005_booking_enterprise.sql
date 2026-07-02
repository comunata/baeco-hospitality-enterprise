-- Booking Engine Enterprise: real inventory, group bookings, online check-in.
-- Idempotent; safe to re-run.

-- Real per-room-type inventory. A "room" row is a room TYPE; total_units is
-- how many physical rooms of that type exist. Availability counts overlapping
-- active bookings against this number, so the same schema scales from a
-- single villa (1 unit) to a hotel with 40 doubles (40 units).
alter table rooms add column if not exists total_units int not null default 1;

-- Group bookings: one reservation flow can book several rooms; each room is
-- its own bookings row (statuses/check-ins stay per-room) linked by a shared
-- group code, which is also what the guest receives in the confirmation.
alter table bookings add column if not exists group_code text;
create index if not exists bookings_group_code_idx on bookings (group_code);

-- Online check-in (portal): timestamp + guest-declared arrival details.
alter table bookings add column if not exists checked_in_at timestamptz;
alter table bookings add column if not exists arrival_time text;
alter table bookings add column if not exists checkin_notes text;
