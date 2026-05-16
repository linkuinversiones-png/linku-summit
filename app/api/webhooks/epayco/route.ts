import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerSb } from '@supabase/supabase-js';
import {
  verifyConfirmationSignature,
  mapResponseCodeToStatus
} from '@/lib/epayco/signatures';
import { renderTicketQrDataUrl } from '@/lib/qr/render';
import { sendEmail } from '@/lib/email/send';
import { ticketConfirmedEmail } from '@/lib/email/templates';
import type { Locale } from '@/lib/i18n/config';

/**
 * Webhook que recibe la confirmación (server-to-server) de ePayco.
 *
 * Flujo:
 *   1. Lee el form-urlencoded del request (ePayco no manda JSON).
 *   2. Verifica `x_signature` con EPAYCO_P_KEY.
 *   3. Busca la orden por payment_reference (= x_id_invoice).
 *   4. Si x_cod_response = 1 (Aceptada):
 *        - marca orden 'paid' (idempotente)
 *        - emite tickets_issued con qr_code random + HMAC del id
 *        - dispara email con boleta+QR via Resend
 *   5. Si 2/4/11 (Rechazada/Fallida/Cancelada): marca orden 'failed'.
 *   6. Otros: deja la orden en estado actual.
 *
 * Siempre retorna 200 a ePayco (los reintenta solo en 5xx).
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

/** Soporta tanto application/x-www-form-urlencoded como JSON. */
async function readPayload(
  request: NextRequest
): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await request.json()) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(body)) out[k] = String(v ?? '');
    return out;
  }
  const form = await request.formData();
  const out: Record<string, string> = {};
  form.forEach((v, k) => {
    out[k] = typeof v === 'string' ? v : '';
  });
  return out;
}

export async function POST(request: NextRequest) {
  let payload: Record<string, string>;
  try {
    payload = await readPayload(request);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid payload' },
      { status: 400 }
    );
  }

  const xSignature = payload['x_signature'] ?? '';
  const xRefPayco = payload['x_ref_payco'] ?? '';
  const xTransactionId = payload['x_transaction_id'] ?? '';
  const xAmount = payload['x_amount'] ?? '';
  const xCurrencyCode = payload['x_currency_code'] ?? '';
  const xIdInvoice = payload['x_id_invoice'] ?? '';
  const xCodResponse = payload['x_cod_response'] ?? '';

  if (!xIdInvoice) {
    return NextResponse.json(
      { ok: false, error: 'missing x_id_invoice' },
      { status: 400 }
    );
  }

  const sigValid = verifyConfirmationSignature({
    xRefPayco,
    xTransactionId,
    xAmount,
    xCurrencyCode,
    xSignature
  });

  if (!sigValid) {
    return NextResponse.json(
      { ok: false, error: 'invalid signature' },
      { status: 401 }
    );
  }

  const sb = serviceClient();

  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('*')
    .eq('payment_reference', xIdInvoice)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ ok: true, note: 'order not found' });
  }

  const newStatus = mapResponseCodeToStatus(xCodResponse);

  // Idempotencia: si ya está paid, no volver a emitir tickets ni email.
  if (order.status === 'paid' && newStatus === 'paid') {
    return NextResponse.json({ ok: true, note: 'already paid' });
  }

  if (newStatus === 'paid') {
    await sb
      .from('orders')
      .update({
        status: 'paid',
        payment_provider_id: xRefPayco,
        paid_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Emitir 1 ticket (MVP: 1 orden = 1 boleta).
    const { data: { user } = { user: null } } =
      await sb.auth.admin.getUserById(order.user_id);
    const attendeeEmail = user?.email ?? '';
    const attendeeName =
      ((user?.user_metadata as Record<string, unknown> | undefined)
        ?.full_name as string | undefined) ??
      attendeeEmail.split('@')[0] ??
      '';

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

    // Incrementar sold_count (no atómico; OK para MVP).
    const { data: tierCount } = await sb
      .from('ticket_tiers')
      .select('sold_count')
      .eq('slug', order.ticket_tier)
      .single();
    await sb
      .from('ticket_tiers')
      .update({ sold_count: (tierCount?.sold_count ?? 0) + 1 })
      .eq('slug', order.ticket_tier);

    const { data: tierRow } = await sb
      .from('ticket_tiers')
      .select('name_es, name_en')
      .eq('slug', order.ticket_tier)
      .single();

    const locale: Locale = 'es'; // TODO leer locale de perfil / orden
    const tierName =
      locale === 'es'
        ? tierRow?.name_es ?? order.ticket_tier
        : tierRow?.name_en ?? order.ticket_tier;

    if (attendeeEmail) {
      const qrDataUrl = await renderTicketQrDataUrl(ticket.id);
      const { subject, html } = ticketConfirmedEmail({
        locale,
        attendeeName: attendeeName || attendeeEmail,
        orderRef: order.payment_reference,
        totalCop: formatCop(order.total_cop),
        tickets: [
          { qrDataUrl, tierName, qrCodeShort: ticket.qr_code.slice(0, 8) }
        ]
      });
      const result = await sendEmail({ to: attendeeEmail, subject, html });
      if (!result.ok) console.error('Resend error:', result.error);
    }
  } else if (newStatus === 'failed') {
    await sb
      .from('orders')
      .update({
        status: 'failed',
        payment_provider_id: xRefPayco
      })
      .eq('id', order.id);
  } else if (newStatus === 'expired') {
    await sb
      .from('orders')
      .update({
        status: 'expired',
        payment_provider_id: xRefPayco
      })
      .eq('id', order.id);
  }
  // pending / null → no tocamos la orden, esperamos otra confirmación

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
