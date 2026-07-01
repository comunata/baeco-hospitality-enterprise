import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RoomForm } from "../RoomForm";

export default function NewRoomPage() {
  return (
    <div>
      <AdminPageHeader title="Cameră nouă" />
      <RoomForm />
    </div>
  );
}
