import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EventForm } from "../../explore/EventForm";

export default function NewEventPage() {
  return (
    <div>
      <AdminPageHeader title="Eveniment nou" />
      <EventForm />
    </div>
  );
}
