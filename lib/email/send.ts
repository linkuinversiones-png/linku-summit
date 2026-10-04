/**
 * Wrapper minimalista sobre la API REST de Resend.
 * (No instalamos el SDK para no añadir dependencia extra.)
 */

const RESEND_API = 'https://api.resend.com/emails';
export const FROM_DEFAULT = 'LinkU Capital Summit <noreply@linkusummit.com>';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Versión texto plano (opcional). */
  text?: string;
  from?: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY no configurada' };
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: input.from ?? FROM_DEFAULT,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
      reply_to: input.replyTo ?? 'laura.lopez@linku-ventures.co'
    })
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${text}` };
  }
  const data = (await res.json()) as { id?: string };
  return { ok: true, id: data.id };
}

// ---------------------------------------------------------------------
// Envío en lote (correos masivos). Endpoint batch de Resend: hasta 100
// correos por llamada. Límite de Resend ~2 req/s: el llamador espera
// entre llamadas.
// ---------------------------------------------------------------------

const RESEND_BATCH_API = 'https://api.resend.com/emails/batch';

export type BatchEmailItem = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo: string;
};

export type BatchItemResult =
  | { ok: true; id: string; note?: string }
  | { ok: false; error: string };

export type BatchResult =
  | { ok: true; results: BatchItemResult[] }
  /**
   * retryable = true: no sabemos si Resend envió (401, 403, 409, 429, 5xx, red, sin llave);
   * el llamador devuelve los destinatarios a la cola. Reintentar con la misma
   * Idempotency-Key evita duplicados dentro de las siguientes 24 h.
   * retryable = false: Resend rechazó el lote (4xx); se marcan como fallidos.
   */
  | { ok: false; retryable: boolean; status?: number; error: string };

export async function sendEmailBatch(
  items: BatchEmailItem[],
  idempotencyKey: string
): Promise<BatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, retryable: true, error: 'RESEND_API_KEY no configurada' };
  }
  let res: Response;
  try {
    res = await fetch(RESEND_BATCH_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(
        items.map((i) => ({
          from: FROM_DEFAULT,
          to: [i.to],
          subject: i.subject,
          html: i.html,
          text: i.text,
          reply_to: i.replyTo
        }))
      )
    });
  } catch (e) {
    return {
      ok: false,
      retryable: true,
      error: `Red: ${e instanceof Error ? e.message : String(e)}`
    };
  }

  if (!res.ok) {
    const body = (await res.text().catch(() => '')).slice(0, 500);
    const retryable =
      res.status === 401 ||
      res.status === 403 ||
      res.status === 409 ||
      res.status === 429 ||
      res.status >= 500;
    return { ok: false, retryable, status: res.status, error: `Resend ${res.status}: ${body}` };
  }

  const json = (await res.json().catch(() => ({}))) as { data?: { id?: string }[] };
  const data = Array.isArray(json.data) ? json.data : [];
  // Documentado por Resend: data[i] corresponde al correo i del lote.
  // Un 2xx significa que Resend aceptó el lote: si no podemos asignar ids por
  // índice NO se marcan fallidos (se reenviaría); quedan enviados sin id.
  const aligned = data.length === items.length;
  const results: BatchItemResult[] = items.map((_, idx) => {
    const id = aligned ? data[idx]?.id : undefined;
    return id ? { ok: true, id } : { ok: true, id: '', note: 'Resend 2xx sin id por índice' };
  });
  return { ok: true, results };
}
