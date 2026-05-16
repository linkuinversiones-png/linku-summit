import { createHash, timingSafeEqual } from 'node:crypto';
import { epaycoCustomerId, epaycoPKey } from './config';

/**
 * Firma del Checkout estándar de ePayco (campo `p_signature` del form).
 *
 * ePayco exige enviar `p_signature` calculada como:
 *   md5( p_cust_id_cliente ^ p_key ^ p_id_invoice ^ p_amount ^ p_currency_code )
 *
 * Donde `^` es el carácter literal `^` (caret), no XOR.
 *
 * NOTA: para el webhook (x_signature) ePayco SÍ usa SHA256 — ver
 * `verifyConfirmationSignature` abajo. No confundir.
 *
 * Docs (plugin oficial Magento + PrestaShop):
 * https://github.com/epayco/Plugin_ePayco_Magento
 */
export function signCheckout(input: {
  invoiceId: string;
  amount: number; // En unidades de moneda (COP entero, no centavos).
  currency: string; // 'COP'
}): string {
  const { invoiceId, amount, currency } = input;
  const custId = epaycoCustomerId();
  const pKey = epaycoPKey();
  const payload = `${custId}^${pKey}^${invoiceId}^${amount}^${currency}`;
  return createHash('md5').update(payload).digest('hex');
}

/**
 * Verifica la firma `x_signature` de la confirmación (webhook) de ePayco.
 *
 * ePayco envía:
 *   - x_ref_payco        ID de la transacción en ePayco
 *   - x_transaction_id   ID propio (varía según método de pago)
 *   - x_amount           monto pagado
 *   - x_currency_code    'COP'
 *   - x_signature        sha256( p_cust_id_cliente ^ p_key ^ x_ref_payco ^ x_transaction_id ^ x_amount ^ x_currency_code )
 *
 * Docs: https://docs.epayco.co/payments/checkout#respuestas-y-confirmacion
 */
export function verifyConfirmationSignature(params: {
  xRefPayco: string;
  xTransactionId: string;
  xAmount: string;
  xCurrencyCode: string;
  xSignature: string;
}): boolean {
  const { xRefPayco, xTransactionId, xAmount, xCurrencyCode, xSignature } =
    params;
  if (!xSignature) return false;
  const custId = epaycoCustomerId();
  const pKey = epaycoPKey();
  const payload = `${custId}^${pKey}^${xRefPayco}^${xTransactionId}^${xAmount}^${xCurrencyCode}`;
  const expected = createHash('sha256').update(payload).digest('hex');

  // timingSafeEqual contra timing attacks
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(xSignature.toLowerCase(), 'hex');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Genera una referencia única para órdenes (p_id_invoice). */
export function generateOrderReference(prefix = 'LSUMMIT26'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}

/**
 * Mapea `x_cod_response` de ePayco a nuestro `orders.status`.
 *
 * Códigos ePayco:
 *   1  Aceptada
 *   2  Rechazada
 *   3  Pendiente
 *   4  Fallida
 *   6  Reversada
 *   7  Retenida
 *   8  Iniciada
 *   9  Expirada
 *  10  Abandonada
 *  11  Cancelada
 */
export function mapResponseCodeToStatus(
  code: string | number | undefined
): 'paid' | 'failed' | 'pending' | 'expired' | null {
  const n = typeof code === 'string' ? parseInt(code, 10) : code;
  switch (n) {
    case 1:
      return 'paid';
    case 2:
    case 4:
    case 11:
      return 'failed';
    case 3:
    case 7:
    case 8:
      return 'pending';
    case 9:
    case 10:
      return 'expired';
    default:
      return null;
  }
}
