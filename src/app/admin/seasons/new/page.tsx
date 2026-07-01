import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SeasonForm } from "../SeasonForm";

export default function NewSeasonPage() {
  return (
    <div>
      <AdminPageHeader title="Sezon nou" />
      <SeasonForm />
    </div>
  );
}
