import { getServerDictionary } from "@/lib/i18n/server";
import { getKnowledgeBase } from "@/lib/data/content";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";

export default async function AdminKnowledgeBasePage() {
  const { dict } = await getServerDictionary();
  const items = await getKnowledgeBase();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.knowledgeBase}
        description="Fiecare intrare este folosită de AI Concierge și AI Local Guide pentru a răspunde fără să inventeze informații."
      />
      <AdminTable
        emptyLabel="Nicio intrare în baza de cunoștințe."
        keyField={(k) => k.id}
        rows={items}
        columns={[
          { header: "Categorie", render: (k) => <span className="capitalize">{k.category}</span> },
          { header: "Întrebare", render: (k) => k.question.ro },
          { header: "Răspuns", render: (k) => <span className="line-clamp-2 max-w-md">{k.answer.ro}</span> },
          { header: "Cuvinte cheie", render: (k) => k.keywords.join(", ") },
        ]}
      />
    </div>
  );
}
