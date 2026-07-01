import { getServerDictionary } from "@/lib/i18n/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { requireAdminRole } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role_id: string | null;
}

export default async function AdminUsersPage() {
  // Only owner/manager may view or manage staff accounts and roles —
  // staff-level admins should not see the full user/role list.
  await requireAdminRole("owner", "manager");
  const { dict } = await getServerDictionary();

  let users: UserRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.from("users").select("id, email, full_name, role_id");
      users = (data as UserRow[]) ?? [];
    }
  }

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.users} description="Populat din tabelul public.users, sincronizat cu Supabase Auth." />
      <AdminTable
        emptyLabel="Conectează Supabase pentru a gestiona utilizatorii (Admin, Manager, Staff, Clienți)."
        keyField={(u) => u.id}
        rows={users}
        columns={[
          { header: "Email", render: (u) => u.email },
          { header: "Nume", render: (u) => u.full_name ?? "—" },
          { header: "Rol", render: (u) => u.role_id ?? "—" },
        ]}
      />
    </div>
  );
}
