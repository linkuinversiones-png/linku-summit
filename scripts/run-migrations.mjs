// Aplica migraciones SQL via Supabase Management API.
//
// IDEMPOTENTE: rastrea las migraciones aplicadas en la tabla
// public._applied_migrations y solo corre las nuevas. Esto evita que
// los seeds re-inserten datos que ya fueron borrados desde admin.
//
// Uso: node scripts/run-migrations.mjs
//      node scripts/run-migrations.mjs --force <archivo>   ← re-aplica una específica
//
// Lee SUPABASE_PROJECT_REF y SUPABASE_ACCESS_TOKEN de .env.local.

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local');
  const content = await readFile(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function runSql(projectRef, token, sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  );
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function ensureTrackingTable(projectRef, token) {
  const sql = `
    create table if not exists public._applied_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `;
  const r = await runSql(projectRef, token, sql);
  if (!r.ok) {
    console.error('No se pudo crear tabla de tracking:', r.body);
    process.exit(1);
  }
}

async function getApplied(projectRef, token) {
  const r = await runSql(
    projectRef,
    token,
    `select name from public._applied_migrations order by name;`
  );
  if (!r.ok) {
    console.error('Error leyendo tracking:', r.body);
    process.exit(1);
  }
  try {
    const rows = JSON.parse(r.body);
    return new Set(rows.map((row) => row.name));
  } catch {
    return new Set();
  }
}

async function markApplied(projectRef, token, name) {
  // Escape simple: name viene de readdir() y matchea ^[a-zA-Z0-9_.-]+$, no hay
  // riesgo de inyección. Aun así usamos $$...$$ para mayor robustez.
  const safe = name.replace(/'/g, "''");
  const sql = `insert into public._applied_migrations (name) values ('${safe}') on conflict (name) do nothing;`;
  const r = await runSql(projectRef, token, sql);
  if (!r.ok) console.warn('Warning: no pude registrar', name, r.body);
}

async function main() {
  const env = await loadEnv();
  const projectRef = env.SUPABASE_PROJECT_REF;
  const token = env.SUPABASE_ACCESS_TOKEN;

  if (!projectRef || !token) {
    console.error('Faltan SUPABASE_PROJECT_REF y/o SUPABASE_ACCESS_TOKEN en .env.local');
    process.exit(1);
  }

  // Flags
  const args = process.argv.slice(2);
  const forceIdx = args.indexOf('--force');
  const forceFile = forceIdx >= 0 ? args[forceIdx + 1] : null;

  await ensureTrackingTable(projectRef, token);

  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  // Modo force: aplica una migración específica de nuevo (útil para corregir).
  if (forceFile) {
    if (!files.includes(forceFile)) {
      console.error(`No existe la migración ${forceFile}`);
      process.exit(1);
    }
    console.log(`Modo --force: re-aplicando ${forceFile}`);
    const sql = await readFile(join(migrationsDir, forceFile), 'utf8');
    const r = await runSql(projectRef, token, sql);
    if (!r.ok) {
      console.error('FALLÓ:', r.body);
      process.exit(1);
    }
    await markApplied(projectRef, token, forceFile);
    console.log('OK');
    return;
  }

  const applied = await getApplied(projectRef, token);

  // Bootstrap: si NUNCA se ha trackeado nada pero hay migraciones, asumimos
  // que las que están en el repo ya fueron aplicadas (caso típico al introducir
  // este tracking en un proyecto existente). Las registramos SIN re-correrlas.
  if (applied.size === 0 && files.length > 0) {
    console.log(
      `Bootstrap: registrando ${files.length} migración(es) como aplicadas (no se re-ejecutan).`
    );
    for (const f of files) {
      await markApplied(projectRef, token, f);
      console.log(`  · ${f}`);
    }
    console.log('\nHecho. Vuelve a correr este script cuando añadas migraciones nuevas.');
    return;
  }

  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('No hay migraciones pendientes. (Total aplicadas: ' + applied.size + ')');
    return;
  }

  console.log(`Aplicando ${pending.length} migración(es) nuevas al proyecto ${projectRef}\n`);

  for (const file of pending) {
    process.stdout.write(`→ ${file}... `);
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    const result = await runSql(projectRef, token, sql);
    if (result.ok) {
      await markApplied(projectRef, token, file);
      console.log('OK');
    } else {
      console.log(`FALLÓ (HTTP ${result.status})`);
      console.log(result.body);
      process.exit(1);
    }
  }

  console.log('\nMigraciones aplicadas.');
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
