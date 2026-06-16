import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServiceSb } from '@supabase/supabase-js';

/**
 * GET /api/orders/guest-status?ref=<payment_reference>
 *
 * Estado de la orden por referencia, para el polling de la página de éxito
 * (checkout de invitado, sin sesión). La `payment_reference` es aleatoria y
 * actúa como token de capacidad — solo quien compró la conoce.
 */
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada');
  return createServiceSb(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');
  if (!ref) {
    return NextResponse.json({ error: 'missing ref' }, { status: 400 });
  }

  const sb = serviceClient();
  const { data, error } = await sb
    .from('orders')
    .select('status')
    .eq('payment_reference', ref)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ status: data.status });
}
