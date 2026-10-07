import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Utilidades de correos masivos: validación del formulario, primer nombre
 * y cálculo de la audiencia. Sin secretos: se puede importar también desde
 * componentes cliente (loadAudience solo se usa en el servidor).
 */

export const DEFAULT_REPLY_TO = 'miguel.salazar@linku-ventures.co';
/** Cierre por defecto (mismo texto que usa la plantilla). */
export const DEFAULT_CLOSING_TEXT = 'Nos vemos en Medellín.';
export const BATCH_SIZE = 100;
/** Un destinatario en 'sending' más de este tiempo se considera cortado. */
export const STALE_MINUTES = 10;

export const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

/** Validación estricta de destinatarios (largo y puntos mal puestos incluidos). */
export function isValidRecipientEmail(e: string): boolean {
  return (
    e.length <= 254 &&
    EMAIL_RE.test(e) &&
    !e.startsWith('.') &&
    !e.split('@')[0].endsWith('.') &&
    !e.includes('..')
  );
}

export type CampaignInput = {
  subject: string;
  /** Título (H1) del correo; vacío = se usa el asunto. */
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  replyTo: string;
  /** Slugs de las categorías elegidas. */
  tiers: string[];
  /** Incluye la sección "Cómo llegar" (mapa). */
  includeMap: boolean;
  /** Recuadro destacado opcional. */
  boxTitle: string;
  boxIntro: string;
  boxLines: string;
  /** Frase de cierre; vacío = sin cierre. Por defecto "Nos vemos en Medellín.". */
  closing: string;
};

export type AudienceEntry = {
  email: string;
  name: string;
  /** Slugs de las categorías de sus órdenes pagadas. */
  tiers: string[];
};

/** Primer nombre listo para el saludo ("" si no hay). */
export function firstNameOf(name: string | null | undefined): string {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? '';
  if (!first) return '';
  // "JUAN" o "juan" -> "Juan"; "McAllister" se respeta.
  if (first === first.toUpperCase() || first === first.toLowerCase()) {
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return first;
}

export function validateCampaignInput(
  i: CampaignInput
): { ok: true; value: CampaignInput } | { ok: false; message: string } {
  const subject = (i.subject ?? '').replace(/[\r\n]+/g, ' ').trim();
  const title = (i.title ?? '').replace(/[\r\n]+/g, ' ').trim();
  const body = (i.body ?? '').trim();
  const ctaLabel = (i.ctaLabel ?? '').trim();
  const ctaUrl = (i.ctaUrl ?? '').trim();
  const replyTo = (i.replyTo ?? '').trim().toLowerCase();
  const includeMap = Boolean(i.includeMap);
  const boxTitle = (i.boxTitle ?? '').replace(/[\r\n]+/g, ' ').trim();
  const boxIntro = (i.boxIntro ?? '').trim();
  const boxLines = (i.boxLines ?? '').trim();
  const closing = (i.closing ?? '').replace(/[\r\n]+/g, ' ').trim();

  if (!subject) return { ok: false, message: 'Escribe el asunto.' };
  if (subject.length > 150) return { ok: false, message: 'El asunto es muy largo (máx. 150).' };
  if (title.length > 150) return { ok: false, message: 'El título es muy largo (máx. 150).' };
  if (boxTitle.length > 80) return { ok: false, message: 'El título del recuadro es muy largo (máx. 80).' };
  if (boxIntro.length > 1000) return { ok: false, message: 'El texto del recuadro es muy largo (máx. 1000).' };
  if (boxLines.length > 1500) return { ok: false, message: 'Las líneas del recuadro son muy largas (máx. 1500).' };
  if (closing.length > 150) return { ok: false, message: 'La frase de cierre es muy larga (máx. 150).' };
  if (!body) return { ok: false, message: 'Escribe el mensaje.' };
  if (body.length > 20000) return { ok: false, message: 'El mensaje es muy largo.' };
  if (!EMAIL_RE.test(replyTo)) return { ok: false, message: 'El correo "Responder a" no es válido.' };
  if (ctaLabel || ctaUrl) {
    if (!ctaLabel || !ctaUrl) {
      return { ok: false, message: 'El botón necesita texto y enlace (o deja ambos vacíos).' };
    }
    if (ctaLabel.length > 60) return { ok: false, message: 'El texto del botón es muy largo.' };
    let ok = false;
    try {
      ok = new URL(ctaUrl).protocol === 'https:';
    } catch {
      ok = false;
    }
    if (!ok) return { ok: false, message: 'El enlace del botón debe empezar por https://' };
  }
  const tiers = Array.from(new Set((i.tiers ?? []).filter((t) => typeof t === 'string' && t)));
  return {
    ok: true,
    value: { subject, title, body, ctaLabel, ctaUrl, replyTo, tiers, includeMap, boxTitle, boxIntro, boxLines, closing }
  };
}

/**
 * Personas con al menos una orden pagada, agrupadas por correo en minúsculas.
 * Nombre: el de su orden pagada más reciente que tenga nombre. Se descartan
 * correos vacíos o inválidos. Pagina de a 1000 (límite de PostgREST).
 * Usa el cliente de sesión del admin (RLS "Admins can view all orders").
 */
export async function loadAudience(
  supabase: SupabaseClient
): Promise<{ ok: true; entries: AudienceEntry[] } | { ok: false; error: string }> {
  const PAGE = 1000;
  const byEmail = new Map<string, AudienceEntry>();

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('orders')
      .select('buyer_email, buyer_name, ticket_tier, paid_at, created_at')
      .eq('status', 'paid')
      .order('paid_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { ok: false, error: error.message };

    for (const o of data ?? []) {
      const email = String(o.buyer_email ?? '').trim().toLowerCase();
      if (!email || !isValidRecipientEmail(email)) continue;
      const cur = byEmail.get(email);
      const name = String(o.buyer_name ?? '').trim();
      if (!cur) {
        byEmail.set(email, { email, name, tiers: o.ticket_tier ? [o.ticket_tier] : [] });
      } else {
        // Las órdenes llegan de la más reciente a la más antigua.
        if (!cur.name && name) cur.name = name;
        if (o.ticket_tier && !cur.tiers.includes(o.ticket_tier)) cur.tiers.push(o.ticket_tier);
      }
    }
    if (!data || data.length < PAGE) break;
  }

  const entries = Array.from(byEmail.values()).sort((a, b) => a.email.localeCompare(b.email));
  return { ok: true, entries };
}

/** Filtra por categorías elegidas: entra quien tenga al menos una. */
export function filterAudience(entries: AudienceEntry[], tiers: string[]): AudienceEntry[] {
  const set = new Set(tiers);
  return entries.filter((e) => e.tiers.some((t) => set.has(t)));
}
