import { createHash } from 'node:crypto';
import { wompiIntegritySecret, wompiEventsSecret } from './config';

/**
 * Firma de integridad de la transacción (Web Checkout / Widget).
 * Wompi exige: sha256(reference + amountInCents + currency + integritySecret).
 * Si se pasa expirationTime ISO, se incluye antes del secret.
 *
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/#firma-de-integridad
 */
export function signTransactionIntegrity(input: {
  reference: string;
  amountInCents: number;
  currency: string;
  expirationTime?: string;
}): string {
  const { reference, amountInCents, currency, expirationTime } = input;
  const secret = wompiIntegritySecret();
  const payload =
    expirationTime
      ? `${reference}${amountInCents}${currency}${expirationTime}${secret}`
      : `${reference}${amountInCents}${currency}${secret}`;
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Verifica la firma del webhook de Wompi.
 *
 * El body que envía Wompi trae:
 *   {
 *     event: 'transaction.updated',
 *     data: { transaction: {...} },
 *     signature: {
 *       checksum: 'SHA256_HEX_EN_MAYUSCULAS',
 *       properties: ['transaction.id','transaction.status','transaction.amount_in_cents']
 *     },
 *     timestamp: 1234567890,
 *     environment: 'test' | 'prod'
 *   }
 *
 * Calculamos:
 *   sha256(
 *     valuesAt(body, signature.properties).join('') +
 *     timestamp +
 *     eventsSecret
 *   ).toUpperCase()
 *
 * Si coincide con signature.checksum → válido.
 *
 * Docs: https://docs.wompi.co/docs/colombia/eventos/#validar-la-autenticidad-del-evento
 */
export function verifyWompiWebhook(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = body as any;
  const checksum: string | undefined = b?.signature?.checksum;
  const properties: string[] | undefined = b?.signature?.properties;
  const timestamp = b?.timestamp;

  if (!checksum || !Array.isArray(properties) || timestamp === undefined) {
    return false;
  }

  const concatenated = properties
    .map((path) => {
      // Path tipo "transaction.id" → busca recursivo en b.data
      return path.split('.').reduce<unknown>((acc, key) => {
        if (acc && typeof acc === 'object' && key in (acc as object)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (acc as any)[key];
        }
        return undefined;
      }, b.data);
    })
    .map((v) => (v === undefined || v === null ? '' : String(v)))
    .join('');

  const secret = wompiEventsSecret();
  const computed = createHash('sha256')
    .update(concatenated + timestamp + secret)
    .digest('hex')
    .toUpperCase();

  return computed === checksum.toUpperCase();
}

/** Genera una referencia única para órdenes. */
export function generateOrderReference(prefix = 'LSUMMIT26'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}
