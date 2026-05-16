import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/orders/status?ref=<payment_reference>
 *
 * Devuelve { status } de la orden del usuario autenticado.
 * Usado por la página /checkout/success para polling.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const ref = request.nextUrl.searchParams.get('ref');
  if (!ref) {
    return NextResponse.json({ error: 'missing ref' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .eq('payment_reference', ref)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ status: data.status });
}
