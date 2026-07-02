import { getServerDictionary } from "@/lib/i18n/server";
import { requireAdminRole } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";

const roles = [
  {
    key: "SUPER_ADMIN",
    label: "Super Admin",
    permissions: "Acces complet: toate proprietățile, rezervări, camere, galerii, tarife, servicii, utilizatori, roluri, AI, emailuri, integrări, backup, ștergere, configurare sistem.",
  },
  {
    key: "DEMO_ADMIN",
    label: "Demo Admin",
    permissions: "Vizualizare completă (toate modulele) pentru prezentări — nicio scriere permisă. Orice încercare de salvare/ștergere/upload este blocată.",
  },
  {
    key: "HOTEL_ADMIN",
    label: "Hotel Admin",
    permissions: "Administrare completă a propriei proprietăți: camere, rezervări, tarife, galerie, servicii, disponibilitate, conținut, emailuri, AI.",
  },
];

export default async function AdminRolesPage() {
  await requireAdminRole("SUPER_ADMIN");
  const { dict } = await getServerDictionary();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.roles}
        description="Modelul oficial de roluri Baeco Hospitality. Rolurile sunt fixe (nu pot fi create/editate) — atribuirea lor per utilizator se face din Utilizatori."
      />
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
