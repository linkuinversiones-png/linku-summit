import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Firma HMAC del ID de un ticket para uso en QR.
 *
 * Formato del payload del QR:  `<ticket_id>.<hmac_b64url>`
 *
 * Esto evita que alguien con conocimiento de la URL/forma del QR fabrique
 * QRs falsos: el HMAC requiere conocer QR_HMAC_SECRET (solo en server).
 *
 * En portería el endpoint server valida el QR antes de marcar `used_at`.
 */

function getSecret(): string {
  const s = process.env.QR_HMAC_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'QR_HMAC_SECRET no configurada o muy corta (mínimo 16 caracteres).'
    );
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function signTicketId(ticketId: string): string {
  const mac = createHmac('sha256', getSecret()).update(ticketId).digest();
  return `${ticketId}.${b64url(mac)}`;
}

/**
 * Verifica un token QR. Retorna el ticketId si es válido, null si no.
 * Usa comparación constant-time para evitar timing attacks.
 */
export function verifyTicketToken(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const ticketId = token.slice(0, dot);
  const providedB64 = token.slice(dot + 1);
  if (!ticketId || !providedB64) return null;

  const expected = createHmac('sha256', getSecret()).update(ticketId).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(
      providedB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    );
  } catch {
    return null;
  }
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? ticketId : null;
}
