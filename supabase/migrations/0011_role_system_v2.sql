-- New official admin role model: SUPER_ADMIN, DEMO_ADMIN, HOTEL_ADMIN.
-- Replaces the old owner/manager/staff three-tier operational hierarchy —
-- that distinction never mattered in practice (this is single-tenant
-- software, one property, no per-role feature split beyond the allow-list
-- in assertAdminRole/requireAdminRole) and is superseded by a cleaner
-- three-role model: one system owner, unlimited sales-demo accounts that
-- can browse but never write, and the paying customer's own operator
-- account. Idempotent — safe to re-run.

do $$
begin
  insert into roles (key, label, permissions)
  values
    ('SUPER_ADMIN', 'Super Admin', '{}'::jsonb),
    ('DEMO_ADMIN', 'Demo Admin', '{}'::jsonb),
    ('HOTEL_ADMIN', 'Hotel Admin', '{}'::jsonb)
  on conflict (key) do nothing;

  -- Reassign any user still on the old roles: former owners become the new
  -- SUPER_ADMIN (there's exactly one owner account today — the actual
  -- system operator); former manager/staff collapse into HOTEL_ADMIN,
  -- since that distinction is gone.
  update users u
  set role_id = (select id from roles where key = 'SUPER_ADMIN')
  where u.role_id = (select id from roles where key = 'owner');

  update users u
  set role_id = (select id from roles where key = 'HOTEL_ADMIN')
  where u.role_id in (select id from roles where key in ('manager', 'staff'));

  -- Old role rows are now unreferenced (every user has been moved off
  -- them above) — remove them so /admin/roles doesn't show stale entries.
  delete from roles where key in ('owner', 'manager', 'staff');
end $$;

-- Deactivating a Demo Admin account must actually block access even if
-- their Supabase Auth session cookie is still valid — getAdminSession()
-- checks this flag on every request.
alter table users add column if not exists active boolean not null default true;

-- "vedea ultima autentificare" in the Super Admin user management screen.
alter table users add column if not exists last_login_at timestamptz;

-- RLS gate: keep in sync with the new role keys. Still moot for admin
-- writes today (they go through the service-role client, which bypasses
-- RLS entirely — see the note in lib/data/rooms.ts), but this keeps the
-- policy correct for whenever that Etapa-6 RLS-scoped-client switch happens.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from users u
    join roles r on r.id = u.role_id
    where u.id = auth.uid()
      and r.key in ('SUPER_ADMIN', 'HOTEL_ADMIN')
      and u.active
  );
$$;
