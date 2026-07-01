import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/integrations/email";
import { siteConfig } from "@/config/site";
import { checkRateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "contact-form");
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { name, email, message } = parsed.data;

  await sendEmail({
    to: siteConfig.contact.email,
    subject: `Mesaj nou de la ${name}`,
    html: `<p><strong>${name}</strong> (${email}) a scris:</p><p>${message.replace(/</g, "&lt;")}</p>`,
  });

  return NextResponse.json({ ok: true });
}
