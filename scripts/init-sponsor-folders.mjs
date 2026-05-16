// Crea las 8 carpetas de sponsors en Supabase Storage subiendo un
// archivo .keep en cada una (necesario porque Storage no soporta
// carpetas vacías). Idempotente: --upsert sobreescribe sin error.
//
// Uso: node scripts/init-sponsor-folders.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envText = readFileSync(resolve('.env.local'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'summit-media';

const CATEGORIES = [
  'series-c',
  'series-b',
  'series-a',
  'pre-series-a',
  'seed',
  'pre-seed',
  'angel',
  'aliados'
];

const placeholder = Buffer.from(
  'Carpeta para logos de sponsors. Sube PNG (preferiblemente blancos sobre transparente) y aparecen en el landing.',
  'utf8'
);

for (const cat of CATEGORIES) {
  const path = `sponsors/${cat}/.keep`;
  const { error } = await sb.storage.from(BUCKET).upload(path, placeholder, {
    contentType: 'text/plain',
    upsert: true
  });
  if (error) {
    console.error(`✗ ${cat}: ${error.message}`);
  } else {
    console.log(`✓ ${cat}`);
  }
}

console.log('\nListo. Carpetas creadas en summit-media/sponsors/.');
console.log('Sube logos PNG en cada carpeta desde el dashboard de Supabase Storage.');
