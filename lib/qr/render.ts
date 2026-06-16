import QRCode from 'qrcode';
import { signTicketId } from './sign';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.linkusummit.com';

/**
 * Construye la URL que codifica el QR. Apunta a la pasarela de validación
 * de portería (`/staff/scan?t=<token>`). Si la URL se escanea sin estar
 * autenticado como staff, no pasa nada — el endpoint valida el rol.
 */
export function ticketScanUrl(ticketId: string): string {
  const token = signTicketId(ticketId);
  return `${SITE_URL}/staff/scan?t=${encodeURIComponent(token)}`;
}

/**
 * Renderiza el QR a data URL PNG (apto para <img src=...> o email HTML).
 */
export async function renderTicketQrDataUrl(
  ticketId: string,
  size = 320
): Promise<string> {
  const url = ticketScanUrl(ticketId);
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#050814', light: '#ffffff' }
  });
}
