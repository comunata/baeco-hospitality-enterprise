import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const fromAddress = process.env.EMAIL_FROM ?? "rezervari@baeco-hospitality.example.com";

/**
 * Email adapter. Tries Resend, then SendGrid, then falls back to logging
 * the message (mock mode) so booking flows never fail in dev/demo.
 * SMTP can be added the same way via nodemailer if preferred.
 */
export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean; provider: string }> {
  if (resendApiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddress, to: message.to, subject: message.subject, html: message.html }),
    });
    return { sent: res.ok, provider: "resend" };
  }

  if (sendgridApiKey) {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${sendgridApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: message.to }] }],
        from: { email: fromAddress },
        subject: message.subject,
        content: [{ type: "text/html", value: message.html }],
      }),
    });
    return { sent: res.ok, provider: "sendgrid" };
  }

  console.info(`[email:mock] to=${message.to} subject="${message.subject}"`);
  return { sent: true, provider: "mock" };
}
