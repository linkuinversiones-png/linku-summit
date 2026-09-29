import Link from 'next/link';
import { AlertTriangle, CheckCircle2, MessageCircle, Mail } from 'lucide-react';
import { formatCop } from '@/lib/tickets';
import { loadFollowups } from '@/lib/admin/followups-data';
import { FOLLOWUP_RESOLUTION_LABEL, type FollowupCase } from '@/lib/admin/followups';
import ResolveFollowupForm from './ResolveFollowupForm';

/** Cuántos casos se muestran antes del "Ver todos". */
const VISIBLE = 6;

/** Correo con forma simple, sin `?`, `&`, espacios ni comas: solo así se enlaza. */
const SAFE_EMAIL_RE = /^[^\s@?&,;<>]+@[^\s@?&,;<>]+\.[^\s@?&,;<>]+$/;

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Panel "Por resolver": compradores con pagos rechazados o pendientes que
 * el equipo debe contactar. La lógica vive en lib/admin/followups.ts.
 */
export default async function FollowupsPanel() {
  const { cases, recentResolved } = await loadFollowups();

  if (cases.length === 0 && recentResolved.length === 0) {
    return (
      <p className="mb-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm text-emerald-300">
        <CheckCircle2 size={14} /> Sin pagos por resolver.
      </p>
    );
  }

  const first = cases.slice(0, VISIBLE);
  const rest = cases.slice(VISIBLE);

  return (
    <section className="mb-8 rounded-2xl border border-amber-500/30 bg-linku-bg-2 p-4">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
        <AlertTriangle size={14} />
        Por resolver ·{' '}
        {cases.length === 1 ? '1 caso' : `${cases.length} casos`}
      </h2>
      <p className="mt-1 text-xs text-linku-text-dim">
        Pagos rechazados o sin completar de compradores que aún no han pagado. Contáctalos y
        ciérralos cuando quede resuelto.
      </p>

      {cases.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-300">Todo al día: no hay casos pendientes.</p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {first.map((c) => (
            <CaseCard key={c.buyerKey} c={c} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-linku-coral hover:text-linku-coral-soft">
            Ver todos ({rest.length} más)
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {rest.map((c) => (
              <CaseCard key={c.buyerKey} c={c} />
            ))}
          </div>
        </details>
      )}

      {recentResolved.length > 0 && (
        <details className="mt-4 border-t border-linku-border pt-3">
          <summary className="cursor-pointer text-xs font-semibold text-linku-text-muted hover:text-linku-text">
            Resueltos recientemente ({recentResolved.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {recentResolved.map((r, i) => (
              <li key={`${r.buyer_key}-${r.resolved_at}-${i}`} className="text-xs text-linku-text-muted">
                <span className="font-semibold text-linku-text">
                  {r.buyer_name || r.buyer_email || r.buyer_key}
                </span>{' '}
                · {FOLLOWUP_RESOLUTION_LABEL[r.resolution] ?? r.resolution} · {fmt(r.resolved_at)}
                {r.resolved_by_email ? ` · por ${r.resolved_by_email}` : ''}
                {r.note ? <span className="text-linku-text-dim"> — {r.note}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function CaseCard({ c }: { c: FollowupCase }) {
  const isFailed = c.lastStatus === 'failed';
  return (
    <article className="rounded-xl border border-linku-border-2 bg-linku-bg-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-linku-text">{c.name || 'Sin nombre'}</p>
          {c.company && <p className="truncate text-xs text-linku-text-dim">{c.company}</p>}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
            isFailed
              ? 'border-red-500/30 bg-red-500/15 text-red-300'
              : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
          }`}
        >
          {isFailed ? 'Rechazado' : 'Pendiente'}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {c.email &&
          (SAFE_EMAIL_RE.test(c.email) ? (
            <a
              href={`mailto:${encodeURIComponent(c.email.split('@')[0])}@${c.email.split('@')[1]}`}
              className="inline-flex items-center gap-1 text-linku-text-muted hover:text-linku-text"
            >
              <Mail size={12} /> {c.email}
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 text-linku-text-muted">
              <Mail size={12} /> {c.email}
            </span>
          ))}
        {c.phone && (
          <span className="inline-flex items-center gap-2 text-linku-text-muted">
            {c.phone}
            {c.whatsappUrl && (
              <a
                href={c.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-300 hover:bg-emerald-500/20"
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-linku-text">
        {c.tierName} · <span className="font-semibold tabular-nums">{formatCop(c.totalCop)}</span>
        {c.discountCop > 0 && (
          <span className="text-xs text-linku-text-dim">
            {' '}
            (cupón {c.couponCode ?? ''} −{formatCop(c.discountCop)})
          </span>
        )}
      </p>
      <p className="mt-1 text-xs text-linku-text-dim">
        {c.attempts} {c.attempts === 1 ? 'intento' : 'intentos'} · primero {fmt(c.firstAt)} · último{' '}
        {fmt(c.lastAt)}
      </p>
      {c.lastReason && (
        <p className="mt-1 text-xs text-linku-text-muted">Último motivo: {c.lastReason}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href={`/admin/orders/${c.lastOrderId}`}
          className="text-xs font-semibold text-linku-coral hover:text-linku-coral-soft"
        >
          Ver último →
        </Link>
        {c.orderIds.length > 1 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-linku-text-dim hover:text-linku-text">
              Todas las órdenes ({c.orderIds.length})
            </summary>
            <div className="mt-1 flex flex-wrap gap-2">
              {c.orderIds.map((id, i) => (
                <Link
                  key={id}
                  href={`/admin/orders/${id}`}
                  className="text-linku-coral hover:text-linku-coral-soft"
                >
                  #{c.orderIds.length - i}
                </Link>
              ))}
            </div>
          </details>
        )}
        <ResolveFollowupForm buyerKey={c.buyerKey} buyerEmail={c.email} buyerName={c.name} />
      </div>
    </article>
  );
}
