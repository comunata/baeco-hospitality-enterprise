import { getServerDictionary } from "@/lib/i18n/server";
import { getRooms } from "@/lib/data/rooms";
import { FavoritesClient } from "@/components/portal/FavoritesClient";

export default async function PortalFavoritesPage() {
  const { dict } = await getServerDictionary();
  const rooms = await getRooms();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-ivory">{dict.portal.favorites}</h1>
      <FavoritesClient rooms={rooms} dict={dict} />
    </div>
  );
}
