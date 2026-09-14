import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadTicketQr } from '@/lib/qr/upload';
import { sendEmail } from '@/lib/email/send';
import { ticketConfirmedEmail } from '@/lib/email/templates';
import { registerAttendee, hasIncontactoConfigured } from '@/lib/incontacto';
import type { Locale } from '@/lib/i18n/config';

/**
 * Entrega de una orden pagada: cupón, boleta con QR, cupo del tier,
 * registro en InContacto. El correo con QR existe pero va apagado: la
 * acreditación del asistente la hace InContacto, así que lo que importa es
 * que el registro llegue allá (ver /admin/incontacto).
 *
 * Vive aquí y no en el webhook porque hay dos caminos que llegan al mismo
 * sitio: el pago por Wompi y el alta manual desde /admin/orders (efectivo,
 * bono o cortesía). Los dos tienen que producir exactamente la misma boleta.
 *
 * Nada de esto lanza: cada paso que falla se devuelve en `warnings` para que
 * el caller decida. Un pago confirmado nunca se pierde porque el correo o
 * InContacto estén caídos.
 */

/** Forma mínima de la orden que necesita la entrega. */
export type FulfillableOrder = {
  id: string;
  user_id: string | null;
  ticket_tier: string;
  total_cop: number;
  discount_cop: number;
  coupon_code: string | null;
  payment_reference: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_doc_type: string | null;
  buyer_doc_number: string | null;
  buyer_company: string | null;
  buyer_position: string | null;
  buyer_linkedin: string | null;
};

export type FulfillResult = {
  ticketId: string | null;
  ticketAlreadyExisted: boolean;
  incontacto: 'sent' | 'error' | 'skipped';
  emailSent: boolean;
  warnings: string[];
};

/** Nombre del tier en el idioma pedido, con el slug como último recurso. */
export async function getTierName(
  sb: SupabaseClient,
  slug: string,
  locale: Locale = 'es'
): Promise<string> {
  const { data } = await sb
    .from('ticket_tiers')
    .select('name_es, name_en')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return slug;
  return (locale === 'es' ? data.name_es : data.name_en) || data.name_es || slug;
}

/** Nombre del asistente, cayendo al prefijo del correo si no lo dieron. */
function attendeeNameOf(order: FulfillableOrder): string {
  const email = order.buyer_email ?? '';
  return order.buyer_name || email.split('@')[0] || '';
}

/**
 * Registra al asistente en InContacto y deja el resultado en la orden.
 * Se puede llamar suelto para reintentar desde el admin.
 */
export async function syncOrderToIncontacto(
  sb: SupabaseClient,
  order: FulfillableOrder,
  tierName: string
): Promise<{ status: 'sent' | 'error' | 'skipped'; error?: string }> {
  let status: 'sent' | 'error' | 'skipped';
  let error: string | undefined;

  if (!hasIncontactoConfigured()) {
    status = 'skipped';
    error = 'INCONTACTO_API_TOKEN no configurada';
  } else if (!order.buyer_doc_number) {
    status = 'skipped';
    error = 'La orden no tiene número de documento del comprador';
  } else {
    const reg = await registerAttendee({
      docNumber: order.buyer_doc_number,
      docType: order.buyer_doc_type ?? 'CC',
      fullName: attendeeNameOf(order),
      company: order.buyer_company,
      position: order.buyer_position,
      linkedin: order.buyer_linkedin,
      email: order.buyer_email ?? '',
      phone: order.buyer_phone,
      ticketTierName: tierName
    });
    status = reg.ok ? 'sent' : 'error';
    error = reg.ok ? undefined : reg.error;
  }

  await sb
    .from('orders')
    .update({
      incontacto_status: status,
      incontacto_synced_at: new Date().toISOString(),
      incontacto_error: error ?? null
    })
    .eq('id', order.id);

  return { status, error };
}

/**
 * Corre la entrega completa de una orden que acaba de quedar pagada.
 * Es seguro llamarla dos veces: si la boleta ya existe no emite otra ni
 * vuelve a descontar cupo.
 */
export async function fulfillPaidOrder(
  sb: SupabaseClient,
  order: FulfillableOrder,
  opts: { locale?: Locale; /** Apagado por defecto: la acreditación va por InContacto, no por correo con QR. */ sendTicketEmail?: boolean } = {}
): Promise<FulfillResult> {
  const locale: Locale = opts.locale ?? 'es';
  const warnings: string[] = [];
  const attendeeEmail = order.buyer_email ?? '';
  const attendeeName = attendeeNameOf(order);

  // --- Redención del cupón -------------------------------------------
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
      // 23505 = ya existía (segunda entrega): no volvemos a contar.
      if (!redErr) {
        await sb.rpc('increment_coupon_uses', { coupon_id: coupon.id });
      } else if (redErr.code !== '23505') {
        warnings.push(`Cupón no registrado: ${redErr.message}`);
      }
    }
  }

  // --- Boleta ---------------------------------------------------------
  const { data: existing } = await sb
    .from('tickets_issued')
    .select('id, qr_code')
    .eq('order_id', order.id)
    .maybeSingle();

  let ticketId = existing?.id ?? null;
  let qrCode = existing?.qr_code ?? '';
  const ticketAlreadyExisted = Boolean(existing);

  if (!existing) {
    const { data: ticket, error: ticketErr } = await sb
      .from('tickets_issued')
      .insert({
        order_id: order.id,
        user_id: order.user_id,
        qr_code: randomQrCode(),
        ticket_tier: order.ticket_tier,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail
      })
      .select('id, qr_code')
      .single();

    if (ticketErr || !ticket) {
      warnings.push(`No se pudo emitir la boleta: ${ticketErr?.message ?? 'desconocido'}`);
      return {
        ticketId: null,
        ticketAlreadyExisted: false,
        incontacto: 'skipped',
        emailSent: false,
        warnings
      };
    }
    ticketId = ticket.id;
    qrCode = ticket.qr_code;

    // Cupo vendido del tier. No es atómico; suficiente para este volumen.
    const { data: tierCount } = await sb
      .from('ticket_tiers')
      .select('sold_count')
      .eq('slug', order.ticket_tier)
      .maybeSingle();
    await sb
      .from('ticket_tiers')
      .update({ sold_count: (tierCount?.sold_count ?? 0) + 1 })
      .eq('slug', order.ticket_tier);
  }

  const tierName = await getTierName(sb, order.ticket_tier, locale);

  // --- InContacto ------------------------------------------------------
  const sync = await syncOrderToIncontacto(sb, order, tierName);
  if (sync.status === 'error') {
    warnings.push(`InContacto: ${sync.error ?? 'error desconocido'}`);
  }

  // --- Email con la boleta ---------------------------------------------
  let emailSent = false;
  if (opts.sendTicketEmail === true && attendeeEmail && ticketId) {
    let qrUrl = '';
    try {
      qrUrl = await uploadTicketQr(sb, ticketId);
    } catch (e) {
      warnings.push(`QR no subido: ${e instanceof Error ? e.message : String(e)}`);
    }
    const { subject, html } = ticketConfirmedEmail({
      locale,
      attendeeName: attendeeName || attendeeEmail,
      orderRef: order.payment_reference,
      totalCop: formatCop(order.total_cop),
      tickets: [{ qrDataUrl: qrUrl, tierName, qrCodeShort: qrCode.slice(0, 8) }]
    });
    const result = await sendEmail({ to: attendeeEmail, subject, html });
    emailSent = result.ok;
    if (!result.ok) warnings.push(`Email no enviado: ${result.error ?? 'error de Resend'}`);
  }

  return {
    ticketId,
    ticketAlreadyExisted,
    incontacto: sync.status,
    emailSent,
    warnings
  };
}

/** 24 caracteres base36. La firma del QR la da el HMAC de lib/qr/sign.ts. */
function randomQrCode(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 14) +
    Math.random().toString(36).slice(2, 10)
  ).toUpperCase();
}

function formatCop(n: number): string {
  return `COP $${Number(n).toLocaleString('es-CO')}`;
}
