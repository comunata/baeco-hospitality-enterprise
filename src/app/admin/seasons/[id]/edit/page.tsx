import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getSeasonById } from "@/lib/data/seasons";
import { SeasonForm } from "../../SeasonForm";

export default async function EditSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const season = await getSeasonById(id);
  if (!season) notFound();

  return (
    <div>
      <AdminPageHeader title={`Editează: ${season.name.ro}`} />
      <SeasonForm season={season} />
    </div>
  );
}
