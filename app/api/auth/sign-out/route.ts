import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Cierra la sesión del usuario. Tiene que correr server-side para que
 * @supabase/ssr borre las cookies httpOnly — el signOut del cliente solo
 * limpia storage local y deja la cookie de sesión viva en el server.
 *
 * POST /api/auth/sign-out
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
