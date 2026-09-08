/**
 * Integración con la API de registro de InContacto
 * (registroapi.aplicacionesincontacto.com) — plataforma de registro/acreditación
 * de asistentes del evento.
 *
 * Contrato del endpoint:
 *   POST /api_integration/save
 *   Header  Authorization: <token>   (env INCONTACTO_API_TOKEN)
 *   Body    { "<fieldId>": "<valor>", ... }  — un registro por request
 *   El endpoint valida duplicados por Documento, así que reintentar es seguro
 *   (los reintentos del webhook de Wompi no crean asistentes duplicados).
 */

const INCONTACTO_URL =
  'https://registroapi.aplicacionesincontacto.com/api_integration/save';

/** IDs de campo del formulario InContacto (fijos, provistos por su equipo). */
const FIELD = {
  documento: '6a998cd46c6a02f9132c32bc',
  nombre: '6a998cd46c6a02f9132c32bd',
  apellidos: '6a998cd46c6a02f9132c32be',
  empresa: '6a998cd46c6a02f9132c32bf',
  correo: '6a998cd46c6a02f9132c32c2',
  tipoDocumento: '6a998d4d31d989872e8defa0',
  cargo: '6a998da96c6a02f9132ccbf2',
  linkedin: '6a998dbf6c6a02f9132ce364',
  tipoBoleta: '6a998df731d989872e8e89ab',
  celular: '6a99a9db31d989872ea8fdda'
} as const;

export type IncontactoAttendee = {
  docNumber: string;
  docType: string; // CC | CE | PA | NIT | TI | PEP | OTRO
  fullName: string;
  company?: string | null;
  position?: string | null;
  linkedin?: string | null;
  email: string;
  phone?: string | null;
  ticketTierName: string;
};

/**
 * Divide un nombre completo en nombre(s) y apellidos con la convención
 * hispana: con 3+ palabras, las 2 últimas son apellidos; con 2, una y una.
 * Imperfecto por naturaleza, pero es el mejor heurístico sin campos separados.
 */
export function splitFullName(fullName: string): {
  nombre: string;
  apellidos: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nombre: '', apellidos: '' };
  if (parts.length === 1) return { nombre: parts[0], apellidos: '' };
  if (parts.length === 2) return { nombre: parts[0], apellidos: parts[1] };
  return {
    nombre: parts.slice(0, parts.length - 2).join(' '),
    apellidos: parts.slice(-2).join(' ')
  };
}

export function hasIncontactoConfigured(): boolean {
  return Boolean(process.env.INCONTACTO_API_TOKEN);
}

/**
 * Registra un asistente en InContacto. Nunca lanza — devuelve { ok, error }
 * para que el caller (webhook de pago) decida loguear sin romper el flujo.
 */
export async function registerAttendee(a: IncontactoAttendee): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
  response?: unknown;
}> {
  const token = process.env.INCONTACTO_API_TOKEN;
  if (!token) {
    return { ok: false, error: 'INCONTACTO_API_TOKEN no configurada' };
  }

  const { nombre, apellidos } = splitFullName(a.fullName);

  const body: Record<string, string> = {
    [FIELD.documento]: a.docNumber,
    [FIELD.nombre]: nombre,
    [FIELD.apellidos]: apellidos,
    [FIELD.empresa]: a.company ?? '',
    [FIELD.correo]: a.email,
    [FIELD.tipoDocumento]: a.docType,
    [FIELD.cargo]: a.position ?? '',
    [FIELD.linkedin]: a.linkedin ?? '',
    [FIELD.tipoBoleta]: a.ticketTierName,
    [FIELD.celular]: a.phone ?? ''
  };

  try {
    const res = await fetch(INCONTACTO_URL, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* respuesta no-JSON, la devolvemos cruda */
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `InContacto ${res.status}: ${text.slice(0, 300)}`,
        response: parsed
      };
    }

    // La API responde HTTP 200 con { ok: false, error } en errores lógicos.
    // Duplicado por documento = el asistente ya existe → éxito idempotente
    // (pasa en los reintentos del webhook de Wompi).
    const apiOk = (parsed as { ok?: boolean })?.ok;
    if (apiOk === false) {
      const msg =
        (parsed as { error?: { message?: string } })?.error?.message ?? text;
      if (/ya se encuentra registrad/i.test(msg)) {
        return { ok: true, status: res.status, response: parsed };
      }
      return {
        ok: false,
        status: res.status,
        error: `InContacto rechazo: ${msg.slice(0, 300)}`,
        response: parsed
      };
    }

    return { ok: true, status: res.status, response: parsed };
  } catch (e) {
    return {
      ok: false,
      error: `InContacto fetch error: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}
