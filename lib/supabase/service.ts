import { createClient as createServerSb } from '@supabase/supabase-js';

/**
 * Cliente Supabase con service role. Bypasea RLS y permite escribir
 * en storage sin policies adicionales. SOLO USAR en server actions o
 * route handlers, NUNCA en client components ni en SSR público.
 *
 * Buen patrón: verificar admin con createClient() del request (cookies)
 * y SOLO DESPUÉS usar este service client para operaciones privilegiadas
 * (uploads, bypass RLS en queries cross-user, etc).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no configurada — necesaria para operaciones privilegiadas.'
    );
  }
  return createServerSb(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
