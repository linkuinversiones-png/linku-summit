/**
 * Wrapper minimalista sobre la API REST de Resend.
 * (No instalamos el SDK para no añadir dependencia extra.)
 */

const RESEND_API = 'https://api.resend.com/emails';
const FROM_DEFAULT = 'LinkU Summit <noreply@linkusummit.com>';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
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
      reply_to: input.replyTo ?? 'invites@linkusummit.com'
    })
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${text}` };
  }
  const data = (await res.json()) as { id?: string };
  return { ok: true, id: data.id };
}
