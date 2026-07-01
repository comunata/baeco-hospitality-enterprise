import { getServerDictionary } from "@/lib/i18n/server";
import { getReviews } from "@/lib/data/content";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatDate } from "@/lib/utils";

export default async function AdminReviewsPage() {
  const { dict } = await getServerDictionary();
  const reviews = await getReviews();

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.reviews} />
      <AdminTable
        emptyLabel="Niciun review încă."
        keyField={(r) => r.id}
        rows={reviews}
        columns={[
          { header: "Oaspete", render: (r) => r.guestName },
          { header: "Rating", render: (r) => "★".repeat(r.rating) },
          { header: "Comentariu", render: (r) => <span className="line-clamp-2 max-w-md">{r.comment}</span> },
          { header: "Cameră", render: (r) => r.roomName ?? "—" },
          { header: "Sursă", render: (r) => <span className="capitalize">{r.source}</span> },
          { header: "Data", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </div>
  );
}
