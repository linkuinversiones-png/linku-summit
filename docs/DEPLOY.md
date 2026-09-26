# Publicación a producción (Cloudflare Workers)

> Actualizado: 2026-09-26. El sitio corre en **Cloudflare Workers** vía
> `@opennextjs/cloudflare` (NO Vercel — el HANDOFF.md viejo está desactualizado en eso).
> Dominios: `www.linkusummit.com` y `linkusummit.com` → Worker `linku-summit`.

## Cómo se publica hoy: automático con GitHub Actions

> Desde 2026-09-26, **producción = rama `main`**. Cada push a `main` compila y publica
> solo, en 3 a 5 minutos, con el workflow `.github/workflows/deploy.yml`.
> **No se debe publicar a mano con wrangler salvo emergencia** (ver Plan B al final).

### Flujo normal

```bash
# 1. Si hay .sql nuevos en supabase/migrations/, aplicarlos ANTES del push (manual, como siempre)
node scripts/run-migrations.mjs

# 2. Commit + push a main → GitHub Actions publica solo
git add -A && git commit -m "..." && git push origin main
```

Las migraciones **no** las corre el workflow. Si el push trae archivos nuevos en
`supabase/migrations/`, el job muestra una advertencia amarilla en su resumen para
recordarlo, pero no las aplica. Hay que correrlas antes, desde una máquina con el
`SUPABASE_ACCESS_TOKEN` en `.env.local`.

### Qué hace el workflow, paso a paso

1. Descarga el código de `main`.
2. Avisa si el push trae migraciones nuevas (advertencia, no bloquea).
3. Node 22 + `npm ci`.
4. `npx opennextjs-cloudflare build` con las `NEXT_PUBLIC_*` de producción.
5. `npx wrangler deploy .open-next/worker.js --name linku-summit`.
6. Comprueba que `https://www.linkusummit.com/` responda 200 **y** que el `BUILD_ID`
   publicado sea el recién compilado. Si no, el job queda en rojo.

Nunca corren dos publicaciones a la vez: si llegan dos pushes seguidos, el segundo
espera a que termine el primero.

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
| variable | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| variable | `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Bucket de imágenes (`summit-media`) |
| variable | `NEXT_PUBLIC_SITE_URL` | `https://www.linkusummit.com` (nunca localhost) |

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

### Migraciones son manuales
`node scripts/run-migrations.mjs` es idempotente (tabla `_applied_migrations`).
Correrlo ANTES del push si el código nuevo depende de columnas nuevas.

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
