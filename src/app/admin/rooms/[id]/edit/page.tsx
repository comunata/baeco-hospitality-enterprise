import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getRoomById } from "@/lib/data/rooms";
import { RoomForm } from "../../RoomForm";

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoomById(id);
  if (!room) notFound();

  return (
    <div>
      <AdminPageHeader title={`Editează: ${room.name.ro}`} />
      <RoomForm room={room} />
    </div>
  );
}
