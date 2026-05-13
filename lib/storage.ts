/**
 * Resuelve la URL de una imagen según su forma:
 * - null  → null (la UI muestra placeholder)
 * - http(s)://...  → se devuelve tal cual
 * - /algo/...  → se asume archivo local en /public/
 * - cualquier otra cosa → se asume path dentro del bucket de Supabase Storage
 *   y se construye la URL pública completa.
 *
 * Esto permite mezclar imágenes locales y de Supabase en los mismos JSON
 * sin tocar componentes.
 */
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'summit-media';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return path;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
