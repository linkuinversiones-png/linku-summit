/**
 * Wompi configuration helpers.
 *
 * Env vars (lee de process.env):
 *   - WOMPI_PUBLIC_KEY           pub_test_xxx  o  pub_prod_xxx
 *   - WOMPI_PRIVATE_KEY          prv_test_xxx  o  prv_prod_xxx  (SOLO server)
 *   - WOMPI_INTEGRITY_SECRET     hash secret para firmar transacciones
 *   - WOMPI_EVENTS_SECRET        secret para verificar webhooks
 *   - WOMPI_ENV                  'test' | 'prod' (default: 'test')
 */

export type WompiEnv = 'test' | 'prod';

export const WOMPI_ENV: WompiEnv =
  (process.env.WOMPI_ENV as WompiEnv) === 'prod' ? 'prod' : 'test';

export function wompiPublicKey(): string {
  const k = process.env.WOMPI_PUBLIC_KEY;
  if (!k) throw new Error('WOMPI_PUBLIC_KEY no configurada');
  return k;
}

export function wompiPrivateKey(): string {
  const k = process.env.WOMPI_PRIVATE_KEY;
  if (!k) throw new Error('WOMPI_PRIVATE_KEY no configurada');
  return k;
}

export function wompiIntegritySecret(): string {
  const s = process.env.WOMPI_INTEGRITY_SECRET;
  if (!s) throw new Error('WOMPI_INTEGRITY_SECRET no configurada');
  return s;
}

export function wompiEventsSecret(): string {
  const s = process.env.WOMPI_EVENTS_SECRET;
  if (!s) throw new Error('WOMPI_EVENTS_SECRET no configurada');
  return s;
}

/** URL del Web Checkout (form POST destination). */
export const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';

/** Base URL del API REST de Wompi (consultas server-side). */
export function wompiApiBase(): string {
  return WOMPI_ENV === 'prod'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';
}

export function hasWompiConfigured(): boolean {
  return Boolean(
    process.env.WOMPI_PUBLIC_KEY &&
      process.env.WOMPI_PRIVATE_KEY &&
      process.env.WOMPI_INTEGRITY_SECRET &&
      process.env.WOMPI_EVENTS_SECRET
  );
}
