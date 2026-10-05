'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sendEmailBatch } from '@/lib/email/send';
import { campaignEmail } from '@/lib/email/templates';
import {
  BATCH_SIZE,
  STALE_MINUTES,
  filterAudience,
  firstNameOf,
  loadAudience,
  validateCampaignInput,
  type CampaignInput
} from '@/lib/email/campaigns';

/**
 * Acciones de correos masivos.
 *
 * Seguridad: todas verifican admin con la sesión del request. Las lecturas y
 * escrituras usan el cliente de sesión (RLS: solo admins), no el service
 * client. RESEND_API_KEY solo se lee en el servidor (lib/email/send.ts).
 *
 * Anti doble envío: ver processCampaignBatch.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** No arrancar otro lote pasados tantos ms: deja margen bajo ~15 s por acción (Workers). */
const NEW_BATCH_BEFORE_MS = 8_000;
/** Resend permite ~2 req/s. */
const MIN_GAP_MS = 650;

async function assertAdmin(): Promise<{ id: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/emails');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
  return { id: user.id, email: user.email ?? '' };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------
// Prueba
// ---------------------------------------------------------------------

export type SimpleResult = { ok: true; message: string } | { ok: false; message: string };

/** Envía el correo SOLO al admin logueado, con [PRUEBA] en el asunto. */
export async function sendTestEmail(input: CampaignInput): Promise<SimpleResult> {
  const admin = await assertAdmin();
  const v = validateCampaignInput(input);
  if (!v.ok) return v;
  if (!admin.email) return { ok: false, message: 'Tu usuario no tiene correo.' };

  const mail = campaignEmail({
    subject: v.value.subject,
    title: v.value.title,
    body: v.value.body,
    ctaLabel: v.value.ctaLabel,
    ctaUrl: v.value.ctaUrl,
    firstName: firstNameOf('Nombre de prueba'),
    email: admin.email,
    includeMap: v.value.includeMap,
    boxTitle: v.value.boxTitle,
    boxIntro: v.value.boxIntro,
    boxLines: v.value.boxLines
  });
  // Mismo camino que el envío masivo: lote de 1 con clave única por clic.
  const res = await sendEmailBatch(
    [
      {
        to: admin.email,
        subject: `[PRUEBA] ${mail.subject}`,
        html: mail.html,
        text: mail.text,
        replyTo: v.value.replyTo
      }
    ],
    `test:${crypto.randomUUID()}`
  );
  if (!res.ok) return { ok: false, message: `No se pudo enviar la prueba: ${res.error}` };
  const r0 = res.results[0];
  if (!r0.ok) return { ok: false, message: `Resend rechazó la prueba: ${r0.error}` };
  return {
    ok: true,
    message: `Prueba enviada a ${admin.email}. id de Resend: ${r0.id || '(sin id: ' + (r0.note ?? '') + ')'}`
  };
}

// ---------------------------------------------------------------------
// Crear campaña
// ---------------------------------------------------------------------

export type CreateResult =
  | { ok: true; campaignId: string; total: number }
  | { ok: false; message: string };

/**
 * Paso 1: crea la campaña y los destinatarios 'queued'. La audiencia se
 * recalcula aquí en el servidor (no se confía en la lista del navegador).
 * La campaña nace en 'draft' y solo pasa a 'sending' cuando ya están todos
 * los destinatarios, así un fallo a medias no deja una campaña enviable
 * con una lista parcial.
 */
export async function createCampaign(input: CampaignInput): Promise<CreateResult> {
  const admin = await assertAdmin();
  const v = validateCampaignInput(input);
  if (!v.ok) return v;
  if (v.value.tiers.length === 0) {
    return { ok: false, message: 'Elige al menos una categoría.' };
  }

  // Campos nuevos (migración 0025): solo se guardan si se usan, así crear
  // campañas sigue funcionando aunque la migración aún no esté aplicada.
  const usesNewFields = Boolean(
    v.value.includeMap || v.value.boxTitle || v.value.boxIntro || v.value.boxLines
  );

  const supabase = await createClient();
  const aud = await loadAudience(supabase);
  if (!aud.ok) return { ok: false, message: `No se pudo calcular la audiencia: ${aud.error}` };
  const recipients = filterAudience(aud.entries, v.value.tiers);
  if (recipients.length === 0) {
    return { ok: false, message: 'No hay destinatarios con esas categorías.' };
  }

  const { data: campaign, error: cErr } = await supabase
    .from('email_campaigns')
    .insert({
      subject: v.value.subject,
      title: v.value.title || null,
      body: v.value.body,
      cta_label: v.value.ctaLabel || null,
      cta_url: v.value.ctaUrl || null,
      reply_to: v.value.replyTo,
      ...(usesNewFields
        ? {
            include_map: v.value.includeMap,
            box_title: v.value.boxTitle || null,
            box_intro: v.value.boxIntro || null,
            box_lines: v.value.boxLines || null
          }
        : {}),
      audience: { tiers: v.value.tiers },
      status: 'draft',
      total_recipients: 0,
      created_by: admin.id,
      created_by_email: admin.email
    })
    .select('id')
    .single();
  if (cErr || !campaign) {
    if (usesNewFields && /include_map|box_title|box_intro|box_lines|schema cache/i.test(cErr?.message ?? '')) {
      return {
        ok: false,
        message:
          'El mapa y el recuadro todavía no están activados en la base de datos: falta aplicar la migración 0025_correos_mapa_recuadro.sql (se aplica sola al publicar). No se envió nada.'
      };
    }
    return { ok: false, message: `No se pudo crear la campaña: ${cErr?.message ?? 'sin respuesta'}` };
  }

  const CHUNK = 500;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const rows = recipients.slice(i, i + CHUNK).map((r) => ({
      campaign_id: campaign.id,
      email: r.email,
      name: r.name || null,
      status: 'queued'
    }));
    const { error } = await supabase
      .from('email_campaign_recipients')
      .upsert(rows, { onConflict: 'campaign_id,email', ignoreDuplicates: true });
    if (error) {
      return {
        ok: false,
        message: `No se pudieron guardar los destinatarios (la campaña quedó en borrador y no se envió nada): ${error.message}`
      };
    }
  }

  const { count } = await supabase
    .from('email_campaign_recipients')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id);
  const total = count ?? recipients.length;

  const { error: uErr } = await supabase
    .from('email_campaigns')
    .update({ status: 'sending', total_recipients: total })
    .eq('id', campaign.id);
  if (uErr) {
    return { ok: false, message: `No se pudo iniciar la campaña: ${uErr.message}` };
  }
  return { ok: true, campaignId: campaign.id, total };
}

// ---------------------------------------------------------------------
// Procesar lote
// ---------------------------------------------------------------------

export type Progress = {
  total: number;
  sent: number;
  failed: number;
  queued: number;
  sending: number;
  status: string;
};

export type BatchActionResult =
  | { ok: true; done: boolean; progress: Progress; message?: string }
  | { ok: false; message: string; progress?: Progress };

async function readProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaignId: string
): Promise<Progress> {
  const count = async (status: string) => {
    const { count } = await supabase
      .from('email_campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', status);
    return count ?? 0;
  };
  const [sent, failed, queued, sending] = await Promise.all([
    count('sent'),
    count('failed'),
    count('queued'),
    count('sending')
  ]);
  const { data: c } = await supabase
    .from('email_campaigns')
    .select('status')
    .eq('id', campaignId)
    .single();
  return {
    total: sent + failed + queued + sending,
    sent,
    failed,
    queued,
    sending,
    status: c?.status ?? 'sending'
  };
}

/** Guarda contadores y estado de la campaña según los destinatarios reales. */
async function syncCampaign(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaignId: string
): Promise<Progress> {
  const p = await readProgress(supabase, campaignId);
  const pending = p.queued + p.sending;
  const status = pending > 0 ? 'sending' : p.failed > 0 ? 'partial' : 'sent';
  const patch: Record<string, unknown> = {
    sent_count: p.sent,
    failed_count: p.failed,
    total_recipients: p.total,
    status
  };
  if (pending === 0) patch.sent_at = new Date().toISOString();
  await supabase.from('email_campaigns').update(patch).eq('id', campaignId);
  return { ...p, status };
}

/**
 * Paso 2: procesa destinatarios 'queued' en lotes de hasta 100, dentro de un
 * presupuesto de tiempo. La UI vuelve a llamar hasta que `done` sea true.
 *
 * Cómo se evitan los dobles envíos:
 *  1. Reclamo atómico: UPDATE ... SET status='sending' WHERE id IN (...) AND
 *     status='queued' RETURNING. Si dos pestañas o clics compiten por las
 *     mismas filas, solo una recibe cada fila de vuelta; la otra recibe
 *     menos o ninguna y no envía esas.
 *  2. Idempotency-Key de Resend = campaign:<id>:<hash de los ids del lote>:
 *     si un lote se reintenta con los mismos destinatarios, Resend no lo
 *     vuelve a enviar (ventana de 24 h).
 *  3. Errores ambiguos (429, 5xx, red) devuelven el lote a 'queued' en
 *     lugar de marcarlo fallido; los rechazos definitivos (4xx) lo marcan
 *     'failed'.
 */
/** Mensaje claro según el código de un error recuperable de Resend. */
function retryMessage(status: number | undefined, error: string): string {
  if (status === 401 || status === 403) {
    return 'Resend rechazó la llave o el dominio; revisa la configuración.';
  }
  if (status === 409) return 'Resend está procesando este lote; reintenta en unos segundos.';
  return `Envío pausado: ${error}.`;
}

export async function processCampaignBatch(campaignId: string): Promise<BatchActionResult> {
  await assertAdmin();
  if (!UUID_RE.test(campaignId)) return { ok: false, message: 'Campaña inválida.' };

  const supabase = await createClient();
  const { data: campaign, error: cErr } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
  if (cErr || !campaign) return { ok: false, message: 'No se encontró la campaña.' };
  if (campaign.status === 'draft') {
    return { ok: false, message: 'La campaña está en borrador (no se completó su creación).' };
  }

  const started = Date.now();
  let calls = 0;
  let emptyClaims = 0;
  let note: string | undefined;

  while (Date.now() - started < NEW_BATCH_BEFORE_MS) {
    // 1. Reclamo atómico del lote.
    const { data: candidates, error: selErr } = await supabase
      .from('email_campaign_recipients')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'queued')
      .order('email', { ascending: true })
      .limit(BATCH_SIZE);
    if (selErr) return { ok: false, message: `Error leyendo la cola: ${selErr.message}` };
    if (!candidates || candidates.length === 0) break;

    const { data: claimed, error: claimErr } = await supabase
      .from('email_campaign_recipients')
      .update({ status: 'sending', claimed_at: new Date().toISOString() })
      .in(
        'id',
        candidates.map((c) => c.id)
      )
      .eq('status', 'queued')
      .select('id, email, name');
    if (claimErr) return { ok: false, message: `Error reclamando el lote: ${claimErr.message}` };
    if (!claimed || claimed.length === 0) {
      // Otra pestaña se llevó estas filas: máximo 2 intentos vacíos.
      emptyClaims++;
      if (emptyClaims >= 2) break;
      await sleep(200);
      continue;
    }

    // Respeta el límite de Resend entre llamadas de la misma acción.
    if (calls > 0) await sleep(MIN_GAP_MS);
    calls++;

    const items = claimed.map((r) => {
      const mail = campaignEmail({
        subject: campaign.subject,
        title: campaign.title,
        body: campaign.body,
        ctaLabel: campaign.cta_label,
        ctaUrl: campaign.cta_url,
        firstName: firstNameOf(r.name),
        email: r.email,
        // Datos guardados en la campaña (no los del formulario).
        includeMap: Boolean(campaign.include_map),
        boxTitle: campaign.box_title,
        boxIntro: campaign.box_intro,
        boxLines: campaign.box_lines
      });
      return {
        to: r.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        replyTo: campaign.reply_to
      };
    });
    const ids = claimed.map((r) => r.id).sort();
    const key = `campaign:${campaignId}:${(await sha256Hex(ids.join(','))).slice(0, 32)}`;

    let res = await sendEmailBatch(items, key);
    if (!res.ok && res.status === 429) {
      await sleep(1500);
      res = await sendEmailBatch(items, key);
    }

    if (!res.ok) {
      const claimedIds = claimed.map((r) => r.id);
      if (res.retryable) {
        // Ambiguo: volver a la cola (la misma llave evita duplicar al reintentar).
        await supabase
          .from('email_campaign_recipients')
          .update({ status: 'queued', claimed_at: null, error: res.error.slice(0, 500) })
          .in('id', claimedIds)
          .eq('status', 'sending');
        const progress = await syncCampaign(supabase, campaignId);
        return {
          ok: false,
          message: `${retryMessage(res.status, res.error)} Los pendientes siguen en cola; puedes continuar.`,
          progress
        };
      }
      await supabase
        .from('email_campaign_recipients')
        .update({ status: 'failed', error: res.error.slice(0, 500), claimed_at: null })
        .in('id', claimedIds)
        .eq('status', 'sending');
      note = res.error;
    } else {
      const now = new Date().toISOString();
      const failedIds: string[] = [];
      const writes: (() => PromiseLike<{ error: { message: string } | null }>)[] = [];
      const write = (patch: Record<string, unknown>, ids: string[]) =>
        writes.push(() =>
          supabase
            .from('email_campaign_recipients')
            .update(patch)
            .in('id', ids)
            .eq('status', 'sending')
        );
      claimed.forEach((r, idx) => {
        const out = res.results[idx];
        if (out && out.ok) {
          write(
            { status: 'sent', resend_id: out.id || null, error: out.note ?? null, sent_at: now },
            [r.id]
          );
        } else failedIds.push(r.id);
      });
      // Resultados sin éxito: un solo update con el mismo mensaje.
      if (failedIds.length > 0) {
        write({ status: 'failed', error: 'Sin resultado de Resend' }, failedIds);
      }
      // Concurrencia limitada (de a 10) para no saturar subrequests.
      let saveError: string | null = null;
      for (let i = 0; i < writes.length; i += 10) {
        const out = await Promise.all(writes.slice(i, i + 10).map((w) => w()));
        const bad = out.find((o) => o.error);
        if (bad?.error) saveError = bad.error.message;
      }
      if (saveError) {
        const progress = await syncCampaign(supabase, campaignId);
        return {
          ok: false,
          message: `Resend aceptó el lote pero no se pudo registrar (${saveError}). NO uses "Reintentar pendientes en corte" sin revisar el detalle de la campaña.`,
          progress
        };
      }
    }
  }

  const progress = await syncCampaign(supabase, campaignId);
  const done = progress.queued === 0;
  return { ok: true, done, progress, message: note };
}

// ---------------------------------------------------------------------
// Reintentar
// ---------------------------------------------------------------------

/**
 * Devuelve destinatarios a la cola.
 *  - 'stale': los que quedaron en 'sending' hace más de 10 min (corte). Puede
 *    duplicar si Resend sí los envió; la Idempotency-Key lo minimiza.
 *  - 'failed': los marcados fallidos (Resend los rechazó; no hay duplicado).
 */
export async function requeueRecipients(
  campaignId: string,
  mode: 'stale' | 'failed'
): Promise<SimpleResult> {
  await assertAdmin();
  if (!UUID_RE.test(campaignId)) return { ok: false, message: 'Campaña inválida.' };
  const supabase = await createClient();

  let q = supabase
    .from('email_campaign_recipients')
    .update({ status: 'queued', claimed_at: null, error: null })
    .eq('campaign_id', campaignId);
  if (mode === 'stale') {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();
    q = q.eq('status', 'sending').lt('claimed_at', cutoff);
  } else {
    q = q.eq('status', 'failed');
  }
  const { data, error } = await q.select('id');
  if (error) return { ok: false, message: error.message };
  const n = data?.length ?? 0;
  if (n === 0) return { ok: true, message: 'No había destinatarios para reintentar.' };
  await syncCampaign(supabase, campaignId);
  return { ok: true, message: `${n} destinatario(s) devueltos a la cola.` };
}

// ---------------------------------------------------------------------
// Detalle
// ---------------------------------------------------------------------

export type RecipientRow = {
  email: string;
  name: string | null;
  status: string;
  error: string | null;
  sent_at: string | null;
  claimed_at: string | null;
};

export async function getCampaignRecipients(
  campaignId: string
): Promise<{ ok: true; rows: RecipientRow[]; truncated: boolean } | { ok: false; message: string }> {
  await assertAdmin();
  if (!UUID_RE.test(campaignId)) return { ok: false, message: 'Campaña inválida.' };
  const supabase = await createClient();
  const LIMIT = 2000;
  const { data, error } = await supabase
    .from('email_campaign_recipients')
    .select('email, name, status, error, sent_at, claimed_at')
    .eq('campaign_id', campaignId)
    .order('status', { ascending: true })
    .order('email', { ascending: true })
    .limit(LIMIT + 1);
  if (error) return { ok: false, message: error.message };
  const rows = data ?? [];
  return { ok: true, rows: rows.slice(0, LIMIT), truncated: rows.length > LIMIT };
}
