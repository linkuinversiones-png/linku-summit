import { NextResponse } from 'next/server';

/**
 * Endpoint de DEBUG temporal — verifica qué env vars críticas están seteadas
 * en producción sin exponer sus valores. Borrar después del diagnóstico.
 *
 * Uso: curl https://linkusummit.com/api/debug/env-check
 */
export async function GET() {
  const keys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_SITE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'EPAYCO_TEST_MODE',
    'EPAYCO_CUSTOMER_ID',
    'EPAYCO_PUBLIC_KEY',
    'EPAYCO_PRIVATE_KEY',
    'EPAYCO_P_KEY',
    'QR_HMAC_SECRET'
  ];

  const status: Record<string, { set: boolean; length: number; preview: string }> = {};
  for (const k of keys) {
    const v = process.env[k];
    status[k] = {
      set: Boolean(v),
      length: v?.length ?? 0,
      preview: v ? `${v.slice(0, 4)}…${v.slice(-2)}` : ''
    };
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelRegion: process.env.VERCEL_REGION ?? null,
    siteUrlValue: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    epaycoTestMode: process.env.EPAYCO_TEST_MODE ?? null,
    status
  });
}
