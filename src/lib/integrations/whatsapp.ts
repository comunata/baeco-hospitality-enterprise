import { siteConfig } from "@/config/site";

/** Builds a wa.me deep link. Upgradeable to the WhatsApp Business Cloud API
 * (template messages) by setting WHATSAPP_BUSINESS_TOKEN + WHATSAPP_PHONE_ID. */
export function buildWhatsappLink(message: string, phone: string = siteConfig.contact.whatsapp): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

const whatsappToken = process.env.WHATSAPP_BUSINESS_TOKEN;
const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;

export async function sendWhatsappTemplate(to: string, body: string): Promise<{ sent: boolean; provider: string }> {
  if (whatsappToken && whatsappPhoneId) {
    const res = await fetch(`https://graph.facebook.com/v19.0/${whatsappPhoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${whatsappToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
    });
    return { sent: res.ok, provider: "whatsapp-cloud-api" };
  }
  console.info(`[whatsapp:mock] to=${to} body="${body}"`);
  return { sent: true, provider: "mock" };
}
