import { getServerDictionary } from "@/lib/i18n/server";
import { PortalAiChat } from "@/components/portal/PortalAiChat";

export default async function PortalAiPage() {
  const { locale, dict } = await getServerDictionary();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-ivory">{dict.portal.aiConversations}</h1>
      <PortalAiChat locale={locale} dict={dict} />
    </div>
  );
}
