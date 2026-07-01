import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAttractionById } from "@/lib/data/explore";
import { AttractionForm } from "../../../explore/AttractionForm";

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await getAttractionById(id);
  if (!restaurant) notFound();

  return (
    <div>
      <AdminPageHeader title={`Editează: ${restaurant.name.ro}`} />
      <AttractionForm attraction={restaurant} backHref="/admin/restaurants" />
    </div>
  );
}
