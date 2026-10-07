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
 * queda suelta ("Hola {{nombre}}," -> "Hola,"). {{correo}} se reemplaza por
 * el correo del destinatario.
 */
export function personalize(text: string, firstName: string, email = ''): string {
  let out = text.replace(/\{\{\s*nombre\s*\}\}/gi, firstName);
  if (!firstName) {
    out = out
      .replace(/[ \t]+([,.:;!?])/g, '$1')
      .replace(/(^|\n)[ \t]*[,.:;]+[ \t]*/g, '$1');
  }
  // {{correo}} se reemplaza al final para que la limpieza de arriba no toque el correo.
  return out.replace(/\{\{\s*correo\s*\}\}/gi, () => email);
}

/** Contacto fijo del correo de campañas (cambiar solo aquí). */
export const CAMPAIGN_CONTACT = {
  name: 'Miguel Salazar',
  email: 'miguel.salazar@linku-ventures.co',
  whatsappLabel: '+57 300 406 4006',
  whatsappUrl: 'https://wa.me/573004064006'
};

/** Enlaces de la sección "Cómo llegar" (cambiar solo aquí). */
export const CAMPAIGN_MAP = {
  place: 'Country Club Ejecutivos · Avenida Las Palmas, Medellín',
  googleMapsUrl: 'https://maps.app.goo.gl/z2xN5hLDkDJvk2q78',
  wazeUrl:
    'https://ul.waze.com/ul?venue_id=186384446.1864106606.378239&overview=yes&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location',
  /** Imagen en public/email/ (mapa de OpenStreetMap; la atribución va dentro de la imagen). */
  imageFile: 'mapa-country.png'
};

/** Redes sociales de LinkU para la línea `@redes` del mensaje (cambiar solo aquí). Imágenes en public/email/. */
export const CAMPAIGN_SOCIAL = [
  {
    name: 'Instagram',
    alt: 'Instagram de LinkU Summit',
    url: 'https://www.instagram.com/linkusummit/',
    imageFile: 'icono-instagram.png'
  },
  {
    name: 'LinkedIn',
    alt: 'LinkedIn de LinkU Ventures',
    url: 'https://www.linkedin.com/company/linku-ventures/',
    imageFile: 'icono-linkedin.png'
  }
];

/** Las imágenes del correo deben ser URL absolutas (Gmail/Outlook no aceptan relativas ni base64). */
export const EMAIL_IMAGE_BASE = 'https://www.linkusummit.com/email';

/** Cierre por defecto de las campañas (null en campañas viejas = este). */
export const DEFAULT_CLOSING = 'Nos vemos en Medellín.';

/** Escapa y aplica **negrita** (solo pares completos de **). */
function inlineHtml(s: string): string {
  return escapeHtml(s).replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
}
/** Quita los ** (versión texto plano). */
function inlineText(s: string): string {
  return s.replace(/\*\*([^*]+?)\*\*/g, '$1');
}

/**
 * Formato ligero del mensaje. Todo se escapa: nunca se interpreta HTML.
 * Por línea: "# " encabezado de sección, "## " subtítulo, "> " frase
 * destacada, "^ " párrafo centrado, "[Texto](https://url)" botón, "---"
 * separador, "@redes" (sola en su línea) fila de íconos de redes,
 * "![alt](https://img)" imagen a todo el ancho y "[![alt](https://img)](https://url)"
 * imagen con enlace (solo https; solas en su línea); lo demás es párrafo. Líneas seguidas del mismo tipo forman un
 * solo bloque (con <br />). Devuelve HTML, texto plano y un resumen (preheader).
 */
function renderBody(
  body: string,
  opts: { bare?: boolean } = {}
): { html: string; text: string; preview: string } {
  const bare = Boolean(opts.bare);
  const text: string[] = [];
  const preview: string[] = [];
  // Cada bloque se guarda con su tipo: en modo "diseño propio" las imágenes
  // van sin márgenes ni espacio entre ellas y el resto de bloques se pinta
  // con colores claros (fondo oscuro) dentro de una fila con relleno.
  const items: { img: boolean; html: string }[] = [];
  const html = {
    push(h: string) {
      items.push({ img: false, html: h });
    }
  };

  type Kind = 'p' | 'quote' | 'center';
  let run: { kind: Kind; lines: string[] } | null = null;
  const flush = () => {
    if (!run) return;
    const inner = run.lines.map(inlineHtml).join('<br />');
    if (run.kind === 'quote') {
      html.push(
        `<p style="margin:10px 0 20px 0;font-size:19px;line-height:1.5;font-weight:700;color:#0d1020;text-align:center;font-family:${FONT};">${inner}</p>`
      );
    } else {
      html.push(
        `<p class="txt" style="margin:0 0 16px 0;font-size:16px;line-height:1.65;color:#3a3d4d;${run.kind === 'center' ? 'text-align:center;' : ''}">${inner}</p>`
      );
    }
    text.push(run.lines.map(inlineText).join('\n'));
    preview.push(run.lines.map(inlineText).join(' '));
    run = null;
  };
  const add = (kind: Kind, line: string) => {
    if (run && run.kind !== kind) flush();
    if (!run) run = { kind, lines: [] };
    run.lines.push(line);
  };

  for (const block of body.split(/\n[ \t]*\n/)) {
    for (const raw of block.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      let m: RegExpMatchArray | null;
      if (
        ((m = line.match(/^\[!\[([^\]]*)\]\(([^)\s]+)\)\]\(([^)\s]+)\)$/)) && isHttps(m[2]) && isHttps(m[3])) ||
        ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)) && isHttps(m[2]))
      ) {
        flush();
        const alt = m[1].trim();
        const src = m[2];
        const href = m[3] ?? '';
        const imgTag = `<img src="${escapeHtml(src)}" width="${bare ? 600 : 508}" alt="${escapeHtml(alt)}" style="display:block;width:100%;height:auto;border:0;outline:none;${bare ? '' : 'border-radius:10px;'}" />`;
        const inner = href
          ? `<a href="${escapeHtml(href)}" target="_blank" style="display:block;text-decoration:none;">${imgTag}</a>`
          : imgTag;
        const table = bare
          ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="line-height:0;font-size:0;padding:0">${inner}</td></tr></table>`
          : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;"><tr><td style="line-height:0;font-size:0;">${inner}</td></tr></table>`;
        items.push({ img: true, html: table });
        text.push(`[Imagen: ${alt}]${href ? `\n${alt}: ${href}` : ''}`);
        if (alt) preview.push(alt);
      } else if (/^-{3,}$/.test(line)) {
        flush();
        html.push(
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;"><tr><td style="line-height:0;font-size:0;"><img src="{{IMG}}/separador.png" width="508" alt="" style="display:block;width:100%;height:6px;" /></td></tr></table>`
        );
        text.push('────────');
      } else if (line === '@redes') {
        flush();
        const cells = CAMPAIGN_SOCIAL.map(
          (s, i) =>
            `<td style="padding:0 ${i === 0 ? '7px 0 0' : '0 0 7px'};line-height:0;font-size:0;"><a href="${escapeHtml(s.url)}" target="_blank" style="text-decoration:none;"><img src="{{IMG}}/${s.imageFile}" width="44" height="44" alt="${escapeHtml(s.alt)}" style="display:block;width:44px;height:44px;border:0;outline:none;" /></a></td>`
        ).join('');
        html.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 4px auto;"><tr>${cells}</tr></table>
      <p style="margin:6px 0 8px 0;font-size:13px;line-height:1.5;color:#6b6e7d;text-align:center;font-family:${FONT};">@linkusummit · LinkU Ventures</p>`
        );
        text.push(CAMPAIGN_SOCIAL.map((s) => `${s.name}: ${s.url}`).join('\n'));
      } else if ((m = line.match(/^##\s+(.+)$/))) {
        flush();
        html.push(
          `<p style="margin:22px 0 6px 0;font-size:18px;line-height:1.35;font-weight:700;color:#0d1020;text-align:left;font-family:${FONT};">${inlineHtml(m[1])}</p>`
        );
        text.push(inlineText(m[1]));
        preview.push(inlineText(m[1]));
      } else if ((m = line.match(/^#\s+(.+)$/))) {
        flush();
        const t = inlineText(m[1]).toUpperCase();
        html.push(
          `<p style="margin:34px 0 14px 0;font-size:13px;letter-spacing:2px;font-weight:700;color:#ff5a5f;text-align:center;font-family:${FONT};">${escapeHtml(t)}</p>`
        );
        text.push(`\n${t}`);
        preview.push(t);
      } else if ((m = line.match(/^>\s+(.+)$/))) {
        add('quote', m[1]);
      } else if ((m = line.match(/^\^\s+(.+)$/))) {
        add('center', m[1]);
      } else if ((m = line.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)) && isHttps(m[2])) {
        flush();
        const url = m[2];
        html.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 8px auto;">
       <tr><td align="center" bgcolor="#ff5a5f" style="background-color:#ff5a5f;border-radius:10px;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:16px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(m[1])}</a>
       </td></tr>
      </table>`
        );
        text.push(`${m[1]}: ${url}`);
      } else {
        add('p', line);
      }
    }
    flush();
  }
  flush();
  const out = items.map((it) => {
    if (!bare || it.img) return it.html;
    const light = it.html
      .replace(/#3a3d4d/g, '#d9d9e2')
      .replace(/#0d1020/g, '#ffffff')
      .replace(/#6b6e7d/g, '#9a9aa5');
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="px" style="padding:6px 28px;font-family:${FONT};color:#d9d9e2;">${light}</td></tr></table>`;
  });
  return {
    html: out.join(bare ? '\n' : '\n      '),
    text: text.join('\n\n'),
    preview: preview.join(' ')
  };
}

function isHttps(u: string): boolean {
  try {
    return new URL(u).protocol === 'https:';
  } catch {
    return false;
  }
}

const FONT = "'Poppins','Gilroy','Helvetica Neue',Helvetica,Arial,sans-serif";

export function campaignEmail(input: {
  subject: string;
  /** Título (H1) del correo; si está vacío se usa el asunto. */
  title?: string | null;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  firstName: string;
  /** Correo del destinatario (para {{correo}}). */
  email?: string;
  /** Incluye la sección "Cómo llegar" con el mapa. */
  includeMap?: boolean;
  /** Recuadro destacado opcional (título en coral, texto y líneas "Etiqueta: valor"). */
  boxTitle?: string | null;
  boxIntro?: string | null;
  boxLines?: string | null;
  /** Frase de cierre: null/undefined = "Nos vemos en Medellín."; vacío = sin cierre. */
  closing?: string | null;
  /** Solo para la vista previa del admin: base de las imágenes (p. ej. "/email"). */
  imageBase?: string;
  /** "Diseño propio": sin plantilla LinkU (banners, frase, título, contacto, pie); solo cuerpo + nota legal. */
  customDesign?: boolean;
}): { subject: string; html: string; text: string } {
  const img = input.imageBase ?? EMAIL_IMAGE_BASE;
  const em = input.email ?? '';
  const pz = (t: string) => personalize(t, input.firstName, em);
  // El asunto es un encabezado: sin saltos de línea.
  const subject = pz(input.subject).replace(/\s+/g, ' ').trim();
  const titleRaw = pz((input.title ?? '').trim()).replace(/\s+/g, ' ').trim();
  const title = titleRaw || subject;
  const body = pz(input.body.replace(/\r\n/g, '\n')).trim();

  // Recuadro destacado (todo opcional).
  const boxTitle = pz((input.boxTitle ?? '').trim()).replace(/\s+/g, ' ').trim();
  const boxIntro = pz((input.boxIntro ?? '').replace(/\r\n/g, '\n')).trim();
  const boxLines = pz((input.boxLines ?? '').replace(/\r\n/g, '\n'))
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(':');
      // "Etiqueta: valor"; sin ":" (o un enlace "https://...") se muestra tal cual.
      if (i > 0 && !l.slice(i + 1).startsWith('//')) {
        return { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() };
      }
      return { label: '', value: l };
    });
  const hasBox = Boolean(boxTitle || boxIntro || boxLines.length > 0);

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

  // Cuerpo con formato ligero (encabezados, subtítulos, botones, etc.).
  const rendered = renderBody(body, { bare: Boolean(input.customDesign) });
  const bodyHtml = rendered.html.replace(/\{\{IMG\}\}/g, img);
  const closing =
    input.closing === null || input.closing === undefined
      ? DEFAULT_CLOSING
      : pz(input.closing).replace(/\s+/g, ' ').trim();

  const preheader = escapeHtml(rendered.preview.replace(/\s+/g, ' ').slice(0, 110));

  // Botón "bulletproof": tabla con celda coloreada (funciona en Outlook).
  const ctaHtml = hasCta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 8px auto;">
       <tr><td align="center" bgcolor="#ff5a5f" style="background-color:#ff5a5f;border-radius:10px;">
        <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:16px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(ctaLabel)}</a>
       </td></tr>
      </table>`
    : '';

  // Cómo llegar: mapa enlazado a Google Maps + botones Google Maps / Waze.
  const M = CAMPAIGN_MAP;
  const mapHtml = input.includeMap
    ? `<p style="margin:34px 0 6px 0;font-size:13px;letter-spacing:2px;font-weight:700;color:#ff5a5f;text-align:center;font-family:${FONT};">CÓMO LLEGAR</p>
      <p class="txt" style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#3a3d4d;text-align:center;font-family:${FONT};">${escapeHtml(M.place)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="line-height:0;font-size:0;">
       <a href="${escapeHtml(M.googleMapsUrl)}" target="_blank"><img src="${img}/${M.imageFile}" width="508" alt="Mapa: Country Club Ejecutivos, Avenida Las Palmas, Medellín" style="display:block;width:100%;height:auto;border-radius:10px;border:1px solid #e4e4ea;" /></a>
      </td></tr></table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:16px auto 0 auto;"><tr>
       <td bgcolor="#ff5a5f" style="background-color:#ff5a5f;border-radius:8px;"><a href="${escapeHtml(M.googleMapsUrl)}" target="_blank" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Abrir en Google Maps</a></td>
       <td width="10" style="font-size:0;line-height:0;">&nbsp;</td>
       <td style="border-radius:8px;border:1px solid #ff5a5f;"><a href="${escapeHtml(M.wazeUrl)}" target="_blank" style="display:inline-block;padding:11px 22px;font-family:${FONT};font-size:15px;font-weight:600;color:#ff5a5f;text-decoration:none;">Ir con Waze</a></td>
      </tr></table>`
    : '';

  // Recuadro destacado: título coral, texto y caja con líneas.
  const boxHtml = hasBox
    ? [
        boxTitle
          ? `<p style="margin:38px 0 6px 0;font-size:13px;letter-spacing:2px;font-weight:700;color:#ff5a5f;text-align:center;font-family:${FONT};">${escapeHtml(boxTitle.toUpperCase())}</p>`
          : '',
        boxIntro
          ? boxIntro
              .split(/\n[ \t]*\n/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map(
                (p) =>
                  `<p class="txt" style="margin:${boxTitle ? '0' : '34px'} 0 16px 0;font-size:16px;line-height:1.65;color:#3a3d4d;">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`
              )
              .join('\n      ')
          : '',
        boxLines.length > 0
          ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${boxTitle || boxIntro ? '0' : '34px'} 0 6px 0;background-color:#fafafc;border-left:3px solid #ff5a5f;border-radius:6px;">
       <tr><td style="padding:18px 22px;font-family:${FONT};font-size:16px;line-height:2;color:#0d1020;">
         ${boxLines
           .map((l) =>
             l.label
               ? `<strong style="color:#ff5a5f;">${escapeHtml(l.label)}:</strong> ${escapeHtml(l.value)}`
               : escapeHtml(l.value)
           )
           .join('<br />\n         ')}
       </td></tr>
      </table>`
          : ''
      ]
        .filter(Boolean)
        .join('\n      ')
    : '';

  const c = CAMPAIGN_CONTACT;
  const LEGAL_TEXT =
    'Recibes este correo porque te registraste a LinkU Capital Summit 2026.\nLinkU Ventures S.A.S. · NIT 901387738-6 · Medellín, Colombia';

  // Modo "diseño propio": HTML mínimo, solo el cuerpo y la nota legal.
  if (input.customDesign) {
    const pre = escapeHtml(
      (rendered.preview || rendered.text).replace(/\s+/g, ' ').trim().slice(0, 110)
    );
    const customHtml = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="dark light" />
<meta name="supported-color-schemes" content="dark light" />
<title>${escapeHtml(subject)}</title>
<style type="text/css">
  body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  a { color:#ff5a5f; }
  @media only screen and (max-width:620px) {
    .contenedor { width:100% !important; max-width:100% !important; }
    .px { padding-left:20px !important; padding-right:20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
  ${pre}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d14;">
 <tr>
  <td align="center" style="padding:0;">

   <table role="presentation" class="contenedor" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#0d0d14;">
    <tr><td style="padding:0;">
${bodyHtml}
    </td></tr>
   </table>

   <table role="presentation" class="contenedor" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
    <tr>
     <td class="px" style="padding:18px 26px 24px 26px;font-family:${FONT};font-size:11px;line-height:1.7;color:#9a9aa5;text-align:center;">
       Recibes este correo porque te registraste a LinkU Capital Summit 2026.<br />
       LinkU Ventures S.A.S. · NIT 901387738-6 · Medellín, Colombia
     </td>
    </tr>
   </table>

  </td>
 </tr>
</table>
</body>
</html>`;
    return { subject, html: customHtml, text: `${rendered.text}\n\n${LEGAL_TEXT}`.replace(/\n{3,}/g, '\n\n') };
  }

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(subject)}</title>
<style type="text/css">
  body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  a { color:#ff5a5f; }
  @media only screen and (max-width:620px) {
    .contenedor { width:100% !important; max-width:100% !important; border-radius:0 !important; }
    .px { padding-left:22px !important; padding-right:22px !important; }
    .h1 { font-size:21px !important; line-height:1.28 !important; }
    .txt { font-size:15px !important; }
    .pie { font-size:13px !important; }
    .sp { height:26px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#eeeef1;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
  ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eeeef1;">
 <tr>
  <td align="center" style="padding:24px 10px;">

   <table role="presentation" class="contenedor" width="600" cellpadding="0" cellspacing="0" border="0"
          style="width:600px;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;">

    <tr>
     <td style="line-height:0;font-size:0;background-color:#050814;">
      <img src="${img}/banner-superior.jpg" width="600" alt="LinkU Capital Summit 2026"
           style="display:block;width:100%;max-width:600px;height:auto;" />
     </td>
    </tr>

    <tr>
     <td class="px" style="padding:36px 46px 0 46px;font-family:${FONT};">

      <p class="txt" style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:#5b5e70;text-align:center;">
        <em style="color:#ff5a5f;font-style:italic;font-weight:600;">Un espacio</em> para entender cómo se mueve el capital en Latinoamérica.
      </p>

      <h1 class="h1" style="margin:0 0 18px 0;font-size:25px;line-height:1.25;font-weight:700;color:#0d1020;text-align:center;">
        ${escapeHtml(title)}
      </h1>

      ${bodyHtml}

      ${mapHtml}

      ${boxHtml}

      ${ctaHtml}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0 0;">
       <tr><td style="line-height:0;font-size:0;">
        <img src="${img}/separador.png" width="508" alt="" style="display:block;width:100%;height:6px;" />
       </td></tr>
      </table>

      ${closing ? `<p class="txt" style="margin:26px 0 8px 0;font-size:17px;line-height:1.5;color:#0d1020;text-align:center;font-weight:700;">
        ${escapeHtml(closing)}
      </p>` : '<div style="height:18px;line-height:18px;font-size:0;">&nbsp;</div>'}

      <p class="pie" style="margin:0 0 34px 0;font-size:14px;line-height:1.75;color:#6b6e7d;text-align:center;">
        ¿Tienes alguna duda? Escríbele a ${escapeHtml(c.name)}:<br />
        <a href="mailto:${escapeHtml(c.email)}" style="color:#ff5a5f;text-decoration:none;font-weight:600;">${escapeHtml(c.email)}</a><br />
        <a href="${escapeHtml(c.whatsappUrl)}" style="color:#ff5a5f;text-decoration:none;font-weight:600;">${escapeHtml(c.whatsappLabel)}</a>
      </p>

     </td>
    </tr>

    <tr>
     <td style="line-height:0;font-size:0;background-color:#050814;">
      <img src="${img}/banner-inferior.jpg" width="600" alt="LinkU Capital Summit 2026"
           style="display:block;width:100%;max-width:600px;height:auto;" />
     </td>
    </tr>

    <tr>
     <td bgcolor="#050814" class="px" align="center"
         style="background-color:#050814;padding:0 40px 34px 40px;font-family:${FONT};">
       <p class="pie" style="margin:0 0 10px 0;font-size:14px;line-height:1.7;color:#d9d9e2;">
         5 y 6 de octubre de 2026&nbsp; ·&nbsp; Country Club Ejecutivos, Medellín
       </p>
       <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;">
         <a href="https://linkusummit.com" style="color:#ff5a5f;text-decoration:none;font-weight:600;letter-spacing:1px;">LINKUSUMMIT.COM</a>
       </p>
       <p style="margin:0;font-size:11px;line-height:1.6;color:#7c7f90;letter-spacing:2px;">
         BY LINKU VENTURES
       </p>
     </td>
    </tr>

   </table>

   <table role="presentation" class="contenedor" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
    <tr>
     <td class="px" style="padding:18px 26px 8px 26px;font-family:${FONT};font-size:11px;line-height:1.7;color:#9a9aa5;text-align:center;">
       Recibes este correo porque te registraste a LinkU Capital Summit 2026.<br />
       LinkU Ventures S.A.S. · NIT 901387738-6 · Medellín, Colombia
     </td>
    </tr>
   </table>

  </td>
 </tr>
</table>
</body>
</html>`;

  const text = [
    'LINKU CAPITAL SUMMIT 2026',
    'Un espacio para entender cómo se mueve el capital en Latinoamérica.',
    '',
    title,
    '',
    rendered.text,
    input.includeMap
      ? `\nCÓMO LLEGAR\n${M.place}\nGoogle Maps: ${M.googleMapsUrl}\nWaze: ${M.wazeUrl}`
      : '',
    hasBox
      ? [
          '',
          boxTitle.toUpperCase(),
          boxIntro,
          ...boxLines.map((l) => (l.label ? `${l.label}: ${l.value}` : l.value))
        ]
          .filter((x, i) => i === 0 || x)
          .join('\n')
      : '',
    hasCta ? `\n${ctaLabel}: ${ctaUrl}` : '',
    '',
    closing,
    '',
    `¿Tienes alguna duda? Escríbele a ${c.name}:`,
    c.email,
    `${c.whatsappLabel} (${c.whatsappUrl})`,
    '',
    '5 y 6 de octubre de 2026 · Country Club Ejecutivos, Medellín',
    'LINKUSUMMIT.COM (https://linkusummit.com) · BY LINKU VENTURES',
    '',
    LEGAL_TEXT
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { subject, html, text };
}
