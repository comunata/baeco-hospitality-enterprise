import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getServiceById } from "@/lib/data/services";
import { ServiceForm } from "../../ServiceForm";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) notFound();

  return (
    <div>
      <AdminPageHeader title={`Editează: ${service.name.ro}`} />
      <ServiceForm service={service} />
    </div>
  );
}
