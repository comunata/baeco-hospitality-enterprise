import { getServerDictionary } from "@/lib/i18n/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HotelManagerChat } from "@/components/admin/HotelManagerChat";

export default async function AiHotelManagerPage() {
  const { locale, dict } = await getServerDictionary();

  return (
    <div>
      <AdminPageHeader title={dict.ai.hotelManager.title} description={dict.ai.hotelManager.subtitle} />
      <HotelManagerChat locale={locale} dict={dict} />
    </div>
  );
}
