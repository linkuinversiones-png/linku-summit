/**
 * Seguimiento de pagos: lógica pura (sin acceso a datos) que decide qué
 * compradores tienen un caso "por resolver" en /admin/orders.
 *
 * Un caso = compradores con órdenes rechazadas (failed) o pendientes hace
 * más de 30 minutos que todavía no lograron pagar ni fueron cerrados a mano.
 * Se mantiene en un archivo aparte, sin imports de servidor, para que sea
 * fácil de revisar y de probar.
 */

/** Motivos con los que un admin cierra un caso. */
export const FOLLOWUP_RESOLUTIONS = [
  { value: 'pago_otro_medio', label: 'Pagó por otro medio' },
  { value: 'cortesia', label: 'Se le dio cortesía' },
  { value: 'desistio', label: 'Desistió' },
  { value: 'contactado', label: 'Contactado, en espera' },
  { value: 'otro', label: 'Otro' }
] as const;

export type FollowupResolution = (typeof FOLLOWUP_RESOLUTIONS)[number]['value'];

export const FOLLOWUP_RESOLUTION_LABEL: Record<string, string> = Object.fromEntries(
  FOLLOWUP_RESOLUTIONS.map((r) => [r.value, r.label])
);

/** Una pending más nueva que esto puede estar pagando ahora mismo. */
export const PENDING_GRACE_MINUTES = 30;

/** Datos mínimos de una orden para armar los casos. */
export type FollowupOrder = {
  id: string;
  status: string;
  created_at: string;
  payment_method: string | null;
  ticket_tier: string;
  tier_name: string | null;
  /** True para tiers internos (admin_only): nunca pasan por Wompi. */
  tier_admin_only: boolean;
  total_cop: number;
  discount_cop: number;
  coupon_code: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_doc_number: string | null;
  buyer_company: string | null;
};

/** Última resolución manual de un comprador. */
export type FollowupResolutionRow = {
  buyer_key: string;
  resolution: string;
  note: string | null;
  resolved_by_email: string | null;
  resolved_at: string;
};

export type FollowupCase = {
  buyerKey: string;
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  whatsappUrl: string | null;
  tierName: string | null;
  totalCop: number;
  discountCop: number;
  couponCode: string | null;
  /** Estado del último intento. */
  lastStatus: 'failed' | 'pending';
  attempts: number;
  firstAt: string;
  lastAt: string;
  /** Orden del último intento (para el link "Ver"). */
  lastOrderId: string;
  /** Todas las órdenes del caso, de la más reciente a la más antigua. */
  orderIds: string[];
  /** Lo llena el cargador con el último motivo del log de Wompi. */
  lastReason: string | null;
};

/** Documento sin espacios, puntos, guiones ni otros símbolos, en minúsculas. */
export function normalizeDoc(doc: string | null | undefined): string | null {
  const n = String(doc ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return n || null;
}

function normalizeEmail(email: string | null | undefined): string | null {
  const n = String(email ?? '').trim().toLowerCase();
  return n || null;
}

/** Clave de agrupación: documento si existe; si no, correo. */
export function buyerKeyOf(o: {
  buyer_doc_number: string | null;
  buyer_email: string | null;
  id: string;
}): string {
  const doc = normalizeDoc(o.buyer_doc_number);
  if (doc) return `doc:${doc}`;
  const email = normalizeEmail(o.buyer_email);
  if (email) return `email:${email}`;
  // Sin documento ni correo no hay forma de agrupar: caso individual.
  return `orden:${o.id}`;
}

/**
 * Link de WhatsApp a partir de un teléfono libre.
 *  - Celular colombiano de 10 dígitos que empieza por 3 → antepone 57.
 *  - Ya con indicativo (57 + 10 dígitos, o "+"/"00" seguido de 11 a 15
 *    dígitos) → se respeta.
 *  - Cualquier otra cosa → null (solo se muestra el teléfono).
 */
export function whatsappUrl(phone: string | null | undefined): string | null {
  const raw = String(phone ?? '').trim();
  if (!raw) return null;
  const hasPlus = raw.startsWith('+') || raw.startsWith('00');
  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('00')) digits = digits.replace(/^00/, '');
  if (/^3\d{9}$/.test(digits)) return `https://wa.me/57${digits}`;
  if (/^573\d{9}$/.test(digits)) return `https://wa.me/${digits}`;
  if (hasPlus && digits.length >= 11 && digits.length <= 15) {
    return `https://wa.me/${digits}`;
  }
  return null;
}

/**
 * Arma los casos por resolver.
 *
 * @param orders  Órdenes failed / pending / paid del comprador (las paid se
 *                usan solo para detectar auto-resolución).
 * @param resolutions  Resoluciones manuales (varias por comprador; vale la
 *                más reciente).
 */
export function buildFollowupCases(
  orders: FollowupOrder[],
  resolutions: FollowupResolutionRow[],
  now: Date = new Date()
): FollowupCase[] {
  const cutoff = now.getTime() - PENDING_GRACE_MINUTES * 60_000;
  const ts = (iso: string) => new Date(iso).getTime();

  // Intentos que cuentan: failed, o pending con más de 30 min. Se excluyen
  // tiers internos y cortesías (no pasan por Wompi).
  const attempts = orders.filter(
    (o) =>
      !o.tier_admin_only &&
      o.payment_method !== 'cortesia' &&
      (o.status === 'failed' || (o.status === 'pending' && ts(o.created_at) <= cutoff))
  );

  // Índices de órdenes pagadas por documento y por correo (fecha de creación).
  const paidByDoc = new Map<string, number[]>();
  const paidByEmail = new Map<string, number[]>();
  for (const o of orders) {
    if (o.status !== 'paid') continue;
    const t = ts(o.created_at);
    const doc = normalizeDoc(o.buyer_doc_number);
    const email = normalizeEmail(o.buyer_email);
    if (doc) paidByDoc.set(doc, [...(paidByDoc.get(doc) ?? []), t]);
    if (email) paidByEmail.set(email, [...(paidByEmail.get(email) ?? []), t]);
  }

  // Última resolución por comprador.
  const latestResolution = new Map<string, FollowupResolutionRow>();
  for (const r of resolutions) {
    const prev = latestResolution.get(r.buyer_key);
    if (!prev || ts(r.resolved_at) > ts(prev.resolved_at)) latestResolution.set(r.buyer_key, r);
  }

  // Agrupar por comprador.
  const groups = new Map<string, FollowupOrder[]>();
  for (const o of attempts) {
    const key = buyerKeyOf(o);
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }

  const cases: FollowupCase[] = [];
  for (const [key, group] of groups) {
    // Más reciente primero.
    const sorted = [...group].sort((a, b) => ts(b.created_at) - ts(a.created_at));
    const last = sorted[0];
    const lastT = ts(last.created_at);

    // Auto-resuelto: pagó (por documento o por correo, con cualquiera de los
    // correos/documentos usados en el grupo) después de su último intento.
    const docs = new Set(group.map((o) => normalizeDoc(o.buyer_doc_number)).filter(Boolean) as string[]);
    const emails = new Set(group.map((o) => normalizeEmail(o.buyer_email)).filter(Boolean) as string[]);
    const paidTimes = [
      ...[...docs].flatMap((d) => paidByDoc.get(d) ?? []),
      ...[...emails].flatMap((e) => paidByEmail.get(e) ?? [])
    ];
    if (paidTimes.some((t) => t > lastT)) continue;

    // Resuelto a mano: se oculta salvo que haya un intento posterior.
    let considered = sorted;
    const res = latestResolution.get(key);
    if (res) {
      const resT = ts(res.resolved_at);
      if (lastT <= resT) continue;
      // Reapareció: solo cuentan los intentos posteriores al cierre.
      considered = sorted.filter((o) => ts(o.created_at) > resT);
    }

    // Datos de contacto: el primer valor no vacío desde el intento más reciente.
    const pick = (f: (o: FollowupOrder) => string | null) =>
      considered.map(f).find((v) => v && v.trim()) ?? null;
    const phone = pick((o) => o.buyer_phone);

    cases.push({
      buyerKey: key,
      name: pick((o) => o.buyer_name),
      company: pick((o) => o.buyer_company),
      email: pick((o) => o.buyer_email),
      phone,
      whatsappUrl: whatsappUrl(phone),
      tierName: last.tier_name ?? last.ticket_tier,
      totalCop: last.total_cop,
      discountCop: last.discount_cop,
      couponCode: last.coupon_code,
      lastStatus: last.status === 'pending' ? 'pending' : 'failed',
      attempts: considered.length,
      firstAt: considered[considered.length - 1].created_at,
      lastAt: last.created_at,
      lastOrderId: last.id,
      orderIds: considered.map((o) => o.id),
      lastReason: null
    });
  }

  // Último intento más reciente primero.
  return cases.sort((a, b) => ts(b.lastAt) - ts(a.lastAt));
}
