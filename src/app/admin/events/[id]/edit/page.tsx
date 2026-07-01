import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getLocalEventById } from "@/lib/data/explore";
import { EventForm } from "../../../explore/EventForm";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getLocalEventById(id);
  if (!event) notFound();

  return (
    <div>
      <AdminPageHeader title={`Editează: ${event.name.ro}`} />
      <EventForm event={event} />
    </div>
  );
}
