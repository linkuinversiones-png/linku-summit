/**
 * ePayco configuration helpers.
 *
 * Env vars (lee de process.env):
 *   - EPAYCO_CUSTOMER_ID         P_CUST_ID_CLIENTE — id numérico del comercio
 *   - EPAYCO_PUBLIC_KEY          PUBLIC_KEY — llave pública (form / SDK)
 *   - EPAYCO_PRIVATE_KEY         PRIVATE_KEY — para consumir API REST server-side
 *   - EPAYCO_P_KEY               P_KEY — secret para firmar SHA256 y validar webhooks
 *   - EPAYCO_TEST_MODE           'true' | 'false' (default: 'true')
 */

export function epaycoCustomerId(): string {
  const v = process.env.EPAYCO_CUSTOMER_ID;
  if (!v) throw new Error('EPAYCO_CUSTOMER_ID no configurada');
  return v;
}

export function epaycoPublicKey(): string {
  const v = process.env.EPAYCO_PUBLIC_KEY;
  if (!v) throw new Error('EPAYCO_PUBLIC_KEY no configurada');
  return v;
}

export function epaycoPrivateKey(): string {
  const v = process.env.EPAYCO_PRIVATE_KEY;
  if (!v) throw new Error('EPAYCO_PRIVATE_KEY no configurada');
  return v;
}

export function epaycoPKey(): string {
  const v = process.env.EPAYCO_P_KEY;
  if (!v) throw new Error('EPAYCO_P_KEY no configurada');
  return v;
}

export const EPAYCO_TEST_MODE: boolean =
  (process.env.EPAYCO_TEST_MODE ?? 'true').toLowerCase() !== 'false';

/** URL del Checkout estándar de ePayco (form POST destination). */
export const EPAYCO_CHECKOUT_URL = 'https://secure.payco.co/checkout.php';

export function hasEpaycoConfigured(): boolean {
  return Boolean(
    process.env.EPAYCO_CUSTOMER_ID &&
      process.env.EPAYCO_PUBLIC_KEY &&
      process.env.EPAYCO_PRIVATE_KEY &&
      process.env.EPAYCO_P_KEY
  );
}
