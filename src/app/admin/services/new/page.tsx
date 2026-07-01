import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "../ServiceForm";

export default function NewServicePage() {
  return (
    <div>
      <AdminPageHeader title="Serviciu nou" />
      <ServiceForm />
    </div>
  );
}
