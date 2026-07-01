import { getServerDictionary } from "@/lib/i18n/server";
import { requireAdminRole } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";

const roles = [
  { key: "owner", label: "Owner", permissions: "Acces complet la toate modulele." },
  { key: "manager", label: "Manager", permissions: "Rezervări, conținut, setări." },
  { key: "staff", label: "Staff", permissions: "Rezervări și calendar." },
  { key: "customer", label: "Customer", permissions: "Acces doar la Portal Client." },
];

export default async function AdminRolesPage() {
  await requireAdminRole("owner", "manager");
  const { dict } = await getServerDictionary();

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.roles} description="Definite în supabase/migrations/0001_init.sql (tabelul roles), aplicate prin RLS." />
      <AdminTable
        emptyLabel="Niciun rol definit."
        keyField={(r) => r.key}
        rows={roles}
        columns={[
          { header: "Rol", render: (r) => r.label },
          { header: "Permisiuni", render: (r) => r.permissions },
        ]}
      />
    </div>
  );
}
