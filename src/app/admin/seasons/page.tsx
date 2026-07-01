import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { getSeasons } from "@/lib/data/seasons";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatDate } from "@/lib/utils";
import { DeleteSeasonButton } from "./DeleteSeasonButton";

export default async function AdminSeasonsPage() {
  const { dict } = await getServerDictionary();
  const seasons = await getSeasons();

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.nav.seasons}
        action={
          <Link href="/admin/seasons/new" className="rounded-sm bg-champagne px-4 py-2 text-sm font-medium text-midnight hover:opacity-90">
            + Sezon nou
          </Link>
        }
      />
      <AdminTable
        emptyLabel="Niciun sezon configurat."
        keyField={(s) => s.id}
        rows={seasons}
        columns={[
          { header: "Sezon", render: (s) => s.name.ro },
          { header: "Interval", render: (s) => `${formatDate(s.startDate)} – ${formatDate(s.endDate)}` },
          { header: "Multiplicator", render: (s) => `×${s.multiplier}` },
          { header: "Multiplicator weekend", render: (s) => `×${s.weekendMultiplier}` },
          { header: "Minim nopți", render: (s) => String(s.minNights ?? 1) },
          {
            header: "Acțiuni",
            render: (s) => (
              <div className="flex items-center gap-3">
                <Link href={`/admin/seasons/${s.id}/edit`} className="text-xs uppercase tracking-wider text-champagne hover:opacity-80">
                  Editează
                </Link>
                <DeleteSeasonButton id={s.id} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
