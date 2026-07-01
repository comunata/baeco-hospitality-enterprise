import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AttractionForm } from "../../explore/AttractionForm";

export default function NewRestaurantPage() {
  return (
    <div>
      <AdminPageHeader title="Restaurant nou" />
      <AttractionForm backHref="/admin/restaurants" defaultCategory="restaurant" />
    </div>
  );
}
