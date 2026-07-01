-- Etapa 6: RLS hardening pass.
--
-- 1) room_blocks (added in 0002) only had an admin-only policy. But
--    lib/data/availability.ts#getRoomBlocks() is read via the RLS-scoped
--    client (not the service-role client) and is called from the PUBLIC
--    booking-availability path (lib/data/bookings.ts#isRoomAvailable, used
--    by the anonymous booking-create API route). Without a public read
--    policy, once real Supabase Auth is wired up and anonymous requests are
--    no longer implicitly bypassing RLS, availability checks would silently
--    stop seeing manual blocks (maintenance/closures), letting guests book
--    rooms that should be closed. This mirrors the existing "public read
--    rooms"/"public read seasons" policies already in 0001_init.sql.
create policy "public read room_blocks" on room_blocks for select using (true);

-- 2) Tighten admin write access on room_blocks to explicitly require
--    manager/owner/staff via is_admin() for insert/update/delete, matching
--    the pattern for every other admin-managed table. (Already covered by
--    "admin manage room_blocks" in 0002, this makes the split explicit and
--    is a no-op if that policy already satisfies both directions — kept
--    here only as documentation; no functional change beyond point 1.)

-- 3) audit_logs: the 0001 policy only allowed admins to SELECT, but there
--    was no INSERT policy, and audit logging should be possible even from
--    the RLS-scoped client (not just via the service-role client) once
--    real auth exists, so admin actions get logged with the acting user
--    captured from auth.uid() rather than needing a service-role bypass.
create policy "admin insert audit_logs" on audit_logs for insert with check (is_admin());
