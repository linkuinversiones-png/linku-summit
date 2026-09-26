# Publicación a producción (Cloudflare Workers)

> Actualizado: 2026-09-26. El sitio corre en **Cloudflare Workers** vía
> `@opennextjs/cloudflare` (NO Vercel — el HANDOFF.md viejo está desactualizado en eso).
> Dominios: `www.linkusummit.com` y `linkusummit.com` → Worker `linku-summit`.

## Cómo se publica hoy: automático con GitHub Actions

> Desde 2026-09-26, **producción = rama `main`**. Cada push a `main` aplica las
> migraciones de Supabase pendientes, compila y publica solo, en unos minutos,
> con el workflow `.github/workflows/deploy.yml`.
> **No se debe publicar a mano con wrangler salvo emergencia** (ver Plan B al final).

### Flujo normal

```bash
# Commit + push a main → GitHub Actions aplica migraciones, compila y publica
git add -A && git commit -m "..." && git push origin main
```

Ya no hace falta correr las migraciones a mano antes del push: el workflow las
aplica automáticamente, en un paso propio, antes de compilar. Si una migración
falla, el job se detiene ahí mismo — no se compila ni se publica nada, y
producción sigue con la versión anterior sin cambios.

### Qué hace el workflow, paso a paso

1. Descarga el código de `main`.
2. Node 22 + `npm ci`.
3. **Aplica migraciones de Supabase**: `node scripts/run-migrations.mjs`, usando
   `SUPABASE_ACCESS_TOKEN` (secret) y `SUPABASE_PROJECT_REF` (variable). Es
   idempotente — solo corre los `.sql` de `supabase/migrations/` que todavía no
   estén marcados en `public._applied_migrations`. Si falla, o si faltan esas
   credenciales en GitHub, el job para aquí (rojo) y no sigue al build.
4. `npx opennextjs-cloudflare build` con las `NEXT_PUBLIC_*` de producción.
5. `npx wrangler deploy .open-next/worker.js --name linku-summit`.
6. Comprueba que `https://www.linkusummit.com/` responda 200 **y** que el `BUILD_ID`
   publicado sea el recién compilado. Si no, el job queda en rojo.

Nunca corren dos publicaciones a la vez: si llegan dos pushes seguidos, el segundo
espera a que termine el primero (importante también para las migraciones: nunca
se aplican dos tandas en paralelo).

### Si el paso de migraciones falla

El job queda en rojo y el sitio en producción **no cambia** (los pasos
siguientes — build y deploy — no llegan a correr). Para diagnosticar:

1. GitHub → pestaña **Actions** → la ejecución en rojo → abre el paso
   "Aplicar migraciones de Supabase" y lee el error. El script imprime el
   archivo `.sql` que falló y el cuerpo de la respuesta de Supabase (nunca el
   token).
2. Corrige la migración (o el problema de conectividad/credenciales) y haz un
   nuevo commit a `main`, o relanza el workflow desde "Run workflow" una vez
   arreglado.
3. Si el error es "Faltan SUPABASE_ACCESS_TOKEN y/o SUPABASE_PROJECT_REF",
   configúralos en GitHub (ver tabla de abajo) y vuelve a correr el workflow.
4. Plan B si hay urgencia y el workflow no se puede arreglar rápido: aplicar la
   migración a mano con `node scripts/run-migrations.mjs` desde una máquina de
   desarrollo con `.env.local`, y luego relanzar el workflow (ya no encontrará
   pendientes y seguirá directo al build).

El script también puede fallar por dos casos particulares:

- **Respuesta de Supabase con HTTP 2xx pero cuerpo de error**: la Management
  API a veces reporta un error SQL con status 2xx y un cuerpo tipo objeto
  (`{ error: ... }` o `{ message: ... }`) en vez de un `.sql` en éxito (que
  siempre es un arreglo de filas, incluso vacío `[]`). El script detecta esto
  y lo trata como fallo igual que un HTTP de error: no marca la migración como
  aplicada y termina con `exit 1`.
- **La migración corrió bien pero no se pudo registrar en el tracking**: si el
  `insert` en `public._applied_migrations` falla después de que la migración
  ya se ejecutó con éxito, el script NO sigue como si nada — imprime un error
  crítico con el SQL exacto para registrarla a mano, lo anota en el resumen
  del job, y termina con `exit 1`. Hay que correr ese `insert` manualmente
  (desde el SQL Editor de Supabase, no con `--force`, que re-ejecutaría la
  migración completa) antes de volver a publicar, porque si no la próxima
  corrida intentará re-aplicar esa migración.

**Toda migración nueva debe ser idempotente y no destructiva**: el workflow la
corre solo, sin revisión humana en el momento, directo contra producción. Usa
`create table if not exists`, `add column if not exists`, `on conflict do
nothing`, etc., y evita `drop`/`delete` irreversibles salvo que el PR lo deje
explícito y revisado.

### Publicar a mano desde GitHub (sin hacer push)

GitHub → repo `linkuinversiones-png/linku-summit` → pestaña **Actions** → workflow
**"Publicar en Cloudflare"** → botón **Run workflow** → rama `main` → **Run workflow**.
Sirve para republicar lo que ya está en `main`, por ejemplo tras cambiar un secreto del
Worker o si un deploy falló por algo transitorio.

### Ver el estado

- Pestaña **Actions**: cada ejecución muestra verde (publicado) o rojo (falló), con un
  resumen al final: BUILD_ID publicado, commit y advertencias de migraciones.
- Desde terminal: `gh run list --workflow deploy.yml` y `gh run watch`.
- Si el job falla en el paso de compilación o publicación, producción **no cambia**:
  wrangler solo activa la versión nueva cuando la subida termina bien.

### Rollback (volver a la versión anterior)

Opción A, desde cualquier máquina con el token personal:

```bash
CLOUDFLARE_API_TOKEN=<token> npx wrangler deployments list   # ver versiones
CLOUDFLARE_API_TOKEN=<token> npx wrangler rollback            # volver a la anterior
```

Opción B, sin token: revertir el commit en `main` (`git revert <sha>` + push). El
workflow publica la versión revertida en unos minutos.

### Qué hay configurado en GitHub

Settings → Secrets and variables → Actions.

| Tipo | Nombre | Para qué |
|---|---|---|
| secret | `CLOUDFLARE_API_TOKEN` | Token **exclusivo de GitHub**, plantilla "Edit Cloudflare Workers", limitado a la cuenta LinkU. Distinto del token personal de la máquina de desarrollo; si se filtra, se revoca solo ese. |
| secret | `CLOUDFLARE_ACCOUNT_ID` | Cuenta de Cloudflare donde vive el Worker |
| secret | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública de Supabase (va incrustada en el build) |
| secret | `SUPABASE_ACCESS_TOKEN` | Token de la Management API de Supabase, para que el workflow aplique migraciones. Genéralo en https://supabase.com/dashboard/account/tokens. |
| variable | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| variable | `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Bucket de imágenes (`summit-media`) |
| variable | `NEXT_PUBLIC_SITE_URL` | `https://www.linkusummit.com` (nunca localhost) |
| variable | `SUPABASE_PROJECT_REF` | Referencia del proyecto Supabase (el mismo valor que en `.env.local`) |

**Importante:** hasta que `SUPABASE_ACCESS_TOKEN` y `SUPABASE_PROJECT_REF` estén
configurados en GitHub, el paso "Aplicar migraciones de Supabase" falla siempre
(el script exige ambos y no continúa sin ellos) y por lo tanto **todas las
publicaciones automáticas fallarán**, sin afectar el sitio en vivo (el build y
el deploy nunca llegan a correr). Configúralos antes de fusionar el cambio que
introdujo este paso a `main`.

Los secretos del Worker en runtime (Wompi, Resend, InContacto, QR, service role) siguen
en Cloudflare y **no** pasan por GitHub. Ver "Secrets del Worker" más abajo.

## Credenciales

- **CLOUDFLARE_API_TOKEN (GitHub)**: creado en https://dash.cloudflare.com/profile/api-tokens
  con la plantilla "Edit Cloudflare Workers", limitado a la cuenta `linkuinversiones@gmail.com`
  (Account ID `dd64afecafba4443d4dac8b59a3818bc`). Vive solo en los secrets del repo.
- **CLOUDFLARE_API_TOKEN (personal, plan B)**: otro token con la misma plantilla, en la
  máquina de desarrollo. Se crea/revoca en la misma página.
- Alternativa interactiva: `npx wrangler login` (OAuth en el browser).
  Nota: en esta máquina el OAuth ha fallado con `request_forbidden / CSRF`;
  el API token es lo que funciona de forma consistente.

## Secrets del Worker (runtime)

Se gestionan con `wrangler secret put <NAME>` o desde el dashboard
(Workers → linku-summit → Settings → Variables and Secrets). Actuales:

| Secret | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server (órdenes, webhooks) |
| `WOMPI_PUBLIC_KEY` / `WOMPI_PRIVATE_KEY` | Pasarela Wompi (prefijos `pub_prod_`/`prv_prod_`) |
| `WOMPI_INTEGRITY_SECRET` | Firma `signature:integrity` del checkout |
| `WOMPI_EVENTS_SECRET` | Checksum del webhook `/api/webhooks/wompi` |
| `WOMPI_TEST_MODE` | `false` en producción |
| `RESEND_API_KEY` | Envío de emails (boletas, OTP) |
| `INCONTACTO_API_TOKEN` | Registro de asistentes en InContacto |
| `QR_HMAC_SECRET` | Firma de los QR de boletas |
| `NEXT_PUBLIC_SITE_URL` | Ver advertencia abajo |

Actualizar un secret crea una version nueva del Worker y la despliega
automáticamente al 100% (~30 s). No requiere rebuild.

## ⚠️ Advertencias importantes

### `NEXT_PUBLIC_*` NO funciona en runtime
Next.js reemplaza las vars `NEXT_PUBLIC_*` **en build time**. Ponerlas como secret
del Worker NO tiene efecto en código ya compilado. Por eso el workflow las recibe en el
paso de build, y por eso `app/[locale]/checkout/actions.ts` deriva la URL base del
request (`x-forwarded-host`) en vez de leer `NEXT_PUBLIC_SITE_URL`.
Historia: en sep 2026 producción mandaba `redirect-url=http://localhost:3000`
a Wompi y Wompi bloqueaba todo con **403 CloudFront**.

### El 403 de Wompi casi siempre es de ellos, no nuestro
Si el checkout muestra "403 ERROR / Generated by cloudfront", Wompi rechazó la
petición. Causas vistas: public key mal copiada (typo), `redirect-url` con
localhost. Debug: copiar la URL completa del address bar y revisar cada parámetro.

### Migraciones: automáticas desde el workflow, con plan B manual
Desde este cambio, `.github/workflows/deploy.yml` corre
`node scripts/run-migrations.mjs` automáticamente antes de compilar. El script
sigue siendo idempotente (tabla `_applied_migrations`) y también se puede
correr a mano en cualquier momento como plan B (por ejemplo si el workflow no
está disponible, o para probar una migración antes del push).

### El Worker necesita el plan Workers Paid
Una portada consume 50 a 500 ms de CPU. Con el plan Free (10 ms) Cloudflare mata
~20 % de las visitas con "Error 1102". `wrangler.jsonc` declara `limits.cpu_ms: 30000`,
que **solo se acepta con Workers Paid**: si el plan baja a Free, el deploy falla con
`code 100328` hasta quitar ese bloque.

## Ver logs de producción

```bash
CLOUDFLARE_API_TOKEN=<token> npx wrangler tail linku-summit --format=pretty
```

---

## Plan B: publicación manual desde una máquina

Solo para emergencias (GitHub caído, workflow roto). Requiere el token personal de
Cloudflare en la máquina. **Después de usarlo, asegurarse de que `main` tenga
exactamente lo publicado**, porque el siguiente push a `main` lo sobrescribe.

```bash
# 1. Migraciones de DB (si hay .sql nuevos en supabase/migrations/)
node scripts/run-migrations.mjs

# 2. Limpiar artefactos y basura de OneDrive (ver abajo)
rm -rf .next .open-next
find . -maxdepth 4 -name "desktop.ini" -not -path "./node_modules/*" -delete

# 3. Build del worker (las NEXT_PUBLIC_* salen de .env.local; ojo con NEXT_PUBLIC_SITE_URL)
npx opennextjs-cloudflare build

# 4. Deploy
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> npx wrangler deploy .open-next/worker.js --name linku-summit

# 5. Verificar
curl -s -o /dev/null -w "%{http_code}" https://www.linkusummit.com/
```

También existe `npm run deploy` (= build + deploy en un paso), pero en esta máquina
falla a veces porque el token no llega al subproceso de wrangler. Los pasos 3–4
separados con el token inline son el camino confiable.

### OneDrive rompe el build local
OneDrive crea archivos `desktop.ini` dentro de `.next/` que hacen fallar el copy
de opennext (`ENOENT ... desktop.ini`). Siempre correr el `find ... -delete` del
paso 2 antes de buildear. Si el build falla igual, borrar `.next` y `.open-next`
completos y reintentar. Apagar antes el `next dev` local: dos procesos escribiendo
`.next` a la vez lo corrompen.
