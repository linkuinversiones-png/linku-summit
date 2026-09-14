import Link from 'next/link';
import { Send, CheckCircle2, XCircle, Clock, AlertTriangle, Ban } from 'lucide-react';
import { getIncontactoOverview, type IncontactoRow } from '@/lib/admin/incontacto';
import { SyncOneButton, SyncPendingButton } from './SyncButtons';

export const metadata = { title: 'InContacto · Admin · LINKU CAPITAL SUMMIT 2026' };
export const dynamic = 'force-dynamic';

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

const METHOD: Record<string, string> = {
  wompi: 'Wompi',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  bono: 'Bono',
  cortesia: 'Cortesía',
  otro: 'Otro'
};

type Filter = 'todas' | 'faltan' | 'error' | 'enviadas' | 'bloqueadas';

function matches(r: IncontactoRow, f: Filter): boolean {
  switch (f) {
    case 'faltan':
      return r.sync !== 'sent' && r.canSend;
    case 'error':
      return r.sync === 'error';
    case 'enviadas':
      return r.sync === 'sent';
    case 'bloqueadas':
      return !r.canSend;
    default:
      return true;
  }
}

export default async function AdminIncontactoPage(props: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f } = await props.searchParams;
  const filter: Filter = (['todas', 'faltan', 'error', 'enviadas', 'bloqueadas'] as Filter[]).includes(
    f as Filter
  )
    ? (f as Filter)
    : 'todas';

  const { rows, configured, counts } = await getIncontactoOverview();
  const visible = rows.filter((r) => matches(r, filter));
  const pendingSendable = rows.filter((r) => r.sync !== 'sent' && r.canSend).length;

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-bold tracking-tightish text-linku-text">
            <Send size={26} className="text-linku-coral" /> InContacto
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-linku-text-muted">
            Acreditación de asistentes. Cada venta pagada debe llegar a InContacto para que la
            persona pueda entrar al evento. Aquí ves cuáles llegaron, cuáles fallaron y cuáles
            nunca se enviaron, y puedes reenviar las que falten.
          </p>
        </div>
        <SyncPendingButton pendingCount={configured ? pendingSendable : 0} />
      </header>

      {!configured && (
        <p className="mb-6 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            El token de InContacto no está configurado en este servidor. Ningún envío va a
            funcionar hasta que exista la variable INCONTACTO_API_TOKEN.
          </span>
        </p>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat href="?f=todas" active={filter === 'todas'} icon={Send} label="Pagadas" value={counts.total} tone="coral" />
        <Stat href="?f=enviadas" active={filter === 'enviadas'} icon={CheckCircle2} label="En InContacto" value={counts.sent} tone="emerald" />
        <Stat href="?f=faltan" active={filter === 'faltan'} icon={Clock} label="Sin enviar" value={counts.never - counts.blocked} tone="amber" />
        <Stat href="?f=error" active={filter === 'error'} icon={XCircle} label="Con error" value={counts.error} tone="red" />
        <Stat href="?f=bloqueadas" active={filter === 'bloqueadas'} icon={Ban} label="Sin documento" value={counts.blocked} tone="zinc" />
      </section>

      <div className="overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
        {visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Send size={32} className="mx-auto text-linku-text-dim" />
            <p className="mt-3 text-sm text-linku-text-muted">
              {rows.length === 0
                ? 'Todavía no hay ventas pagadas.'
                : 'Ninguna venta coincide con este filtro.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-linku-bg-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
                <tr>
                  <th className="px-4 py-3">Asistente</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Empresa y cargo</th>
                  <th className="px-4 py-3">Entrada</th>
                  <th className="px-4 py-3">Pagada</th>
                  <th className="px-4 py-3">InContacto</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.order_id} className="border-t border-linku-border transition hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="text-linku-text">{r.buyer_name || '—'}</p>
                      <p className="text-[11px] text-linku-text-dim">{r.buyer_email || 'sin correo'}</p>
                      {r.buyer_phone && (
                        <p className="text-[11px] text-linku-text-dim">{r.buyer_phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-linku-text-muted">
                      {r.buyer_doc_number ? (
                        `${r.buyer_doc_type ?? 'CC'} ${r.buyer_doc_number}`
                      ) : (
                        <span className="text-amber-300">Falta</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-linku-text-muted">
                      <p>{r.buyer_company || '—'}</p>
                      {r.buyer_position && (
                        <p className="text-[11px] text-linku-text-dim">{r.buyer_position}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-linku-text-muted">
                      <p>{r.tier_name}</p>
                      {r.payment_method && (
                        <p className="text-[11px] text-linku-text-dim">
                          {METHOD[r.payment_method] ?? r.payment_method}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-linku-text-muted">{fmtDate(r.paid_at)}</td>
                    <td className="px-4 py-3">
                      <SyncBadge r={r} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <SyncOneButton
                          orderId={r.order_id}
                          alreadySent={r.sync === 'sent'}
                          disabled={!r.canSend || !configured}
                          title={r.blockedReason ?? undefined}
                        />
                        <Link
                          href={`/admin/orders/${r.order_id}`}
                          className="text-[11px] font-semibold text-linku-coral hover:text-linku-coral-soft"
                        >
                          Ver venta →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-linku-text-dim">
        InContacto solo ofrece un endpoint de registro, no de consulta. &quot;En InContacto&quot;
        significa que su API aceptó el envío o respondió que ese documento ya estaba registrado.
        Para verificar contra su base hay que mirar su panel.
      </p>
    </div>
  );
}

function SyncBadge({ r }: { r: IncontactoRow }) {
  if (r.sync === 'sent') {
    return (
      <div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
          <CheckCircle2 size={11} /> Enviado
        </span>
        <p className="mt-1 text-[11px] text-linku-text-dim">{fmtDate(r.synced_at)}</p>
      </div>
    );
  }
  if (r.sync === 'error') {
    return (
      <div>
        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-300">
          <XCircle size={11} /> Error
        </span>
        <p className="mt-1 max-w-[260px] text-[11px] text-red-200/80">{r.error}</p>
        <p className="text-[11px] text-linku-text-dim">{fmtDate(r.synced_at)}</p>
      </div>
    );
  }
  if (!r.canSend) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-500/30 bg-zinc-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
        <Ban size={11} /> Sin documento
      </span>
    );
  }
  return (
    <div>
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
        <Clock size={11} /> {r.sync === 'skipped' ? 'Omitido' : 'Sin enviar'}
      </span>
      {r.error && <p className="mt-1 max-w-[260px] text-[11px] text-linku-text-dim">{r.error}</p>}
    </div>
  );
}

function Stat({
  href,
  active,
  icon: Icon,
  label,
  value,
  tone
}: {
  href: string;
  active: boolean;
  icon: typeof Send;
  label: string;
  value: number;
  tone: 'coral' | 'emerald' | 'amber' | 'red' | 'zinc';
}) {
  const toneClass: Record<typeof tone, string> = {
    coral: 'text-linku-coral',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    red: 'text-red-300',
    zinc: 'text-zinc-300'
  };
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 transition ${
        active ? 'border-linku-coral/50 bg-linku-coral/5' : 'border-linku-border-2 bg-linku-bg-2 hover:border-white/20'
      }`}
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
        <Icon size={12} className={toneClass[tone]} />
        {label}
      </div>
      <p className="mt-2 text-xl font-bold tracking-tightish text-linku-text">{value}</p>
    </Link>
  );
}
