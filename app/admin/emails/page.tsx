import { Mail, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { loadAudience } from '@/lib/email/campaigns';
import EmailsClient, { type TierOption } from './EmailsClient';
import CampaignHistory, { type CampaignRow } from './CampaignHistory';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Correos · LINKU Admin',
  robots: { index: false, follow: false }
};

/** Errores típicos cuando la migración 0024 aún no está aplicada. */
function isMissingTable(err: { code?: string; message?: string }): boolean {
  return (
    err.code === '42P01' ||
    err.code === 'PGRST205' ||
    /does not exist|schema cache/i.test(err.message ?? '')
  );
}

export default async function AdminEmailsPage() {
  const supabase = await createClient();

  const { data: campaigns, error: campErr } = await supabase
    .from('email_campaigns')
    .select(
      'id, subject, status, total_recipients, sent_count, failed_count, created_by_email, created_at, sent_at'
    )
    .order('created_at', { ascending: false })
    .limit(50);

  const header = (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
        Comunicación
      </p>
      <h1 className="mt-2 flex items-center gap-2.5 text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
        <Mail size={28} className="text-linku-coral" /> Correos
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-linku-text-muted">
        Envía un correo a los asistentes (personas con al menos una entrada pagada). Cada correo
        electrónico recibe un solo mensaje, aunque tenga varias boletas. Envía siempre una
        prueba antes del envío real.
      </p>
    </header>
  );

  if (campErr) {
    const missing = isMissingTable(campErr);
    return (
      <div className="mx-auto max-w-5xl">
        {header}
        <p className="mt-8 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {missing
              ? 'Los correos masivos todavía no están activados en la base de datos: falta aplicar la migración 0024_correos_masivos.sql (se aplica sola al publicar). Cuando esté lista, esta página funcionará.'
              : `No se pudo leer el historial de campañas: ${campErr.message}`}
          </span>
        </p>
      </div>
    );
  }

  const aud = await loadAudience(supabase);
  const entries = aud.ok ? aud.entries : [];

  // Categorías: las del catálogo (incluidas las internas) + cualquier slug
  // que aparezca en órdenes pagadas aunque la categoría ya no exista.
  const { data: tiers } = await supabase
    .from('ticket_tiers')
    .select('slug, name_es, admin_only, sort_order')
    .order('sort_order', { ascending: true });
  const options = new Map<string, TierOption>();
  (tiers ?? []).forEach((t) =>
    options.set(t.slug, { slug: t.slug, name: t.name_es, internal: Boolean(t.admin_only) })
  );
  entries.forEach((e) =>
    e.tiers.forEach((s) => {
      if (!options.has(s)) options.set(s, { slug: s, name: s, internal: false });
    })
  );

  return (
    <div className="mx-auto max-w-5xl">
      {header}
      {!aud.ok && (
        <p className="mt-6 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          No se pudo calcular la audiencia: {aud.error}
        </p>
      )}
      <div className="mt-8">
        <EmailsClient audience={entries} tiers={Array.from(options.values())} />
      </div>
      <CampaignHistory campaigns={(campaigns ?? []) as CampaignRow[]} />
    </div>
  );
}
