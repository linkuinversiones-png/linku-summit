// Script temporal para crear un tier de prueba a $1.000 COP.
// Uso: node scripts/seed-test-tier.mjs
// Para borrarlo después: node scripts/seed-test-tier.mjs --delete

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Carga .env.local manualmente (sin dotenv)
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

const SLUG = 'test-1k';

if (process.argv.includes('--delete')) {
  const { error } = await sb.from('ticket_tiers').delete().eq('slug', SLUG);
  if (error) {
    console.error('Error borrando:', error);
    process.exit(1);
  }
  console.log(`Tier ${SLUG} eliminado.`);
  process.exit(0);
}

const tier = {
  slug: SLUG,
  name_es: 'Test 40K',
  name_en: 'Test 40K',
  label_es: 'Tier de prueba sandbox',
  label_en: 'Test tier sandbox',
  price_cop: 40000,
  price_note_es: 'Para validar flujo de pago',
  price_note_en: 'To validate payment flow',
  benefits_es: ['Tier solo para pruebas tecnicas'],
  benefits_en: ['Tier only for technical tests'],
  highlight: false,
  cta_label_es: 'Probar pago',
  cta_label_en: 'Test payment',
  cta_href: `/checkout?tier=${SLUG}`,
  sort_order: 999,
  active: true
};

const { data, error } = await sb
  .from('ticket_tiers')
  .upsert(tier, { onConflict: 'slug' })
  .select();

if (error) {
  console.error('Error insertando:', error);
  process.exit(1);
}

console.log('Tier creado/actualizado:', data?.[0]);
console.log(`\nProbar en: http://localhost:3000/checkout?tier=${SLUG}`);
