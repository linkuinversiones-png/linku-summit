import { createHash, timingSafeEqual } from 'node:crypto';
import { wompiIntegritySecret, wompiEventsSecret } from './config';

/**
 * Firma de integridad del Web Checkout de Wompi (`signature:integrity`).
 *
 * Wompi exige SHA256 de la concatenación SIN espacios, EN ESTE ORDEN:
 *   reference + amountInCents + currency + integritySecret
 *
 * (Si se usa `expiration-time`, va entre currency e integritySecret. Aquí no
 * usamos expiración, así que se omite.)
 *
 * Doc: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 */
export function signIntegrity(input: {
  reference: string;
  amountInCents: number; // Wompi usa CENTAVOS (COP * 100).
  currency: string; // 'COP'
}): string {
  const { reference, amountInCents, currency } = input;
  const payload = `${reference}${amountInCents}${currency}${wompiIntegritySecret()}`;
  return createHash('sha256').update(payload).digest('hex');
}

/** Genera una referencia única para órdenes (Wompi `reference`). */
export function generateOrderReference(prefix = 'LSUMMIT26'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}

/** Resuelve un path con puntos (ej. "transaction.id") dentro de un objeto. */
function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

type WompiEvent = {
  data?: Record<string, unknown>;
  timestamp?: number;
  signature?: { properties?: string[]; checksum?: string };
};

/**
 * Valida el checksum del webhook de eventos de Wompi.
 *
 * checksum = SHA256(
 *   <valor de cada property en signature.properties, en orden, leídos desde `data`>
 *   + timestamp
 *   + WOMPI_EVENTS_SECRET
 * )
 *
 * Doc: https://docs.wompi.co/docs/colombia/eventos/
 */
export function verifyEventChecksum(event: WompiEvent): boolean {
  const props = event?.signature?.properties;
  const checksum = event?.signature?.checksum;
  const timestamp = event?.timestamp;
  if (!Array.isArray(props) || !checksum || timestamp == null) return false;

  let concat = '';
  for (const path of props) {
    concat += String(resolvePath(event.data, path) ?? '');
  }
  concat += String(timestamp);
  concat += wompiEventsSecret();

  const expected = createHash('sha256').update(concat).digest('hex');

  // Comparación insensible a mayúsculas y a prueba de timing attacks.
  const a = Buffer.from(expected.toLowerCase(), 'hex');
  const b = Buffer.from(String(checksum).toLowerCase(), 'hex');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Mapea el `status` de una transacción Wompi a nuestro `orders.status`.
 *   APPROVED → paid
 *   DECLINED / VOIDED / ERROR → failed
 *   PENDING → pending
 */
export function mapWompiStatus(
  status: string | undefined
): 'paid' | 'failed' | 'pending' | null {
  switch (status) {
    case 'APPROVED':
      return 'paid';
    case 'DECLINED':
    case 'VOIDED':
    case 'ERROR':
      return 'failed';
    case 'PENDING':
      return 'pending';
    default:
      return null;
  }
}
