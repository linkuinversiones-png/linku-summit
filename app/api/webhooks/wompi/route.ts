import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerSb } from '@supabase/supabase-js';
import { verifyEventChecksum, mapWompiStatus } from '@/lib/wompi/signatures';
import { fulfillPaidOrder, type FulfillableOrder } from '@/lib/orders/fulfill';
import { logStatusChange } from '@/lib/orders/status-log';

/**
 * Webhook que recibe los eventos (server-to-server) de Wompi.
 * Se configura en: Wompi Dashboard → Desarrollo → Programadores → "URL de Eventos".
 *
 * Flujo:
 *   1. Lee el JSON del evento.
 *   2. Valida `signature.checksum` con WOMPI_EVENTS_SECRET.
 *   3. Busca la orden por payment_reference (= data.transaction.reference).
 *   4. Si status = APPROVED: marca 'paid' y corre la entrega completa
 *      (boleta + QR, cupón, InContacto, email) en lib/orders/fulfill.
 *   5. Si DECLINED/VOIDED/ERROR: marca la orden 'failed'.
 *   6. PENDING / otros: no toca la orden.
 *
 * Cada cambio de estado queda en order_status_log, igual que los que hace
 * un admin a mano, para que la bitácora cuente la historia completa.
 *
 * Siempre retorna 200 salvo payload/firma inválida (Wompi reintenta en no-2xx).
 */

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no configurada — necesaria para el webhook.'
    );
  }
  return createServerSb(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

type WompiTransaction = {
  id?: string;
  reference?: string;
  status?: string;
  amount_in_cents?: number;
  customer_email?: string;
};

export async function POST(request: NextRequest) {
  let event: {
    data?: { transaction?: WompiTransaction };
    timestamp?: number;
    signature?: { properties?: string[]; checksum?: string };
  };
  try {
    event = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid payload' },
      { status: 400 }
    );
  }

  if (!verifyEventChecksum(event)) {
    return NextResponse.json(
      { ok: false, error: 'invalid signature' },
      { status: 401 }
    );
  }

  const tx = event.data?.transaction;
  const reference = tx?.reference ?? '';
  const providerId = tx?.id ?? '';

  if (!reference) {
    return NextResponse.json(
      { ok: false, error: 'missing reference' },
      { status: 400 }
    );
  }

  const sb = serviceClient();

  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('*')
    .eq('payment_reference', reference)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ ok: true, note: 'order not found' });
  }

  const newStatus = mapWompiStatus(tx?.status);

  // Idempotencia: si ya está paid, no volver a emitir tickets ni email.
  if (order.status === 'paid' && newStatus === 'paid') {
    return NextResponse.json({ ok: true, note: 'already paid' });
  }

  if (newStatus === 'paid') {
    const previous = order.status as string;
    await sb
      .from('orders')
      .update({
        status: 'paid',
        payment_provider_id: providerId,
        payment_method: 'wompi',
        paid_at: new Date().toISOString()
      })
      .eq('id', order.id);

    await logStatusChange(sb, {
      orderId: order.id,
      fromStatus: previous,
      toStatus: 'paid',
      reason: 'pago_wompi',
      note: providerId ? `Transacción Wompi ${providerId}` : null,
      source: 'webhook'
    });

    const result = await fulfillPaidOrder(sb, order as FulfillableOrder);
    if (result.warnings.length > 0) {
      console.error(
        'Entrega con avisos, orden',
        order.payment_reference,
        result.warnings
      );
    }
  } else if (newStatus === 'failed') {
    const previous = order.status as string;
    await sb
      .from('orders')
      .update({
        status: 'failed',
        payment_provider_id: providerId
      })
      .eq('id', order.id);

    await logStatusChange(sb, {
      orderId: order.id,
      fromStatus: previous,
      toStatus: 'failed',
      reason: 'pago_rechazado',
      note: tx?.status ? `Wompi reportó ${tx.status}` : null,
      source: 'webhook'
    });
  }
  // pending / null → no tocamos la orden, esperamos otro evento

  return NextResponse.json({ ok: true });
}
