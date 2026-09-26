// Aplica migraciones SQL via Supabase Management API.
//
// IDEMPOTENTE: rastrea las migraciones aplicadas en la tabla
// public._applied_migrations y solo corre las nuevas. Esto evita que
// los seeds re-inserten datos que ya fueron borrados desde admin.
//
// Uso: node scripts/run-migrations.mjs
//      node scripts/run-migrations.mjs --force <archivo>   ← re-aplica una específica
//
// Lee SUPABASE_PROJECT_REF y SUPABASE_ACCESS_TOKEN primero de las variables
// de entorno del proceso (así corre en GitHub Actions, ver
// .github/workflows/deploy.yml); si no están ahí, las busca en .env.local
// (uso manual/local, como siempre). Si .env.local no existe pero las
// variables ya vinieron del entorno, no hace falta el archivo y no falla.

import { readFile, readdir } from 'node:fs/promises';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isCI = process.env.CI === 'true';

async function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env.local');
  let content;
  try {
    content = await readFile(envPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
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

async function resolveConfig() {
  let projectRef = process.env.SUPABASE_PROJECT_REF;
  let token = process.env.SUPABASE_ACCESS_TOKEN;

  if (!projectRef || !token) {
    const fileEnv = await loadEnvFile();
    projectRef = projectRef || fileEnv.SUPABASE_PROJECT_REF;
    token = token || fileEnv.SUPABASE_ACCESS_TOKEN;
  }

  return { projectRef, token };
}

// El endpoint de Management API de Supabase, en éxito, responde con un
// arreglo de filas (a veces `[]`). Pero a veces reporta errores de SQL con
// HTTP 2xx y un cuerpo tipo objeto (`{ error: ... }` o `{ message: ... }`)
// en vez de un status de error. Por eso `ok` no depende solo de `res.ok`:
// si el cuerpo parsea a un objeto (no arreglo) con `error` o `message`, se
// trata como fallo también. Centralizado aquí para que todo el que llame a
// runSql (ensureTrackingTable, getApplied, markApplied, el loop principal y
// --force) quede protegido sin duplicar la lógica.
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
  let ok = res.ok;
  if (ok) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }
    const isErrorShaped =
      parsed !== undefined &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      typeof parsed === 'object' &&
      ('error' in parsed || 'message' in parsed);
    if (isErrorShaped) ok = false;
  }
  return { ok, status: res.status, body: text };
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

// Devuelve { rows } con la lista de migraciones ya trackeadas. A diferencia
// de una versión anterior, un error de red/HTTP o una respuesta que no se
// puede parsear como JSON NUNCA se interpreta como "tabla vacía": eso
// causaría que el modo bootstrap (más abajo) marque todo como aplicado sin
// correrlo, o que se reintenten migraciones ya aplicadas. Cualquier lectura
// que falle termina el proceso con exit 1.
async function getApplied(projectRef, token) {
  const r = await runSql(
    projectRef,
    token,
    `select name from public._applied_migrations order by name;`
  );
  if (!r.ok) {
    console.error('Error leyendo tracking (HTTP ' + r.status + '):', r.body);
    process.exit(1);
  }
  let rows;
  try {
    rows = JSON.parse(r.body);
  } catch (err) {
    console.error('Error leyendo tracking: la respuesta no es JSON válido.');
    console.error('Cuerpo recibido:', r.body);
    process.exit(1);
  }
  if (!Array.isArray(rows)) {
    console.error('Error leyendo tracking: se esperaba un arreglo de filas y llegó otra cosa.');
    console.error('Cuerpo recibido:', r.body);
    process.exit(1);
  }
  return new Set(rows.map((row) => row.name));
}

async function markApplied(projectRef, token, name) {
  // Escape simple: name viene de readdir() y matchea ^[a-zA-Z0-9_.-]+$, no hay
  // riesgo de inyección. Aun así usamos $$...$$ para mayor robustez.
  const safe = name.replace(/'/g, "''");
  const insertSql = `insert into public._applied_migrations (name) values ('${safe}') on conflict (name) do nothing;`;
  const r = await runSql(projectRef, token, insertSql);
  if (!r.ok) {
    // La migración SÍ corrió (este código solo se llama después de aplicarla
    // con éxito); lo que falló es solo el registro de tracking. Si seguimos
    // como si nada, la próxima corrida no verá `name` en el tracking y
    // intentará re-aplicarla — potencialmente destructivo para migraciones no
    // idempotentes. Por eso esto es fatal, no una advertencia.
    console.error(
      `ERROR CRÍTICO: la migración '${name}' se ejecutó correctamente, pero no se pudo ` +
        'registrar en public._applied_migrations (tracking). Debes registrarla a mano antes ' +
        'de volver a publicar, o la próxima corrida intentará re-aplicarla.'
    );
    console.error(`SQL para registrarla a mano:\n  ${insertSql}`);
    console.error('Detalle del error:', r.body);
    appendJobSummary([
      '## ❌ Migraciones de Supabase: falló el registro de tracking',
      '',
      `La migración \`${name}\` se ejecutó correctamente, pero no quedó registrada en ` +
        '`public._applied_migrations`. Regístrala a mano antes de volver a publicar:',
      '',
      '```sql',
      insertSql,
      '```'
    ]);
    process.exit(1);
  }
}

function appendJobSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  try {
    appendFileSync(summaryPath, lines.join('\n') + '\n');
  } catch (err) {
    console.warn('No se pudo escribir GITHUB_STEP_SUMMARY:', err.message);
  }
}

async function main() {
  const { projectRef, token } = await resolveConfig();

  if (!projectRef || !token) {
    console.error('Faltan SUPABASE_PROJECT_REF y/o SUPABASE_ACCESS_TOKEN (variables de entorno o .env.local)');
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
    console.log(`\nMigraciones aplicadas: ${forceFile} (--force)`);
    appendJobSummary([
      '## Migraciones de Supabase',
      '',
      `Re-aplicada a la fuerza: \`${forceFile}\`.`
    ]);
    return;
  }

  const applied = await getApplied(projectRef, token);

  // Bootstrap: si NUNCA se ha trackeado nada pero hay migraciones, asumimos
  // que las que están en el repo ya fueron aplicadas (caso típico al introducir
  // este tracking en un proyecto existente). Las registramos SIN re-correrlas.
  //
  // En CI este modo está desactivado a propósito: si el workflow automático
  // encuentra la tabla de tracking vacía, algo anda mal (proyecto nuevo sin
  // bootstrap manual previo, o problema leyendo la tabla) y NO se debe asumir
  // que todas las migraciones ya corrieron. En ese caso es un error: hay que
  // correr el bootstrap una vez a mano desde una máquina de desarrollo.
  if (applied.size === 0 && files.length > 0) {
    if (isCI) {
      console.error(
        `Tabla de tracking vacía en CI (0 de ${files.length} migración(es) registradas). ` +
          'No se asume bootstrap automático en GitHub Actions: corre ' +
          '"node scripts/run-migrations.mjs" una vez a mano desde una máquina de desarrollo ' +
          'para inicializar el tracking, y vuelve a intentar el workflow.'
      );
      appendJobSummary([
        '## ❌ Migraciones de Supabase: tracking vacío',
        '',
        'La tabla `public._applied_migrations` está vacía. En CI esto se trata como error ' +
          '(no se asume bootstrap) para evitar re-ejecutar migraciones ya aplicadas. ' +
          'Corre el script a mano una vez desde una máquina de desarrollo.'
      ]);
      process.exit(1);
    }
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
    console.log('Sin migraciones nuevas. (Total aplicadas: ' + applied.size + ')');
    appendJobSummary(['## Migraciones de Supabase', '', 'Sin migraciones nuevas.']);
    return;
  }

  console.log(`Aplicando ${pending.length} migración(es) nuevas al proyecto ${projectRef}\n`);

  const aplicadasOk = [];

  for (const file of pending) {
    process.stdout.write(`→ ${file}... `);
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    const result = await runSql(projectRef, token, sql);
    if (result.ok) {
      await markApplied(projectRef, token, file);
      console.log('OK');
      aplicadasOk.push(file);
    } else {
      console.log(`FALLÓ (HTTP ${result.status})`);
      console.log(result.body);
      appendJobSummary([
        '## ❌ Migraciones de Supabase: falló una migración',
        '',
        `Se aplicaron correctamente antes de fallar: ${
          aplicadasOk.length ? aplicadasOk.map((f) => `\`${f}\``).join(', ') : '(ninguna)'
        }`,
        '',
        `Falló: \`${file}\` (HTTP ${result.status})`
      ]);
      process.exit(1);
    }
  }

  console.log(`\nMigraciones aplicadas: ${aplicadasOk.join(', ')}`);
  appendJobSummary([
    '## Migraciones de Supabase',
    '',
    'Aplicadas en este job:',
    '',
    ...aplicadasOk.map((f) => `- \`${f}\``)
  ]);
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
