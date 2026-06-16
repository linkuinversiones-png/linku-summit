import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, XCircle, Mail, ExternalLink } from 'lucide-react';
import { formatCop } from '@/lib/tickets';
import { getOrderEnrichedById, type OrderRow } from '@/lib/admin/orders';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<OrderRow['status'], string> = {
  paid: 'Pagada',
  pending: 'Pendiente',
  failed: 'Fallida',
  refunded: 'Reembolsada',
  expired: 'Expirada'
};

const STATUS_BADGE: Record<OrderRow['status'], string> = {
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  failed: 'bg-red-500/15 text-red-300 border-red-500/30',
  refunded: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  expired: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function OrderDetailPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const order = await getOrderEnrichedById(params.id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-linku-text-muted transition hover:text-linku-coral"
      >
        <ArrowLeft size={14} /> Ventas
      </Link>

      <header className="mt-3 mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-mono text-linku-text-dim">{order.payment_reference}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tightish text-linku-text">
            {formatCop(order.total_cop)}
          </h1>
        </div>
        <span
          className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-linku-border-2 bg-linku-bg-2 p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-linku-coral">
            Comprador
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Nombre" value={order.user_full_name || '—'} />
            <Row
              label="Email"
              value={
                order.user_email ? (
                  <a
                    href={`mailto:${order.user_email}`}
                    className="inline-flex items-center gap-1.5 text-linku-coral hover:text-linku-coral-soft"
                  >
                    <Mail size={12} /> {order.user_email}
                  </a>
                ) : (
                  '—'
                )
              }
            />
            <Row label="User ID" value={<code className="text-[11px] text-linku-text-dim">{order.user_id}</code>} />
          </dl>
        </section>

        <section className="rounded-2xl border border-linku-border-2 bg-linku-bg-2 p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-linku-coral">
            Pago
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Tier" value={`${order.tier_name} (${order.ticket_tier})`} />
            <Row label="Subtotal" value={formatCop(order.subtotal_cop)} />
            {order.discount_cop > 0 && (
              <Row
                label={`Descuento${order.coupon_code ? ' · ' + order.coupon_code : ''}`}
                value={`− ${formatCop(order.discount_cop)}`}
              />
            )}
            <Row label="Total" value={<strong className="text-linku-text">{formatCop(order.total_cop)}</strong>} />
            <Row label="Creada" value={fmtDate(order.created_at)} />
            <Row label="Pagada" value={fmtDate(order.paid_at)} />
            <Row
              label="Ref. Wompi"
              value={order.payment_provider_id ?? <span className="text-linku-text-dim">—</span>}
            />
          </dl>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-linku-border-2 bg-linku-bg-2 p-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-linku-coral">
          Boleta emitida
        </h2>
        {order.ticket ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Row label="Asistente" value={order.ticket.attendee_name || '—'} />
            <Row label="Email asistente" value={order.ticket.attendee_email || '—'} />
            <Row
              label="Estado"
              value={
                order.ticket.used_at ? (
                  <span className="inline-flex items-center gap-1.5 text-sky-300">
                    <CheckCircle2 size={14} /> Usada el {fmtDate(order.ticket.used_at)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 size={14} /> Activa (no escaneada)
                  </span>
                )
              }
            />
            <Row label="QR ID corto" value={<code className="font-mono text-xs text-linku-text-dim">{order.ticket.qr_code.slice(0, 12)}…</code>} />
            <Row label="Ticket UUID" value={<code className="font-mono text-xs text-linku-text-dim">{order.ticket.id}</code>} />
            <Row label="Emitida" value={fmtDate(order.ticket.created_at)} />
          </div>
        ) : (
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-300">
            {order.status === 'paid' ? (
              <>
                <XCircle size={14} /> Pago confirmado pero no se emitió boleta. Revisar logs del webhook.
              </>
            ) : (
              <>
                <Clock size={14} /> La boleta se emite cuando Wompi confirma el pago.
              </>
            )}
          </p>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs uppercase tracking-wide text-linku-text-dim">{label}</dt>
      <dd className="text-right text-sm text-linku-text">{value}</dd>
    </div>
  );
}
