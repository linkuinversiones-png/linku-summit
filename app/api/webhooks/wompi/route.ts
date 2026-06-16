import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerSb } from '@supabase/supabase-js';
import { verifyEventChecksum, mapWompiStatus } from '@/lib/wompi/signatures';
import { uploadTicketQr } from '@/lib/qr/upload';
import { sendEmail } from '@/lib/email/send';
import { ticketConfirmedEmail } from '@/lib/email/templates';
import type { Locale } from '@/lib/i18n/config';

/**
 * Webhook que recibe los eventos (server-to-server) de Wompi.
 * Se configura en: Wompi Dashboard → Desarrollo → Programadores → "URL de Eventos".
 *
 * Flujo:
 *   1. Lee el JSON del evento.
 *   2. Valida `signature.checksum` con WOMPI_EVENTS_SECRET.
 *   3. Busca la orden por payment_reference (= data.transaction.reference).
 *   4. Si status = APPROVED:
 *        - marca orden 'paid' (idempotente)
 *        - emite tickets_issued con qr_code random + HMAC del id
 *        - dispara email con boleta+QR via Resend
 *   5. Si DECLINED/VOIDED/ERROR: marca orden 'failed'.
 *   6. PENDING / otros: no toca la orden.
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
    await sb
      .from('orders')
      .update({
        status: 'paid',
        payment_provider_id: providerId,
        paid_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Si la orden usó un cupón, registrar redención + incrementar contador.
    // El unique(order_id) en coupon_redemptions previene doble-registro si
    // el webhook llega dos veces.
    if (order.coupon_code && order.discount_cop > 0) {
      const { data: coupon } = await sb
        .from('coupons')
        .select('id')
        .eq('code', order.coupon_code)
        .maybeSingle();

      if (coupon) {
        const { error: redErr } = await sb.from('coupon_redemptions').insert({
          coupon_id: coupon.id,
          order_id: order.id,
          user_id: order.user_id,
          code_snapshot: order.coupon_code,
          discount_cop: order.discount_cop
        });
        // Si ya existía (segundo webhook), no incrementamos contador.
        if (!redErr) {
          await sb.rpc('increment_coupon_uses', { coupon_id: coupon.id });
        } else if (redErr.code !== '23505') {
          console.error('Error registrando redemption:', redErr);
        }
      }
    }

    // Emitir 1 ticket (MVP: 1 orden = 1 boleta).
    // Checkout de invitado: los datos vienen de la orden (buyer_*), no de un
    // usuario logueado (user_id puede ser null hasta que se registre por OTP).
    const attendeeEmail = order.buyer_email ?? '';
    const attendeeName =
      order.buyer_name || attendeeEmail.split('@')[0] || '';

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
      let qrUrl: string;
      try {
        qrUrl = await uploadTicketQr(sb, ticket.id);
      } catch (e) {
        console.error('Error subiendo QR a Storage:', e);
        qrUrl = ''; // el email se manda igual, sin QR visible (degradación graceful)
      }
      const { subject, html } = ticketConfirmedEmail({
        locale,
        attendeeName: attendeeName || attendeeEmail,
        orderRef: order.payment_reference,
        totalCop: formatCop(order.total_cop),
        tickets: [
          { qrDataUrl: qrUrl, tierName, qrCodeShort: ticket.qr_code.slice(0, 8) }
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
        payment_provider_id: providerId
      })
      .eq('id', order.id);
  }
  // pending / null → no tocamos la orden, esperamos otro evento

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
