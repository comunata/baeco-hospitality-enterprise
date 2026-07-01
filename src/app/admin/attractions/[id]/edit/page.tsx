import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAttractionById } from "@/lib/data/explore";
import { AttractionForm } from "../../../explore/AttractionForm";

export default async function EditAttractionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attraction = await getAttractionById(id);
  if (!attraction) notFound();

  return (
    <div>
      <AdminPageHeader title={`Editează: ${attraction.name.ro}`} />
      <AttractionForm attraction={attraction} backHref="/admin/attractions" />
    </div>
  );
}
