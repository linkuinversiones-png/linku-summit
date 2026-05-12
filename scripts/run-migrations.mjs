// Aplica migraciones SQL via Supabase Management API.
// Uso: node scripts/run-migrations.mjs
// Lee SUPABASE_PROJECT_REF y SUPABASE_ACCESS_TOKEN de .env.local.

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mini parser de .env.local
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

async function main() {
  const env = await loadEnv();
  const projectRef = env.SUPABASE_PROJECT_REF;
  const token = env.SUPABASE_ACCESS_TOKEN;

  if (!projectRef || !token) {
    console.error('Faltan SUPABASE_PROJECT_REF y/o SUPABASE_ACCESS_TOKEN en .env.local');
    process.exit(1);
  }

  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  console.log(`Aplicando ${files.length} migracion(es) al proyecto ${projectRef}\n`);

  for (const file of files) {
    process.stdout.write(`→ ${file}... `);
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    const result = await runSql(projectRef, token, sql);
    if (result.ok) {
      console.log('OK');
    } else {
      console.log(`FALLÓ (HTTP ${result.status})`);
      console.log(result.body);
      process.exit(1);
    }
  }

  console.log('\nTodas las migraciones aplicadas.');
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
