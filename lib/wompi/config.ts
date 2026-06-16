/**
 * Wompi configuration helpers (Colombia).
 *
 * Env vars (lee de process.env):
 *   - WOMPI_PUBLIC_KEY        pub_test_... / pub_prod_... — va en el Web Checkout (cliente)
 *   - WOMPI_PRIVATE_KEY       prv_test_... — para consumir el API REST server-side (opcional)
 *   - WOMPI_INTEGRITY_SECRET  test_integrity_... — secret para firmar la transacción (signature:integrity)
 *   - WOMPI_EVENTS_SECRET     test_events_... — secret para validar el checksum del webhook de eventos
 *   - WOMPI_TEST_MODE         'true' | 'false' (default: 'true') — solo informativo para el UI
 *
 * El modo (sandbox/producción) en Wompi lo determina el prefijo de las llaves
 * (pub_test_ vs pub_prod_), no una variable aparte.
 */

export function wompiPublicKey(): string {
  const v = process.env.WOMPI_PUBLIC_KEY;
  if (!v) throw new Error('WOMPI_PUBLIC_KEY no configurada');
  return v;
}

export function wompiPrivateKey(): string {
  const v = process.env.WOMPI_PRIVATE_KEY;
  if (!v) throw new Error('WOMPI_PRIVATE_KEY no configurada');
  return v;
}

export function wompiIntegritySecret(): string {
  const v = process.env.WOMPI_INTEGRITY_SECRET;
  if (!v) throw new Error('WOMPI_INTEGRITY_SECRET no configurada');
  return v;
}

export function wompiEventsSecret(): string {
  const v = process.env.WOMPI_EVENTS_SECRET;
  if (!v) throw new Error('WOMPI_EVENTS_SECRET no configurada');
  return v;
}

export const WOMPI_TEST_MODE: boolean =
  (process.env.WOMPI_TEST_MODE ?? 'true').toLowerCase() !== 'false';

/** URL del Web Checkout (redirect) de Wompi — destino del form GET. */
export const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';

/**
 * Para iniciar checkout necesitamos public key + integrity secret.
 * El events secret es para el webhook; lo incluimos para no dejar pagos
 * "a medias" (cobraríamos sin poder confirmar la orden).
 */
export function hasWompiConfigured(): boolean {
  return Boolean(
    process.env.WOMPI_PUBLIC_KEY &&
      process.env.WOMPI_INTEGRITY_SECRET &&
      process.env.WOMPI_EVENTS_SECRET
  );
}
