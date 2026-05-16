// Limpia datos de prueba: tiers + orders + tickets emitidos.
// NO toca profiles, auth.users ni coupons.
//
// Uso:
//   node scripts/cleanup-test-data.mjs            → solo lista lo que hay
//   node scripts/cleanup-test-data.mjs --apply    → borra todo (CUIDADO)

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

console.log('--- TIERS actuales ---');
const { data: tiers } = await sb
  .from('ticket_tiers')
  .select('slug, name_es, price_cop, sold_count, active')
  .order('sort_order');
console.table(tiers);

console.log('--- ORDERS actuales ---');
const { data: orders } = await sb
  .from('orders')
  .select('id, ticket_tier, status, total_cop, payment_reference, paid_at')
  .order('created_at', { ascending: false })
  .limit(50);
console.table(orders);

console.log('--- TICKETS_ISSUED actuales ---');
const { data: tickets } = await sb
  .from('tickets_issued')
  .select('id, ticket_tier, attendee_email, status, used_at')
  .order('created_at', { ascending: false })
  .limit(50);
console.table(tickets);

if (!process.argv.includes('--apply')) {
  console.log('\n(dry-run) Re-corre con --apply para borrar TODO lo de arriba.');
  process.exit(0);
}

console.log('\n--- BORRANDO ---');

// Orden importa por FKs: tickets → orders → tiers
const { error: e1 } = await sb.from('tickets_issued').delete().not('id', 'is', null);
if (e1) { console.error('Error borrando tickets:', e1); process.exit(1); }
console.log('tickets_issued: borrados');

const { error: e2 } = await sb.from('orders').delete().not('id', 'is', null);
if (e2) { console.error('Error borrando orders:', e2); process.exit(1); }
console.log('orders: borradas');

const { error: e3 } = await sb.from('ticket_tiers').delete().not('id', 'is', null);
if (e3) { console.error('Error borrando tiers:', e3); process.exit(1); }
console.log('ticket_tiers: borrados');

console.log('\n--- ESTADO FINAL ---');
const { data: tiersAfter } = await sb.from('ticket_tiers').select('*');
const { data: ordersAfter } = await sb.from('orders').select('*');
const { data: ticketsAfter } = await sb.from('tickets_issued').select('*');
console.log(`tiers: ${tiersAfter?.length ?? 0}`);
console.log(`orders: ${ordersAfter?.length ?? 0}`);
console.log(`tickets: ${ticketsAfter?.length ?? 0}`);
