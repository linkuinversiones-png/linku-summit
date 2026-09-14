import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Phone,
  Send,
  Ticket,
  UserRound,
  XCircle
} from 'lucide-react';
import { formatCop } from '@/lib/tickets';
import {
  getOrderEnrichedById,
  getOrderStatusLog,
  type OrderStatus
} from '@/lib/admin/orders';
import { REASON_LABEL } from '@/lib/orders/status-log';
import StatusPanel from '../StatusPanel';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Pagada',
  pending: 'Pendiente',
  failed: 'Fallida',
  refunded: 'Reembolsada',
  expired: 'Expirada'
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  failed: 'bg-red-500/15 text-red-300 border-red-500/30',
  refunded: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  expired: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
};

const METHOD_LABEL: Record<string, string> = {
  wompi: 'Wompi',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  bono: 'Bono',
  cortesia: 'Cortesía',
  otro: 'Otro'
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

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const [order, log] = await Promise.all([
    getOrderEnrichedById(params.id),
    getOrderStatusLog(params.id)
  ]);
  if (!order) notFound();

  const canMarkPaid = ['pending', 'failed', 'expired'].includes(order.status);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-linku-text-muted transition hover:text-linku-coral"
      >
        <ArrowLeft size={14} /> Ventas
      </Link>

      <header className="mb-8 mt-3 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="font-mono text-xs text-linku-text-dim">{order.payment_reference}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tightish text-linku-text">
            {formatCop(order.total_cop)}
          </h1>
          <p className="mt-1 text-sm text-linku-text-muted">
            {order.tier_name}
            {order.payment_method ? ` · ${METHOD_LABEL[order.payment_method] ?? order.payment_method}` : ''}
            {order.is_guest ? ' · compra sin cuenta' : ''}
          </p>
        </div>
        <span
          className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Comprador" icon={<UserRound size={13} />}>
          <Row label="Nombre" value={order.display_name ?? '—'} />
          <Row
            label="Correo"
            value={
              order.display_email ? (
                <a
                  href={`mailto:${order.display_email}`}
                  className="inline-flex items-center gap-1.5 text-linku-coral hover:text-linku-coral-soft"
                >
                  <Mail size={12} /> {order.display_email}
                </a>
              ) : (
                '—'
              )
            }
          />
          <Row
            label="Teléfono"
            value={
              order.buyer_phone ? (
                <a
                  href={`tel:${order.buyer_phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-linku-coral hover:text-linku-coral-soft"
                >
                  <Phone size={12} /> {order.buyer_phone}
                </a>
              ) : (
                '—'
              )
            }
          />
          <Row
            label="Documento"
            value={
              order.buyer_doc_number
                ? `${order.buyer_doc_type ?? 'CC'} ${order.buyer_doc_number}`
                : '—'
            }
          />
          <Row label="Empresa" value={order.buyer_company || '—'} />
          <Row label="Cargo" value={order.buyer_position || '—'} />
          <Row
            label="LinkedIn"
            value={
              order.buyer_linkedin ? (
                <a
                  href={order.buyer_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-linku-coral hover:text-linku-coral-soft"
                >
                  Perfil <ExternalLink size={11} />
                </a>
              ) : (
                '—'
              )
            }
          />
          <Row
            label="Cuenta"
            value={
              order.is_guest ? (
                <span className="text-linku-text-dim">
                  Sin cuenta todavía (se vincula al registrarse)
                </span>
              ) : (
                order.account_email ?? order.user_id
              )
            }
          />
        </Card>

        <Card title="Pago" icon={<Ticket size={13} />}>
          <Row label="Subtotal" value={formatCop(order.subtotal_cop)} />
          <Row
            label="Descuento"
            value={
              order.discount_cop > 0
                ? `−${formatCop(order.discount_cop)}${order.coupon_code ? ` · cupón ${order.coupon_code}` : ''}`
                : '—'
            }
          />
          <Row label="Total" value={<strong>{formatCop(order.total_cop)}</strong>} />
          <Row
            label="Medio"
            value={
              order.payment_method
                ? METHOD_LABEL[order.payment_method] ?? order.payment_method
                : '—'
            }
          />
          <Row
            label="ID pasarela"
            value={
              order.payment_provider_id ? (
                <code className="text-[11px] text-linku-text-dim">
                  {order.payment_provider_id}
                </code>
              ) : (
                '—'
              )
            }
          />
          <Row label="Creada" value={fmtDate(order.created_at)} />
          <Row label="Pagada" value={fmtDate(order.paid_at)} />
        </Card>

        <Card title="Acreditación InContacto" icon={<Send size={13} />}>
          <Row label="Estado" value={<IncontactoBadge order={order} />} />
          <Row label="Último intento" value={fmtDate(order.incontacto_synced_at)} />
          {order.incontacto_error && (
            <Row
              label="Detalle"
              value={
                <span className="text-xs text-amber-200">{order.incontacto_error}</span>
              }
            />
          )}
          {!order.buyer_doc_number && (
            <p className="mt-2 text-[11px] text-linku-text-dim">
              Sin número de documento no se puede registrar: InContacto identifica a cada
              asistente por ese campo.
            </p>
          )}
        </Card>

        <Card title="Boleta" icon={<Ticket size={13} />}>
          {order.ticket ? (
            <>
              <Row
                label="Estado"
                value={
                  order.ticket.used_at ? (
                    <span className="inline-flex items-center gap-1 text-sky-300">
                      <CheckCircle2 size={12} /> Usada el {fmtDate(order.ticket.used_at)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <CheckCircle2 size={12} /> Activa
                    </span>
                  )
                }
              />
              <Row
                label="Código QR"
                value={
                  <code className="text-[11px] text-linku-text-dim">
                    {order.ticket.qr_code}
                  </code>
                }
              />
              <Row label="A nombre de" value={order.ticket.attendee_name || '—'} />
              <Row label="Emitida" value={fmtDate(order.ticket.created_at)} />
            </>
          ) : (
            <p className="text-sm text-linku-text-muted">
              {order.status === 'paid'
                ? 'La venta está pagada pero no tiene boleta emitida. Vuelve a marcarla como pagada para reintentar la emisión.'
                : 'Todavía no hay boleta. Se emite cuando la venta pasa a pagada.'}
            </p>
          )}
        </Card>

        {!order.billing_same && (
          <Card title="Facturación" icon={<Building2 size={13} />}>
            <Row label="Nombre" value={order.billing_name || '—'} />
            <Row
              label="Documento"
              value={
                order.billing_doc_number
                  ? `${order.billing_doc_type ?? ''} ${order.billing_doc_number}`.trim()
                  : '—'
              }
            />
            <Row label="Correo" value={order.billing_email || '—'} />
            <Row label="Dirección" value={order.billing_address || '—'} />
          </Card>
        )}

        <StatusPanel
          orderId={order.id}
          status={order.status}
          canMarkPaid={canMarkPaid}
          incontactoStatus={order.incontacto_status}
        />
      </div>

      <section className="mt-5 rounded-2xl border border-linku-border-2 bg-linku-bg-2 p-6">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-linku-coral">
          <Clock size={13} /> Bitácora de estados
        </h2>
        {log.length === 0 ? (
          <p className="mt-4 text-sm text-linku-text-muted">
            Sin cambios registrados. La bitácora empieza a llenarse con los cambios hechos
            desde que existe esta sección.
          </p>
        ) : (
          <ol className="mt-5 space-y-4">
            {log.map((entry) => (
              <li key={entry.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-linku-coral" />
                <div className="flex-1 border-b border-linku-border pb-4 last:border-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-linku-text">
                    <span className="font-semibold">
                      {entry.from_status
                        ? `${STATUS_LABEL[entry.from_status as OrderStatus] ?? entry.from_status} → ${STATUS_LABEL[entry.to_status as OrderStatus] ?? entry.to_status}`
                        : STATUS_LABEL[entry.to_status as OrderStatus] ?? entry.to_status}
                    </span>
                    <span className="rounded-full border border-linku-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-linku-text-dim">
                      {entry.source}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-linku-coral/80">
                    {REASON_LABEL[entry.reason] ?? entry.reason}
                  </p>
                  {entry.note && (
                    <p className="mt-1 text-xs text-linku-text-muted">{entry.note}</p>
                  )}
                  <p className="mt-1 text-[11px] text-linku-text-dim">
                    {fmtDate(entry.created_at)}
                    {entry.changed_by_email ? ` · ${entry.changed_by_email}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function IncontactoBadge({
  order
}: {
  order: { incontacto_status: string | null; status: string };
}) {
  if (order.incontacto_status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-300">
        <CheckCircle2 size={12} /> Enviado
      </span>
    );
  }
  if (order.incontacto_status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-red-300">
        <XCircle size={12} /> Falló
      </span>
    );
  }
  if (order.incontacto_status === 'skipped') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-300">
        <XCircle size={12} /> Omitido
      </span>
    );
  }
  return (
    <span className="text-linku-text-dim">
      {order.status === 'paid' ? 'Sin registro de envío' : 'Se envía al pagar'}
    </span>
  );
}

function Card({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-linku-border-2 bg-linku-bg-2 p-6">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-linku-coral">
        {icon} {title}
      </h2>
      <dl className="mt-4 space-y-2.5">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
      <dt className="text-[11px] uppercase tracking-[0.12em] text-linku-text-dim">{label}</dt>
      <dd className="text-right text-linku-text-muted">{value}</dd>
    </div>
  );
}
