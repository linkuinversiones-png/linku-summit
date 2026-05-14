# LinkU Summit 2026 — Handoff técnico

**Última actualización:** 2026-05-13
**Branch:** `main`
**Stack:** Next.js 14.2 (App Router) · React 18 · TypeScript strict · Tailwind 3.4 · Supabase (Postgres + Auth + Storage) · Resend (email) · Wompi (pagos) · qrcode (QR)

---

## 0. TL;DR del estado

| Módulo | Estado | Notas |
|---|---|---|
| Landing pública bilingüe (ES/EN) | ✅ Operativo | i18n con `[locale]` segment, SEO + JSON-LD listos |
| Auth con magic link (Supabase) | ✅ Operativo | Resend conectado como SMTP custom de Supabase Auth |
| `/me` con perfil + boletas + QR | ✅ Operativo | QR firmado HMAC se renderiza inline |
| Admin `/admin` con guard por rol | ✅ Operativo | Solo `profiles.role = 'admin'` entra |
| CRUD de entradas `/admin/tiers` | ✅ Operativo | Tabla `ticket_tiers` con campos bilingües |
| Checkout `/checkout` + Wompi | ⚠️ **Bloqueado** | Falta pegar 4 llaves de Wompi en `.env.local`. Bug del `cta_href` ya corregido |
| Email transaccional con QR (Resend) | ⚠️ Implementado, sin probar | El webhook lo dispara cuando una orden pasa a `paid` |
| Portería QR (scan + check-in) | ❌ No empezado | Schema listo (`tickets_issued.used_at`), falta UI |
| Agenda de citas 1:1 | ❌ No empezado | Roles definidos en `profiles.role` |
| Agente IA concierge | ❌ No empezado | Decidido: Claude Haiku 4.5 + prompt caching, cap USD $20/mes |
| Correos masivos | ❌ No empezado | API key de Resend disponible |

**Bug crítico activo:** Wompi no funciona end-to-end porque faltan las 4 env vars del proveedor. Una vez pegadas debería andar.

---

## 1. Setup desde cero

### 1.1 Pre-requisitos

- **Node.js 20+** (probado con 20.x). Verifica: `node -v`.
- **Git** y acceso al repo `linku_summit`.
- Cuenta en:
  - **Supabase** (proyecto creado, base de datos Postgres)
  - **Resend** (con dominio `linkusummit.com` verificado)
  - **Wompi Colombia** (cuenta comercio, llaves sandbox o producción)
  - **Vercel** (para deploys)

### 1.2 Clonar y dependencias

```powershell
git clone https://github.com/linkuinversiones-png/linku_summit.git
cd linku_summit
npm install
```

### 1.3 Variables de entorno

Copia `.env.local.example` a `.env.local` y rellena los valores reales. Lista completa:

```bash
# --- Supabase (público — embebido en el cliente) ---
NEXT_PUBLIC_SUPABASE_URL=https://tpvyrvjqamkhhqlrefwg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>

# --- Supabase (privado — NUNCA al cliente) ---
SUPABASE_SERVICE_ROLE_KEY=<service_role key>     # ← necesaria para el webhook
SUPABASE_PROJECT_REF=tpvyrvjqamkhhqlrefwg
SUPABASE_ACCESS_TOKEN=<PAT generado en supabase.com/dashboard/account/tokens>

# --- Storage (público) ---
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=summit-media

# --- Wompi (PEGAR ESTOS PARA QUE FUNCIONE CHECKOUT) ---
WOMPI_ENV=test
WOMPI_PUBLIC_KEY=pub_test_xxx
WOMPI_PRIVATE_KEY=prv_test_xxx
WOMPI_INTEGRITY_SECRET=test_integrity_xxx
WOMPI_EVENTS_SECRET=test_events_xxx

# --- Resend (transaccionales nuestros) ---
RESEND_API_KEY=re_xxx

# --- QR firmado HMAC ---
QR_HMAC_SECRET=<32+ chars random; genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# --- URL base ---
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # dev
# NEXT_PUBLIC_SITE_URL=https://linkusummit.com   # prod
```

**Dónde conseguir cada cosa:**

| Variable | Dónde |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Igual (debajo, "service_role secret", click ojo) |
| `SUPABASE_PROJECT_REF` | Igual (URL del proyecto) o `Settings → General → Reference ID` |
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens → Generate token |
| `WOMPI_*` | Dashboard Wompi → **Desarrolladores → Llaves API** |
| `RESEND_API_KEY` | Dashboard Resend → API Keys |

### 1.4 Aplicar migraciones de Supabase

El script `scripts/run-migrations.mjs` es **idempotente**: usa la tabla `_applied_migrations` para rastrear cuáles ya corrieron.

```powershell
node scripts/run-migrations.mjs
```

**Primera vez en un proyecto existente** (DB ya tiene las migraciones aplicadas a mano):
- El script detecta tracking vacío y registra todas las del repo como "aplicadas" sin re-correrlas (bootstrap). Después aplicas migraciones nuevas normalmente.

**Re-aplicar una específica** (caso raro, ej. después de un rollback):
```powershell
node scripts/run-migrations.mjs --force 0005_ticket_tiers.sql
```

Migraciones actuales:

| Archivo | Qué hace |
|---|---|
| `0001_init.sql` | Tabla `profiles` + trigger auto-create + RLS |
| `0002_storage_bucket.sql` | Bucket público `summit-media` |
| `0003_orders_tickets_coupons.sql` | `orders`, `tickets_issued`, `coupons` |
| `0004_admin_helpers.sql` | Función `is_admin()` + RLS de admin |
| `0005_ticket_tiers.sql` | Tabla `ticket_tiers` bilingüe + seed (Early/Smart Investor) |
| `0006_relax_ticket_tier_check.sql` | Quita CHECK hardcoded, agrega FK a `ticket_tiers.slug` |
| `0007_orders_insert_policy.sql` | RLS INSERT en orders (users crean sus órdenes) |

### 1.5 Promover primer admin

Después de aplicar migraciones y que el usuario haya hecho **al menos un login** (para que exista en `auth.users`):

```sql
-- Ejecutar en Supabase Dashboard → SQL Editor
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'tu@email.com');
```

Verifica con:
```sql
select email, role from auth.users u
  join public.profiles p on p.id = u.id
  where p.role = 'admin';
```

### 1.6 Configurar Resend como SMTP de Supabase Auth

(Esto ya está hecho en este proyecto. Documentado por completitud.)

Dashboard Supabase → **Authentication → Email Templates → SMTP Settings → Enable Custom SMTP**:
```
Host:     smtp.resend.com
Port:     465
Username: resend
Password: <RESEND_API_KEY>
Sender:   LinkU Summit <noreply@linkusummit.com>
```

### 1.7 Configurar webhook de Wompi

Cuando tengas las llaves de Wompi en `.env.local`:

Dashboard Wompi → **Eventos → Agregar URL**:
- URL: `https://linkusummit.com/api/webhooks/wompi` (prod) o tu URL de Vercel preview
- Evento: `transaction.updated`

Para probar en **localhost**, expón con ngrok o similar:
```powershell
npx ngrok http 3000
# usa la URL https://xxxx.ngrok.io/api/webhooks/wompi
```

### 1.8 Redirect URLs en Supabase Auth

Dashboard Supabase → **Authentication → URL Configuration → Redirect URLs**, añadir:
```
http://localhost:3000/auth/callback
http://localhost:3000/en/auth/callback
https://linkusummit.com/auth/callback
https://linkusummit.com/en/auth/callback
```

Sin la versión `/en/` los logins desde la página en inglés rebotan.

### 1.9 Levantar dev

```powershell
npm run dev
# → http://localhost:3000
```

---

## 2. Estructura del repo

```
linku_summit/
├── app/
│   ├── [locale]/                  ← rutas públicas con i18n (es/en)
│   │   ├── page.tsx               ← landing
│   │   ├── layout.tsx
│   │   ├── not-found.tsx          ← 404 con branding
│   │   ├── login/                 ← magic link
│   │   ├── me/                    ← cuenta del usuario + QR
│   │   ├── auth/callback/         ← exchange code → session
│   │   └── checkout/
│   │       ├── page.tsx           ← crea orden pending + firma Wompi
│   │       ├── PaymentButton.tsx  ← form POST a checkout.wompi.co
│   │       ├── error.tsx          ← error boundary
│   │       └── success/           ← post-pago con polling
│   ├── admin/                     ← backoffice (sin i18n)
│   │   ├── layout.tsx             ← guard role=admin
│   │   ├── page.tsx               ← dashboard KPIs
│   │   └── tiers/                 ← CRUD de entradas
│   │       ├── page.tsx           ← listado
│   │       ├── actions.ts         ← server actions
│   │       ├── TierForm.tsx       ← form bilingüe
│   │       ├── RowActions.tsx
│   │       ├── new/page.tsx
│   │       └── [id]/page.tsx
│   ├── api/
│   │   ├── webhooks/wompi/route.ts ← procesa eventos Wompi
│   │   └── orders/status/route.ts  ← GET status para polling
│   ├── layout.tsx                  ← root, <html lang> dinámico
│   ├── globals.css
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── admin/AdminShell.tsx
│   ├── navigation/Navbar.tsx       ← con LocaleSwitcher
│   ├── navigation/Footer.tsx
│   ├── sections/                   ← Hero, About, Agenda, Speakers, Tickets, etc.
│   ├── ui/                         ← buttons, pills, cards, Countdown, LocaleSwitcher
│   └── seo/JsonLd.tsx
├── content/
│   ├── es/{site,speakers,agenda,tickets,sponsors,partners,faq,ui}.json
│   └── en/<mismos archivos>
├── lib/
│   ├── i18n/{config.ts,content.ts}
│   ├── seo/structured-data.ts
│   ├── supabase/{client,server,middleware}.ts
│   ├── tickets.ts                  ← lee ticket_tiers de DB
│   ├── wompi/{config,signatures}.ts
│   ├── qr/{sign,render}.ts
│   └── email/{send,templates}.ts
├── public/
│   ├── brand/                      ← logos LinkU
│   ├── speakers/                   ← fotos
│   └── partners/                   ← logos
├── scripts/run-migrations.mjs      ← idempotente con tracking
├── supabase/migrations/0001..0007.sql
├── docs/HANDOFF.md                 ← este archivo
├── middleware.ts                   ← i18n + Supabase session
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 3. Bugs conocidos / pendientes

### 3.1 Checkout dice "Esta página no existe" (BUG ACTIVO)

**Síntoma:** Click en "Comprar entrada" del landing → `/checkout` muestra 404 con branding LinkU.

**Causa raíz (parcialmente corregida hoy):**
1. El campo `cta_href` en `ticket_tiers` puede ser `/checkout` (sin `?tier=<slug>`). El admin form lo dejaba por default así si no se editaba.
2. Sin el query param, `/checkout` ejecuta `notFound()` → 404.

**Lo que se hizo hoy:**
- `lib/tickets.ts:resolveCtaHref` ahora **auto-append `?tier=<slug>`** si el `cta_href` empieza con `/checkout` y no tiene query.

**Lo que falta validar:**
- Después de reiniciar dev server, click en el tier desde la landing debe llevar a `/checkout?tier=early-access` (no a `/checkout` puro).
- Si el usuario llega y Wompi NO está configurado (env vars faltantes) → muestra mensaje "La pasarela de pago aún no está configurada".
- Si Wompi SÍ está configurado pero algo falla, captura `app/[locale]/checkout/error.tsx`.

**Cómo verificar:**
```powershell
npm run dev
# abrir http://localhost:3000/#tickets
# click en el tier
# debería ir a /checkout?tier=early-access
```

Si sigue 404, revisar `cta_href` del tier en `/admin/tiers` — debe ser `/checkout` (y el código le pegará el `?tier=` automáticamente) o `/checkout?tier=<slug>` explícito.

### 3.2 Wompi: NO funcional end-to-end

Las 4 env vars (`WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`) **NO están en `.env.local`**.

Hasta que se peguen:
- `/checkout?tier=...` muestra "La pasarela de pago aún no está configurada".
- El botón "Pagar con Wompi" no aparece.
- El webhook `/api/webhooks/wompi` existe pero no recibe nada.

**Para activar:**
1. Pegar las 4 llaves en `.env.local`.
2. Pegar `SUPABASE_SERVICE_ROLE_KEY` (el webhook lo necesita para escribir sin sesión).
3. Pegar `QR_HMAC_SECRET` (mín. 32 chars random).
4. Pegar `NEXT_PUBLIC_SITE_URL`.
5. Reiniciar `npm run dev`.
6. Probar flujo completo con tarjeta sandbox `4242 4242 4242 4242` / CVC `123` / fecha futura.

### 3.3 Cache de webpack en Next dev tras reorganizaciones grandes

A veces `npm run dev` muestra imports viejos después de mover archivos. Solución:
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

### 3.4 Procesos node huérfanos en :3000

Si después de Ctrl+C el puerto sigue ocupado:
```powershell
netstat -ano | findstr ":3000"
taskkill /PID <pid> /F
```

---

## 4. Detalles importantes por sistema

### 4.1 i18n

- Default locale: **`es`** (sin prefijo en URL — la home en español es `/`).
- Inglés: `/en`, `/en/login`, etc.
- Si alguien entra a `/es/...` → middleware hace **redirect 308** a `/...` (canonical SEO).
- El switcher en el navbar reescribe la URL real (no toggle client-side).
- Strings de UI viven en `content/es/ui.json` y `content/en/ui.json`.
- Datos del evento en los otros JSON dentro de `content/{es,en}/`.
- Tiers de **entrada** viven en DB (`ticket_tiers`), no en JSON.
- Tiers de **patrocinio** (Pre-Seed/Seed/Series A) siguen en JSON — pendiente migrar a DB si se requiere.

### 4.2 Admin

- Ruta: `/admin` (sin i18n, solo español).
- Sub-rutas marcadas "Pronto" en el sidebar: ventas, usuarios, citas, correos, portería, ajustes. **Ninguna implementada todavía**.
- Operativo: Dashboard (KPIs) + `/admin/tiers` (CRUD).
- Acceso restringido a `profiles.role = 'admin'`. El admin layout valida en SSR y redirige a `/` si no.
- Para promover un admin nuevo desde un admin existente: actualmente solo via SQL en Supabase Dashboard. UI de promoción está pendiente.

### 4.3 Sistema de pagos

**Flujo:**
1. User logueado va a `/checkout?tier=<slug>`.
2. Server crea fila en `orders` con `status='pending'`, `wompi_reference=LSUMMIT26-XXX-YYY` único, `total_cop=<precio del tier>`.
3. Calcula firma SHA256 de integridad (`reference + cents + COP + secret`).
4. Renderiza form HTML con los campos requeridos por Wompi Web Checkout.
5. Click "Pagar" → form POST a `https://checkout.wompi.co/p/`.
6. Wompi procesa → redirige a `redirect-url` (= `/checkout/success?ref=<reference>`).
7. En paralelo, Wompi llama al webhook `/api/webhooks/wompi`.
8. Webhook verifica firma con `WOMPI_EVENTS_SECRET`, busca orden por `wompi_reference`, marca `paid`, emite `tickets_issued` con QR firmado HMAC, dispara email con Resend.
9. La página `success` polla `/api/orders/status` cada 4s → cuando ve `paid` hace `router.refresh()` → muestra confirmación.

**El QR es la URL `/staff/scan?t=<ticketId.HMAC>`.** Cuando portería esté implementada, escanea, llama a `/api/staff/scan` que valida HMAC y marca `used_at`.

### 4.4 Email transaccional (Resend)

- Se usa la **API REST** (`https://api.resend.com/emails`), no el SDK.
- Templates en HTML inline (sin React Email) en `lib/email/templates.ts`.
- Bilingüe: `ticketConfirmedEmail({ locale, ... })` retorna `{ subject, html }`.
- El QR va embebido como `<img src="data:image/png;base64,...">` (data URL), no como adjunto.
- Sender: `LinkU Summit <noreply@linkusummit.com>`.

### 4.5 Seguridad QR

- Cada `tickets_issued` tiene `qr_code` (random base36 de 24 chars) y `id` (uuid).
- El **QR contiene el ID firmado con HMAC-SHA256**: `<ticketId>.<hmac_b64url>`.
- `QR_HMAC_SECRET` debe ser largo (32+ chars) y **inmutable** una vez en producción (cambiarlo invalida todos los QRs emitidos).
- Validación en portería: `verifyTicketToken(token)` → retorna ticketId si la firma es válida, null si no.
- Comparación HMAC con `timingSafeEqual` para evitar timing attacks.

---

## 5. Roadmap pendiente (en orden sugerido)

1. **Activar Wompi end-to-end** — pegar 4 env vars + service role + QR secret + site URL. Probar flujo completo en sandbox.
2. **Configurar webhook de Wompi en su dashboard** apuntando a `https://linkusummit.com/api/webhooks/wompi`.
3. **Portería QR**: `/staff/scan` PWA-like responsive con cámara, endpoint `/api/staff/scan` con validación HMAC y marca `used_at`. Sub-rol `gate_staff` en perfiles.
4. **Admin: ventas y usuarios** — listas filtrables, export CSV. La data ya está en DB.
5. **Agenda de citas 1:1** — el módulo más grande (~5 semanas). Schema nuevo: `meeting_slots`, `meeting_requests`, OAuth de Google Calendar y Microsoft Graph.
6. **Agente IA bilingüe** — widget en landing y `/me`. Claude Haiku 4.5 + prompt caching del KB. Cap USD $20/mes con rate limit y kill-switch.
7. **Correos masivos desde admin** — `/admin/emails` con plantillas, segmentación por rol/tier/estado, tracking de open/click.
8. **Tiers de patrocinio administrables** — migrar el JSON de `sponsorship` a tabla `sponsor_tiers` similar a `ticket_tiers`.

---

## 6. Decisiones tomadas (no obvio del código)

- **Compra abierta** (cualquiera puede comprar, no comité). Si esto cambia, hay que insertar un workflow `/request-invite` → admin aprueba → email con link único de pago.
- **Solo COP**, sin USD/EUR.
- **Bilingüe ES + EN** desde inicio, no agregar idiomas más adelante sin refactor.
- **PWA web responsive para portería**, no app nativa.
- **Web Checkout (redirect)** de Wompi para MVP, no Widget embedded. Migrable después.
- **Agente IA Haiku 4.5** con cap USD $20/mes, prompt caching del knowledge base.
- **Resend** como único proveedor de email (transaccionales + masivos + SMTP de Auth).
- **Solo web** por ahora, sin WhatsApp Business API.

---

## 7. Comandos útiles

```powershell
# Dev
npm run dev

# Type check sin compilar
npx tsc --noEmit

# Aplicar migraciones nuevas
node scripts/run-migrations.mjs

# Re-aplicar una migración específica (raro)
node scripts/run-migrations.mjs --force 0005_ticket_tiers.sql

# Listar funciones de Supabase
npx supabase functions list --project-ref $env:SUPABASE_PROJECT_REF

# Build de producción
npm run build

# Lint
npm run lint
```

---

## 8. Soporte y contacto

- Repo: `https://github.com/linkuinversiones-png/linku_summit`
- Email principal del proyecto: `linkuinversiones@gmail.com` (es el admin promovido)
- Dominio: `linkusummit.com`
- Contactos del evento:
  - `invites@linkusummit.com`
  - `sponsors@linkusummit.com`
  - `partners@linkusummit.com`

---

**Fin del documento. Si continúas en otra sesión: lee este archivo primero y prosigue con el roadmap en §5.**
