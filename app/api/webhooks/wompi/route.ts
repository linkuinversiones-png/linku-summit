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
 *   7. Si la orden ya está 'paid' (o 'refunded'), cualquier evento posterior se
 *      ignora: una referencia puede tener varios intentos y un DECLINED tardío
 *      no debe revertir un pago aprobado.
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

  // Una referencia de Wompi puede tener varios intentos (transacciones). Un
  // evento tardío de otro intento (p. ej. DECLINED) no puede degradar una
  // orden ya pagada: se ignora, dejando rastro en consola y en la bitácora.
  if (order.status === 'paid') {
    console.warn(
      'Evento Wompi ignorado: la orden ya está pagada. Referencia:',
      reference,
      'transacción:',
      providerId,
      'status reportado:',
      tx?.status
    );
    await logStatusChange(sb, {
      orderId: order.id,
      fromStatus: 'paid',
      toStatus: 'paid',
      reason: 'evento_ignorado',
      note: `Wompi reportó ${tx?.status ?? 'sin status'} (transacción ${providerId || 'sin id'}) después del pago; se ignoró`,
      source: 'webhook'
    });
    return NextResponse.json({ ok: true, note: 'ignored: order already paid' });
  }

  // Un reembolso es definitivo: ningún evento del webhook lo toca.
  if (order.status === 'refunded') {
    console.warn(
      'Evento Wompi ignorado: la orden está reembolsada. Referencia:',
      reference,
      'transacción:',
      providerId,
      'status reportado:',
      tx?.status
    );
    return NextResponse.json({ ok: true, note: 'ignored: order refunded' });
  }

  // Los UPDATE son atómicos: solo aplican si en la base la orden sigue en un
  // estado previo al pago. Así dos eventos simultáneos (APPROVED + DECLINED, o
  // dos APPROVED) no se pisan aunque ambos hayan leído la orden como pendiente.
  const PRE_PAYMENT = ['pending', 'failed', 'expired'];

  if (newStatus === 'paid') {
    const previous = order.status as string;
    const { data: updated, error: updErr } = await sb
      .from('orders')
      .update({
        status: 'paid',
        payment_provider_id: providerId,
        payment_method: 'wompi',
        paid_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .in('status', PRE_PAYMENT)
      .select('id');

    if (updErr) {
      console.error('Webhook Wompi: no se pudo marcar pagada', reference, updErr.message);
      return NextResponse.json({ ok: false, error: 'update failed' }, { status: 500 });
    }
    if (!updated || updated.length === 0) {
      // Otro evento ya cambió la orden (pagada, reembolsada...): no se entrega dos veces.
      return NextResponse.json({ ok: true, note: 'ignored: status changed concurrently' });
    }

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
    const { data: updated, error: updErr } = await sb
      .from('orders')
      .update({
        status: 'failed',
        payment_provider_id: providerId
      })
      .eq('id', order.id)
      .in('status', PRE_PAYMENT)
      .select('id');

    if (updErr) {
      console.error('Webhook Wompi: no se pudo marcar fallida', reference, updErr.message);
      return NextResponse.json({ ok: false, error: 'update failed' }, { status: 500 });
    }
    if (!updated || updated.length === 0) {
      console.warn(
        'Evento Wompi ignorado: el estado cambió en paralelo. Referencia:',
        reference,
        'transacción:',
        providerId,
        'status reportado:',
        tx?.status
      );
      return NextResponse.json({ ok: true, note: 'ignored: status changed concurrently' });
    }

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
