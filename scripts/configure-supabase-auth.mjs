// Configura Supabase Auth via Management API:
//   - Site URL = https://linkusummit.com
//   - Redirect URLs (uri_allow_list) con localhost + prod en ambos idiomas
//   - Subject y HTML del Magic Link con la marca LinkU
//
// Requiere SUPABASE_ACCESS_TOKEN (PAT) y SUPABASE_PROJECT_REF en .env.local.
//
// Uso:
//   node scripts/configure-supabase-auth.mjs           → aplica cambios
//   node scripts/configure-supabase-auth.mjs --check   → solo muestra config actual

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envText = readFileSync(resolve('.env.local'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
if (!token || !ref) {
  console.error('Faltan SUPABASE_ACCESS_TOKEN o SUPABASE_PROJECT_REF en .env.local');
  process.exit(1);
}

const SITE_URL = 'https://linkusummit.com';
const REDIRECT_URLS = [
  'http://localhost:3000/auth/callback',
  'http://localhost:3000/en/auth/callback',
  'https://linkusummit.com/auth/callback',
  'https://linkusummit.com/en/auth/callback',
  'https://www.linkusummit.com/auth/callback',
  'https://www.linkusummit.com/en/auth/callback'
];

const MAGIC_LINK_SUBJECT = 'Tu acceso a LinkU Summit 2026';

const MAGIC_LINK_HTML = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinkU Summit 2026</title>
  </head>
  <body style="margin:0;padding:0;background:#050814;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E8EEF5;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#050814;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="480" style="max-width:480px;background:#0B1020;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 16px 32px;">
                <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,90,95,0.8);">
                  LINKU <span style="color:#FF5A5F;">SUMMIT</span> 2026
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 16px 32px;">
                <h1 style="margin:0;font-size:24px;line-height:1.2;font-weight:700;color:#E8EEF5;letter-spacing:-0.01em;">
                  Tu acceso al portal
                </h1>
                <p style="margin:12px 0 0 0;font-size:15px;line-height:1.55;color:rgba(232,238,245,0.7);">
                  Hola, recibimos una solicitud para iniciar sesion. Haz clic en el boton para entrar a tu cuenta de LinkU Summit.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px 8px 32px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#FF5A5F;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;box-shadow:0 8px 24px rgba(255,90,95,0.35);">
                  Iniciar sesion
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:rgba(232,238,245,0.45);text-align:center;">
                  Este enlace expira en 1 hora. Si no fuiste tu, ignora este correo.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 16px 32px;">
                <p style="margin:0;font-size:11px;line-height:1.5;color:rgba(232,238,245,0.4);word-break:break-all;">
                  No funciona el boton? Copia y pega esta URL en tu navegador:<br>
                  <span style="color:rgba(232,238,245,0.55);">{{ .ConfirmationURL }}</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:11px;line-height:1.5;color:rgba(232,238,245,0.4);">
                  LinkU Summit 2026 - 15 al 16 de octubre - Medellin, Colombia<br>
                  <a href="https://linkusummit.com" style="color:rgba(255,90,95,0.8);text-decoration:none;">linkusummit.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const url = `https://api.supabase.com/v1/projects/${ref}/config/auth`;

if (process.argv.includes('--check')) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    console.error('GET failed:', res.status, await res.text());
    process.exit(1);
  }
  const cfg = await res.json();
  console.log('Config actual (relevante):');
  console.log({
    site_url: cfg.site_url,
    uri_allow_list: cfg.uri_allow_list,
    mailer_subjects_magic_link: cfg.mailer_subjects_magic_link,
    mailer_templates_magic_link_content_length:
      (cfg.mailer_templates_magic_link_content ?? '').length
  });
  process.exit(0);
}

const body = {
  site_url: SITE_URL,
  uri_allow_list: REDIRECT_URLS.join(','),
  mailer_subjects_magic_link: MAGIC_LINK_SUBJECT,
  mailer_templates_magic_link_content: MAGIC_LINK_HTML
};

const res = await fetch(url, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

if (!res.ok) {
  console.error('PATCH failed:', res.status);
  console.error(await res.text());
  process.exit(1);
}

const cfg = await res.json();
console.log('OK. Config aplicada:');
console.log({
  site_url: cfg.site_url,
  uri_allow_list: cfg.uri_allow_list,
  mailer_subjects_magic_link: cfg.mailer_subjects_magic_link,
  mailer_templates_magic_link_content_length:
    (cfg.mailer_templates_magic_link_content ?? '').length
});
