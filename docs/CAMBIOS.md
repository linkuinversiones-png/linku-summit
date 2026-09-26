# Registro de cambios

Cada cambio al proyecto se anota aquí, **el más reciente arriba**.
Formato de cada entrada:

```
## AAAA-MM-DD — Título corto
**Quién:** nombre · **Tipo:** contenido | diseño | funcionalidad | arreglo | seguridad | docs | infraestructura
**Qué cambió:** en lenguaje simple, qué ve o nota la gente.
**Archivos:** lista de archivos tocados.
**Cómo verificar:** pasos para comprobarlo.
**Notas / pendientes:** (opcional) riesgos, qué falta, si requiere migración o deploy.
```

---

## 2026-09-26 — Categorías internas Staff y Speaker

**Quién:** Miguel Salazar (con Claude) · **Tipo:** funcionalidad
**Qué cambió:** se agregaron dos categorías de entrada de uso interno,
**Staff** y **Speaker**. Viven en `ticket_tiers` como cualquier otro tier y se
editan en `/admin/tiers` (con una casilla nueva "Solo admin"), pero aunque
estén activas nunca aparecen en la portada, en el JSON-LD de SEO ni se pueden
comprar por `/checkout?tier=staff`. Solo un admin las asigna, desde una
pantalla nueva `/admin/registros` ("Staff y speakers"): un formulario con
nombre, correo, celular, tipo y número de documento, empresa, cargo, LinkedIn
y una nota interna. Al registrar, se procesa exactamente igual que cualquier
otra venta pagada: nace como orden `paid` con método `cortesia`, queda en la
bitácora de cambios de estado, se emite la boleta con QR y se envía a la API
de InContacto con `tipoBoleta` = "Staff" o "Speaker". Si InContacto falla, el
registro igual queda creado y se puede reintentar desde el detalle de la
venta (`/admin/orders/<id>`, botón que ya existía). Debajo del formulario hay
una lista de los últimos registros internos con su estado en InContacto.
**Archivos:**
- `supabase/migrations/0018_tiers_internos.sql` (nuevo) — columna
  `admin_only` en `ticket_tiers`, ajuste del check de `price_cop` para
  permitir 0 solo en tiers internos, y el seed de `staff` / `speaker`.
- `lib/tickets.ts` — `admin_only` en `TierRow`; `getActiveTiers` excluye
  `admin_only = true` filtrando en JS (no en la query) para no depender de
  que la columna ya exista; `getAdminOnlyTiers()` nuevo.
- `app/admin/tiers/TierForm.tsx`, `app/admin/tiers/actions.ts`,
  `app/admin/tiers/page.tsx` — casilla "Solo admin", validación de precio 0
  solo para tiers internos, etiqueta visible en el listado.
- `app/admin/registros/page.tsx`, `app/admin/registros/RegistroForm.tsx`,
  `app/admin/registros/actions.ts` (nuevos) — la pantalla de registro y su
  server action `registerInternal`.
- `components/admin/AdminShell.tsx` — enlace "Staff y speakers" en el menú.
**Cómo verificar:** aplicar la migración 0018, activar Staff/Speaker en
`/admin/tiers` (deben mostrar la etiqueta "Solo admin" y no aparecer en la
portada ni en `/checkout?tier=staff`), registrar a alguien desde
`/admin/registros` y confirmar en `/admin/orders` que la venta quedó pagada,
con boleta y estado de InContacto.
**Notas / pendientes:**
- El código ya es seguro si se publica **antes** de aplicar la migración
  0018: `getActiveTiers()` filtra `admin_only` en JavaScript (no con
  `.eq('admin_only', false)` en la consulta a Supabase), así que si la
  columna todavía no existe, `row.admin_only` es simplemente `undefined` y
  el filtro deja pasar todos los tiers — la portada y el checkout público
  siguen funcionando exactamente igual que hoy. Lo que SÍ requiere la
  migración aplicada: los tiers Staff/Speaker (no existen sin el seed) y la
  pantalla `/admin/registros` (su formulario sale vacío y no hay nada que
  registrar hasta que la columna y las filas existan). Aun así, se
  recomienda aplicar `0018_tiers_internos.sql` en Supabase **antes** de
  mezclar esta rama a `main`, para que Staff/Speaker queden disponibles
  desde el primer despliegue (es manual, como el resto).
- Falta confirmar con el equipo de InContacto que su formulario acepta
  "Staff" y "Speaker" como valor del campo Tipo de boleta (el envío usa el
  `name_es` del tier tal cual, igual que con los demás tiers).
- Los registros internos aparecen en `/admin/orders` como una venta más,
  método "Cortesía" y total $0; no se distinguen ahí de una cortesía
  cualquiera salvo por el nombre del tier y la nota de la bitácora
  ("Registro interno desde admin: …").
- No se tocó `/admin/settings` (selector de tiers con acceso a la agenda de
  citas 1:1): un admin podría, en teoría, marcar Staff/Speaker ahí. Se dejó
  así a propósito por ser un caso de uso legítimo (dar acceso a citas a
  ciertos speakers) y porque no afecta nada público.

---

## 2026-09-26 — Publicación automática con GitHub Actions

**Quién:** Miguel Salazar (con Claude, desde el computador de Daniel) · **Tipo:** infraestructura
**Qué cambió:** desde ahora, todo lo que llega a la rama `main` en GitHub se
publica solo en www.linkusummit.com en 3–5 minutos; ya no hay que publicar a
mano desde el computador de Daniel. Las migraciones de base de datos siguen
siendo manuales y van antes. Se creó un token de Cloudflare exclusivo para
GitHub.
**Archivos:**
- `.github/workflows/deploy.yml` (nuevo)
- `docs/DEPLOY.md` (actualizado)

Llegó por el PR #1 (`infra/deploy-automatico`, commit 5fb8aee).
**Cómo verificar:** GitHub → pestaña Actions → "Publicar en Cloudflare" debe
estar en verde; en la ejecución del 2026-09-26 (manual, run 36258408941) la
portada respondió 200 con el BUILD_ID nuevo.
**Notas / pendientes:** la primera ejecución automática (run 36258233168)
falló en el paso "Publicar en Cloudflare" y la segunda, lanzada a mano, salió
bien; producción no se afectó porque wrangler solo activa versiones
completas. Aviso de GitHub: las acciones `checkout@v4` y `setup-node@v4` usan
Node 20 (obsoleto); conviene actualizarlas a versiones nuevas más adelante.
Pendiente: no publicar a mano con wrangler salvo emergencia (ver Plan B en
`DEPLOY.md`).

## 2026-09-26 — Análisis del código y registro de cambios

**Quién:** Miguel Salazar (con Claude) · **Tipo:** docs
**Qué cambió:** se agregó un análisis completo del estado del código con
hallazgos priorizados, este registro de cambios y un `CLAUDE.md` con la regla
de documentar cada cambio. No se tocó código de la aplicación.
**Archivos:**
- `docs/ANALISIS-2026-09-26.md` (nuevo)
- `docs/CAMBIOS.md` (nuevo)
- `CLAUDE.md` (nuevo)

**Cómo verificar:** abrir los archivos en `docs/`.
**Notas / pendientes:** ver §6 del análisis (rotar llaves, `npm audit fix`,
arreglos de `ilike` y boletas duplicadas).
