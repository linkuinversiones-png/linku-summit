import Link from 'next/link';
import { IdCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getAdminOnlyTiers } from '@/lib/tickets';
import { createClient } from '@/lib/supabase/server';
import RegistroForm from './RegistroForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Staff y speakers · LINKU Admin',
  robots: { index: false, follow: false }
};

const INCONTACTO_LABEL: Record<string, string> = {
  sent: 'Enviado',
  error: 'Error',
  skipped: 'Omitido'
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function IncontactoBadge({ status }: { status: string | null }) {
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
        <CheckCircle2 size={10} /> Enviado
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-300">
        <XCircle size={10} /> Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
      <Clock size={10} /> {status ? INCONTACTO_LABEL[status] ?? status : 'Sin enviar'}
    </span>
  );
}

/**
 * Registro manual de personas en tiers internos (Staff, Speaker). Solo un
 * admin puede llegar aquí: no hay checkout público para estas categorías.
 */
export default async function AdminRegistrosPage() {
  const tiers = await getAdminOnlyTiers();
  const supabase = await createClient();

  const tierSlugs = tiers.map((t) => t.slug);
  const tierName = new Map(tiers.map((t) => [t.slug, t.name_es]));

  // Todos los tiers admin_only alguna vez creados (activos o no), para que
  // el listado de abajo también muestre registros de categorías que ya se
  // desactivaron.
  const { data: allInternalTiers } = await supabase
    .from('ticket_tiers')
    .select('slug, name_es')
    .eq('admin_only', true);
  (allInternalTiers ?? []).forEach((t) => tierName.set(t.slug, t.name_es));
  const allSlugs = (allInternalTiers ?? []).map((t) => t.slug);

  const { data: recentOrders } = allSlugs.length
    ? await supabase
        .from('orders')
        .select(
          'id, buyer_name, buyer_email, ticket_tier, created_at, incontacto_status'
        )
        .in('ticket_tier', allSlugs)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
          Uso interno
        </p>
        <h1 className="mt-2 flex items-center gap-2.5 text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
          <IdCard size={28} className="text-linku-coral" /> Registrar staff y speakers
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-linku-text-muted">
          Estas categorías (Staff, Speaker) nunca aparecen en la página pública ni
          se pueden comprar. Al registrar aquí se crea una venta con costo $0,
          método &quot;cortesía&quot;, y se procesa igual que cualquier otra
          venta pagada: queda en la bitácora, se emite la boleta con QR y se
          envía a InContacto con el nombre de la categoría como tipo de
          boleta.
        </p>
      </header>

      <div className="mt-8">
        <RegistroForm tiers={tiers} />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
          Últimos registros internos
        </h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
          {!recentOrders || recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-linku-text-muted">Aún no hay registros internos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-linku-border bg-linku-bg-3/40 text-xs uppercase tracking-wider text-linku-text-dim">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Correo</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">InContacto</th>
                    <th className="px-4 py-3 font-semibold text-right">Venta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linku-border">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-linku-text">{o.buyer_name || '—'}</td>
                      <td className="px-4 py-3 text-linku-text-muted">{o.buyer_email || '—'}</td>
                      <td className="px-4 py-3 text-linku-text-muted">
                        {tierName.get(o.ticket_tier) ?? o.ticket_tier}
                      </td>
                      <td className="px-4 py-3 text-linku-text-muted">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <IncontactoBadge status={o.incontacto_status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="text-xs font-semibold text-linku-coral hover:text-linku-coral-soft"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
