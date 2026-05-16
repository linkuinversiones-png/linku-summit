import QRCode from 'qrcode';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ticketScanUrl } from './render';

/**
 * Genera el QR de un ticket como PNG y lo sube a Supabase Storage.
 * Retorna la URL pública del bucket, apta para usar en `<img src="...">`
 * en emails HTML (Gmail bloquea data: URLs, por eso no usamos data URL).
 *
 * Bucket: `summit-media`, carpeta `qrs/`, archivo `<ticketId>.png`.
 *
 * Idempotente: si el QR ya existe, hace upsert (sobreescribe).
 */
export async function uploadTicketQr(
  sb: SupabaseClient,
  ticketId: string,
  size = 320
): Promise<string> {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'summit-media';
  const path = `qrs/${ticketId}.png`;

  const buffer = await QRCode.toBuffer(ticketScanUrl(ticketId), {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#050814', light: '#ffffff' }
  });

  const { error } = await sb.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000', // 1 año (QRs son inmutables)
      upsert: true
    });

  if (error) {
    throw new Error(`No se pudo subir QR a Storage: ${error.message}`);
  }

  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
