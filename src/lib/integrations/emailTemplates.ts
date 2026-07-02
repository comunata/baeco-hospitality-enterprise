import "server-only";

export interface EmailDetailRow {
  label: string;
  value: string;
}

/**
 * Shared HTML shell for every booking-related email (guest confirmation,
 * property notification, cancellation) — inline CSS only, since email
 * clients don't load external stylesheets. Table-based layout for
 * consistent rendering across Outlook/Gmail/Apple Mail.
 */
export function renderBookingEmailHtml(params: {
  propertyName: string;
  title: string;
  intro: string;
  bookingCode?: string;
  rows: EmailDetailRow[];
  total?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const { propertyName, title, intro, bookingCode, rows, total, ctaLabel, ctaUrl, footerNote } = params;

  const rowsHtml = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#9a9a9f;font-size:13px;">${r.label}</td>
          <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#f2efe9;font-size:13px;text-align:right;">${r.value}</td>
        </tr>`
    )
    .join("");

  const codeHtml = bookingCode
    ? `
      <div style="margin:24px 0;text-align:center;">
        <div style="display:inline-block;border:1px solid #d6b36a55;border-radius:4px;padding:14px 28px;background:#141416;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9a9a9f;">Cod rezervare</p>
          <p style="margin:0;font-size:22px;letter-spacing:3px;font-family:monospace;color:#d6b36a;font-weight:600;">${bookingCode}</p>
        </div>
      </div>`
    : "";

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `
      <div style="margin:28px 0;text-align:center;">
        <a href="${ctaUrl}" style="display:inline-block;background:#d6b36a;color:#141416;text-decoration:none;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;padding:14px 32px;border-radius:3px;">${ctaLabel}</a>
      </div>`
      : "";

  const totalHtml = total
    ? `
        <tr>
          <td style="padding:14px 0 0;color:#f2efe9;font-size:15px;font-weight:600;">Total</td>
          <td style="padding:14px 0 0;color:#d6b36a;font-size:18px;font-weight:600;text-align:right;">${total}</td>
        </tr>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0c0c0e;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0e;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1a1a1d;border:1px solid #2a2a2e;border-radius:6px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 8px;text-align:center;border-bottom:1px solid #2a2a2e;">
                <p style="margin:0 0 24px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d6b36a;">${propertyName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 0;">
                <h1 style="margin:0;font-size:22px;color:#f2efe9;font-weight:400;">${title}</h1>
                <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#c9c9cc;">${intro}</p>
                ${codeHtml}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${rowsHtml}
                  ${totalHtml}
                </table>
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 32px;border-top:1px solid #2a2a2e;">
                <p style="margin:0;font-size:11px;line-height:1.6;color:#71717a;">${footerNote ?? ""}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
