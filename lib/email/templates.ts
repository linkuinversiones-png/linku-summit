import type { Locale } from '@/lib/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.linkusummit.com';

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
  accountTitle: string;
  accountDesc: string;
  accountCta: string;
  footer: string;
};

const STRINGS: Record<Locale, Strings> = {
  es: {
    subject: (ref) => `Tu entrada al LinkU Capital Summit 2026 · ${ref}`,
    greeting: (n) => `Hola ${n},`,
    paid: (t) => `Tu pago de <strong>${t}</strong> fue confirmado. Estás dentro.`,
    ticketsTitle: 'Tu(s) boleta(s)',
    ticketsDesc:
      'Cada QR es único e intransferible. Llévalo en tu teléfono o impreso el día del summit.',
    saveQrTip:
      'Tu boleta está en este correo: el QR de arriba es tu entrada. Guárdalo o toma captura para mostrarlo el día del evento.',
    accountTitle: 'Haz seguimiento de tu entrada y agenda tus citas',
    accountDesc:
      'Para gestionar tu entrada y agendar tus reuniones 1:1, entra a tu cuenta en linkusummit.com. Inicia sesión solo con tu correo: te enviaremos un código de 6 dígitos para entrar (sin contraseñas).',
    accountCta: 'Entrar a mi cuenta',
    footer:
      'LinkU Capital Summit 2026 · 5 y 6 de octubre de 2026 · Country Club Medellín · linkusummit.com'
  },
  en: {
    subject: (ref) => `Your LinkU Capital Summit 2026 ticket · ${ref}`,
    greeting: (n) => `Hi ${n},`,
    paid: (t) => `Your payment of <strong>${t}</strong> was confirmed. You're in.`,
    ticketsTitle: 'Your ticket(s)',
    ticketsDesc:
      'Each QR is unique and non-transferable. Bring it on your phone or printed on the day.',
    saveQrTip:
      'Your ticket is in this email: the QR above is your entry. Save it or screenshot it to show on the event day.',
    accountTitle: 'Track your ticket and book your meetings',
    accountDesc:
      "To manage your ticket and book your 1:1 meetings, sign in to your account at linkusummit.com. Just use your email: we'll send you a 6-digit code to log in (no passwords).",
    accountCta: 'Go to my account',
    footer:
      'LinkU Capital Summit 2026 · October 5–6, 2026 · Country Club Medellín · linkusummit.com'
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
  const loginUrl = `${SITE_URL}${input.locale === 'es' ? '' : '/' + input.locale}/login`;

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
  <title>LinkU Capital Summit 2026</title>
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

        <tr><td style="padding:8px 24px 32px 24px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#0A1428;border:1px solid rgba(255,90,95,0.25);border-radius:12px;">
            <tr><td style="padding:18px;">
              <p style="margin:0 0 6px 0;color:#E8EEF5;font-size:14px;font-weight:700;">
                ${t.accountTitle}
              </p>
              <p style="margin:0 0 14px 0;color:#8A9BB0;font-size:13px;line-height:1.6;">
                ${t.accountDesc}
              </p>
              <a href="${loginUrl}" style="display:inline-block;padding:12px 22px;background:#FF5A5F;color:#fff;font-weight:600;font-size:14px;text-decoration:none;border-radius:10px;">
                ${t.accountCta} →
              </a>
              <p style="margin:12px 0 0 0;color:#5A6B82;font-size:11px;word-break:break-all;">
                ${loginUrl}
              </p>
            </td></tr>
          </table>
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

// ---------------------------------------------------------------------
// Correos masivos (admin /admin/emails)
// ---------------------------------------------------------------------

/** Escapa HTML: todo lo que escribe el admin pasa por aquí antes de ir al correo. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Reemplaza {{nombre}} (con o sin espacios, sin importar mayúsculas) por el
 * primer nombre. Si no hay nombre se omite y se limpia la puntuación que
 * queda suelta ("Hola {{nombre}}," -> "Hola,").
 */
export function personalize(text: string, firstName: string): string {
  const out = text.replace(/\{\{\s*nombre\s*\}\}/gi, firstName);
  if (firstName) return out;
  return out
    .replace(/[ \t]+([,.:;!?])/g, '$1')
    .replace(/(^|\n)[ \t]*[,.:;]+[ \t]*/g, '$1');
}

export function campaignEmail(input: {
  subject: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  firstName: string;
}): { subject: string; html: string; text: string } {
  // El asunto es un encabezado: sin saltos de línea.
  const subject = personalize(input.subject, input.firstName).replace(/\s+/g, ' ').trim();
  const body = personalize(input.body.replace(/\r\n/g, '\n'), input.firstName).trim();

  // Un enlace solo es válido si es https (si no, se omite el botón).
  let ctaUrl = '';
  try {
    const u = new URL((input.ctaUrl ?? '').trim());
    if (u.protocol === 'https:') ctaUrl = u.toString();
  } catch {
    /* sin botón */
  }
  const ctaLabel = (input.ctaLabel ?? '').trim();
  const hasCta = Boolean(ctaUrl && ctaLabel);

  // Párrafos separados por línea en blanco; los saltos simples se respetan.
  const paragraphsHtml = body
    .split(/\n[ \t]*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;color:#E8EEF5;font-size:15px;line-height:1.65;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`
    )
    .join('');

  const FOOTER =
    'Recibes este correo porque estás registrado en LINKU CAPITAL SUMMIT 2026 · 5 y 6 de octubre · Medellín';

  const ctaHtml = hasCta
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px 0;"><tr><td style="background:#FF5A5F;border-radius:10px;">
        <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:10px;">${escapeHtml(ctaLabel)}</a>
      </td></tr></table>
      <p style="margin:8px 0 0 0;color:#5A6B82;font-size:11px;word-break:break-all;">${escapeHtml(ctaUrl)}</p>`
    : '';

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#050814;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E8EEF5;">
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#050814;padding:24px 0;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:#050814;">
        <tr><td style="padding:0 24px 24px 24px;">
          <p style="margin:0;color:#E8EEF5;font-size:18px;font-weight:700;letter-spacing:-0.02em;">
            LINKU CAPITAL <span style="color:#FF5A5F;">SUMMIT</span> 2026
          </p>
          <p style="margin:4px 0 0 0;color:#FF5A5F;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;">
            By LinkU Ventures
          </p>
        </td></tr>

        <tr><td style="padding:0 24px 24px 24px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#0A1428;border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
            <tr><td style="padding:24px;">
              <h1 style="margin:0 0 18px 0;color:#E8EEF5;font-size:22px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;">
                ${escapeHtml(subject)}
              </h1>
              ${paragraphsHtml}
              ${ctaHtml}
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:16px 24px 24px 24px;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="margin:0;color:#5A6B82;font-size:11px;line-height:1.6;">
            ${escapeHtml(FOOTER)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    'LINKU CAPITAL SUMMIT 2026',
    '',
    body,
    hasCta ? `\n${ctaLabel}: ${ctaUrl}` : '',
    '',
    '--',
    FOOTER
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { subject, html, text };
}
