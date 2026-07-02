import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const sendgridApiKey = process.env.SENDGRID_API_KEY;
// reservations@baecodigital.ro is the recommended sender once the
// baecodigital.ro domain is verified in Resend — keeps guest-facing
// booking mail visually distinct from the general contact@ address.
const fromEmail = process.env.EMAIL_FROM ?? "reservations@baecodigital.ro";
// Resend accepts (and prefers) a display name; SendGrid's `from.email`
// field must be a bare address, so each provider call formats it itself.
const fromDisplayName = process.env.EMAIL_FROM_NAME ?? "Baeco Hospitality";

/**
 * Email adapter. Tries Resend, then SendGrid, then falls back to logging
 * the message (mock mode) so booking flows never fail in dev/demo.
 * SMTP can be added the same way via nodemailer if preferred.
 *
 * Every non-mock failure is logged here (not just left for the caller to
 * notice a `sent:false`) — this is the only place that sees the actual
 * provider response body, so it's the only place that CAN log it clearly.
 */
export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean; provider: string }> {
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `${fromDisplayName} <${fromEmail}>`, to: message.to, subject: message.subject, html: message.html }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "<no body>");
        console.error(`[email:resend] send failed (${res.status}) to=${message.to} subject="${message.subject}": ${body}`);
      }
      return { sent: res.ok, provider: "resend" };
    } catch (err) {
      console.error(`[email:resend] request threw to=${message.to} subject="${message.subject}":`, err);
      return { sent: false, provider: "resend" };
    }
  }

  if (sendgridApiKey) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${sendgridApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: message.to }] }],
          from: { email: fromEmail, name: fromDisplayName },
          subject: message.subject,
          content: [{ type: "text/html", value: message.html }],
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "<no body>");
        console.error(`[email:sendgrid] send failed (${res.status}) to=${message.to} subject="${message.subject}": ${body}`);
      }
      return { sent: res.ok, provider: "sendgrid" };
    } catch (err) {
      console.error(`[email:sendgrid] request threw to=${message.to} subject="${message.subject}":`, err);
      return { sent: false, provider: "sendgrid" };
    }
  }

  console.info(`[email:mock] to=${message.to} subject="${message.subject}"`);
  return { sent: true, provider: "mock" };
}
