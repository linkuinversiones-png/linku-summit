import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerSb } from '@supabase/supabase-js';
import { verifyWompiWebhook } from '@/lib/wompi/signatures';
import { renderTicketQrDataUrl } from '@/lib/qr/render';
import { sendEmail } from '@/lib/email/send';
import { ticketConfirmedEmail } from '@/lib/email/templates';
import type { Locale } from '@/lib/i18n/config';

/**
 * Webhook que recibe eventos `transaction.updated` de Wompi.
 *
 * Flujo:
 *   1. Verifica firma con WOMPI_EVENTS_SECRET.
 *   2. Busca la orden por wompi_reference.
 *   3. Si transaction.status = APPROVED:
 *        - marca orden 'paid' (idempotente)
 *        - emite tickets_issued con qr_code = HMAC(ticket.id)
 *        - dispara email con boleta+QR via Resend
 *   4. Si DECLINED/VOIDED/ERROR: marca orden 'failed'.
 *
 * Siempre retorna 200 a Wompi (los reintenta solo en 5xx).
 */

// Service role: necesario para escribir aunque el webhook no esté autenticado.
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

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  if (!verifyWompiWebhook(body)) {
    return NextResponse.json(
      { ok: false, error: 'invalid signature' },
      { status: 401 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = (body as any)?.data?.transaction;
  if (!tx?.reference || !tx?.status) {
    return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 });
  }

  const reference: string = tx.reference;
  const status: string = tx.status; // APPROVED | DECLINED | VOIDED | ERROR | PENDING
  const wompiId: string = tx.id;

  const sb = serviceClient();

  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('*')
    .eq('wompi_reference', reference)
    .single();

  if (orderErr || !order) {
    // No respondemos error: Wompi reintentaría. La orden no existe en nuestra DB.
    return NextResponse.json({ ok: true, note: 'order not found' });
  }

  // Idempotencia: si ya está paid, no volver a emitir tickets ni email.
  if (order.status === 'paid' && status === 'APPROVED') {
    return NextResponse.json({ ok: true, note: 'already paid' });
  }

  if (status === 'APPROVED') {
    await sb
      .from('orders')
      .update({
        status: 'paid',
        wompi_transaction_id: wompiId,
        paid_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Emitir 1 ticket (MVP: 1 orden = 1 boleta). Cuando soportemos compras
    // múltiples se itera sobre quantity.
    const { data: { user } = { user: null } } = await sb.auth.admin.getUserById(
      order.user_id
    );
    const attendeeEmail = user?.email ?? '';
    const attendeeName =
      ((user?.user_metadata as Record<string, unknown> | undefined)?.full_name as
        | string
        | undefined) ?? attendeeEmail.split('@')[0] ?? '';

    const { data: ticket, error: ticketErr } = await sb
      .from('tickets_issued')
      .insert({
        order_id: order.id,
        user_id: order.user_id,
        qr_code: cryptoRandom(),
        ticket_tier: order.ticket_tier,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail
      })
      .select('id, qr_code')
      .single();

    if (ticketErr || !ticket) {
      console.error('Error emitiendo ticket', ticketErr);
      return NextResponse.json({ ok: true, note: 'ticket emit failed' });
    }

    // Incrementar sold_count del tier (no atómico; OK para MVP — luego mover a RPC).
    const { data: tierCount } = await sb
      .from('ticket_tiers')
      .select('sold_count')
      .eq('slug', order.ticket_tier)
      .single();
    await sb
      .from('ticket_tiers')
      .update({ sold_count: (tierCount?.sold_count ?? 0) + 1 })
      .eq('slug', order.ticket_tier);

    // Lookup tier name + locale
    const { data: tierRow } = await sb
      .from('ticket_tiers')
      .select('name_es, name_en')
      .eq('slug', order.ticket_tier)
      .single();

    // Heurística simple para locale del email: TODO leer de profile o de la orden.
    const locale: Locale = 'es';
    const tierName =
      locale === 'es' ? tierRow?.name_es ?? order.ticket_tier : tierRow?.name_en ?? order.ticket_tier;

    if (attendeeEmail) {
      const qrDataUrl = await renderTicketQrDataUrl(ticket.id);
      const { subject, html } = ticketConfirmedEmail({
        locale,
        attendeeName: attendeeName || attendeeEmail,
        orderRef: order.wompi_reference,
        totalCop: formatCop(order.total_cop),
        tickets: [
          { qrDataUrl, tierName, qrCodeShort: ticket.qr_code.slice(0, 8) }
        ]
      });
      const result = await sendEmail({ to: attendeeEmail, subject, html });
      if (!result.ok) console.error('Resend error:', result.error);
    }
  } else if (status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR') {
    await sb
      .from('orders')
      .update({
        status: 'failed',
        wompi_transaction_id: wompiId
      })
      .eq('id', order.id);
  }

  return NextResponse.json({ ok: true });
}

function cryptoRandom(): string {
  // 24 caracteres random base36 — único pero no firmado.
  // La firma del QR la da el HMAC (lib/qr/sign.ts).
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 14) +
    Math.random().toString(36).slice(2, 10)
  ).toUpperCase();
}

function formatCop(n: number): string {
  return `COP $${Number(n).toLocaleString('es-CO')}`;
}
