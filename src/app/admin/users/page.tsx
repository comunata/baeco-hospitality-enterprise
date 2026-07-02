import { getServerDictionary } from "@/lib/i18n/server";
import { requireAdminRole } from "@/lib/admin/session";
import { getAdminUsers } from "@/lib/data/users";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserManagementClient } from "@/components/admin/users/UserManagementClient";

export default async function AdminUsersPage() {
  // Only Super Admin manages accounts/roles.
  await requireAdminRole("SUPER_ADMIN");
  const { dict } = await getServerDictionary();
  const users = await getAdminUsers();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.users}
        description="Creează conturi Demo Admin (nelimitate, pentru prezentări — scriere blocată complet) sau Hotel Admin. Poți schimba rolul, dezactiva un cont sau reseta parola oricând."
      />
      <UserManagementClient users={users} />
    </div>
  );
}
