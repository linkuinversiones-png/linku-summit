import type { Locale } from '@/lib/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://linkusummit.com';

type TicketRow = {
  qrDataUrl: string;
  tierName: string;
  qrCodeShort: string;
};

type Strings = {
  subject: (orderRef: string) => string;
  greeting: (name: string) => string;
  paid: (totalCop: string) => string;
  ticketsTitle: string;
  ticketsDesc: string;
  saveQrTip: string;
  manageHere: string;
  manageCta: string;
  footer: string;
};

const STRINGS: Record<Locale, Strings> = {
  es: {
    subject: (ref) => `Tu entrada al LinkU Summit 2026 · ${ref}`,
    greeting: (n) => `Hola ${n},`,
    paid: (t) => `Tu pago de <strong>${t}</strong> fue confirmado. Estás dentro.`,
    ticketsTitle: 'Tu(s) boleta(s)',
    ticketsDesc:
      'Cada QR es único e intransferible. Llévalo en tu teléfono o impreso el día del summit.',
    saveQrTip:
      'Tip: guarda este email o haz captura. El QR también está disponible en tu cuenta.',
    manageHere: 'Tu cuenta',
    manageCta: 'Ver mis boletas',
    footer:
      'LinkU Summit 2026 · Octubre 2026 · Medellín · linkusummit.com'
  },
  en: {
    subject: (ref) => `Your LinkU Summit 2026 ticket · ${ref}`,
    greeting: (n) => `Hi ${n},`,
    paid: (t) => `Your payment of <strong>${t}</strong> was confirmed. You're in.`,
    ticketsTitle: 'Your ticket(s)',
    ticketsDesc:
      'Each QR is unique and non-transferable. Bring it on your phone or printed on the day.',
    saveQrTip:
      'Tip: save this email or take a screenshot. The QR is also in your account.',
    manageHere: 'Your account',
    manageCta: 'View my tickets',
    footer: 'LinkU Summit 2026 · October 2026 · Medellín · linkusummit.com'
  }
};

export function ticketConfirmedEmail(input: {
  locale: Locale;
  attendeeName: string;
  orderRef: string;
  totalCop: string;
  tickets: TicketRow[];
}): { subject: string; html: string } {
  const t = STRINGS[input.locale];
  const meUrl = `${SITE_URL}${input.locale === 'es' ? '' : '/' + input.locale}/me`;

  const ticketsHtml = input.tickets
    .map(
      (tk) => `
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#0A1428;border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin:0 0 16px 0;">
        <tr>
          <td style="padding:18px;text-align:center;">
            <p style="margin:0 0 8px 0;color:#FF5A5F;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">${tk.tierName}</p>
            <img src="${tk.qrDataUrl}" alt="QR" width="220" height="220" style="display:block;width:220px;height:220px;margin:8px auto 8px;border-radius:8px;background:#fff;"/>
            <p style="margin:8px 0 0 0;color:#8A9BB0;font-size:11px;font-family:'Courier New',monospace;">${tk.qrCodeShort}</p>
          </td>
        </tr>
      </table>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="${input.locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LinkU Summit 2026</title>
</head>
<body style="margin:0;padding:0;background:#050814;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E8EEF5;">
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#050814;padding:24px 0;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:#050814;">
        <tr><td style="padding:0 24px 24px 24px;">
          <p style="margin:0;color:#E8EEF5;font-size:18px;font-weight:700;letter-spacing:-0.02em;">
            LINKU <span style="color:#FF5A5F;">SUMMIT</span>
          </p>
          <p style="margin:4px 0 0 0;color:#FF5A5F;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;">
            By LinkU Ventures
          </p>
        </td></tr>

        <tr><td style="padding:0 24px 16px 24px;">
          <h1 style="margin:0;color:#E8EEF5;font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;">
            ${t.greeting(input.attendeeName)}
          </h1>
          <p style="margin:12px 0 0 0;color:#8A9BB0;font-size:15px;line-height:1.6;">
            ${t.paid(input.totalCop)}
          </p>
          <p style="margin:8px 0 0 0;color:#5A6B82;font-size:12px;">
            Ref: <code>${input.orderRef}</code>
          </p>
        </td></tr>

        <tr><td style="padding:8px 24px 0 24px;">
          <h2 style="margin:0 0 6px 0;color:#E8EEF5;font-size:14px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
            ${t.ticketsTitle}
          </h2>
          <p style="margin:0 0 16px 0;color:#8A9BB0;font-size:13px;line-height:1.5;">
            ${t.ticketsDesc}
          </p>
          ${ticketsHtml}
          <p style="margin:0 0 24px 0;color:#5A6B82;font-size:12px;line-height:1.5;">
            ${t.saveQrTip}
          </p>
        </td></tr>

        <tr><td style="padding:0 24px 32px 24px;">
          <a href="${meUrl}" style="display:inline-block;padding:12px 22px;background:#FF5A5F;color:#fff;font-weight:600;font-size:14px;text-decoration:none;border-radius:10px;">
            ${t.manageCta} →
          </a>
        </td></tr>

        <tr><td style="padding:16px 24px 24px 24px;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="margin:0;color:#5A6B82;font-size:11px;line-height:1.6;">
            ${t.footer}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: t.subject(input.orderRef), html };
}
