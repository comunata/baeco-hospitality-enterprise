import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AttractionForm } from "../../explore/AttractionForm";

export default function NewAttractionPage() {
  return (
    <div>
      <AdminPageHeader title="Atracție nouă" />
      <AttractionForm backHref="/admin/attractions" defaultCategory="attraction" />
    </div>
  );
}
