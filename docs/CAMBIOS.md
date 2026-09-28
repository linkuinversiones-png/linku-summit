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

## 2026-09-28 — Arreglo: fotos deformadas en el pop-up de speakers

**Quién:** Miguel Salazar (con Claude) · **Tipo:** arreglo
**Qué cambió:** en escritorio, la columna de la foto del pop-up de speakers
(`SpeakerModal.tsx`) se estiraba a todo el alto del modal (`sm:h-auto`
dentro de un contenedor que crecía con el largo de la bio). Como casi todas
las fotos originales son cuadradas (1000×1000), con bios largas la columna
llegaba a medir ~256×700 px y `object-cover` las ampliaba cerca de 3
veces para cubrir ese alto, recortando los lados: caras gigantes y
borrosas (caso detectado: Hector Shibata). En celular no pasaba porque la
foto usaba `aspect-square` fijo. Ahora la foto tiene proporción fija 4:5
(mismo ancho de 256 px en escritorio) y ya no se estira con el largo de la
bio; en escritorio queda fija (`sticky`) arriba de la columna mientras el
texto de la derecha hace scroll, y el fondo de la columna (`bg-linku-bg-3`)
llena el resto del alto debajo de la foto. Se agregó `object-top` a
`object-cover` para priorizar la cabeza en fotos verticales u horizontales
que no sean cuadradas. En celular la foto ya no ocupa el ancho completo de
pantalla: se redujo a un recuadro 4:5 de 176 px centrado arriba de la
tarjeta, para que no empuje tanto el nombre hacia abajo. También se ajustó
el `sizes` del `<Image>` al tamaño real mostrado (176 px en celular, 256 px
en escritorio) para que no se vea pixelada en pantallas retina.
**Archivos:**
- `components/ui/SpeakerModal.tsx` — columna de la foto reestructurada:
  contenedor exterior con `sm:self-stretch` y fondo `bg-linku-bg-3` que
  ocupa todo el alto de la fila, y adentro un recuadro `aspect-[4/5]`
  (`sticky top-0` en escritorio) con el `<Image fill>`; `className` del
  `<Image>` cambiado de `object-cover` a `object-cover object-top`; `sizes`
  actualizado a `(max-width: 640px) 176px, 256px`.
**Cómo verificar:** en la portada, sección Speakers, abrir el pop-up de
"Hector Shibata" (bio larga, foto cuadrada) y confirmar que la cara se ve
completa y sin zoom exagerado, con el fondo de la columna llenando el
espacio debajo de la foto; abrir "Salvador Said" (foto vertical 1508×2048)
y "David Lopez" (foto horizontal 1656×1104) y confirmar que también se ven
bien encuadradas; repetir en ancho de celular (~375 px) y confirmar que la
foto ya no ocupa toda la pantalla antes del nombre. `npx tsc --noEmit` sin
errores.
**Notas / pendientes:** algunas fotos originales son de baja calidad para
su tamaño — por ejemplo la de Hector Shibata es 1000×1000 px pero solo pesa
~66 KB, lo que sugiere que fue ampliada desde un original más chico (se ve
algo suave incluso ya sin el recorte exagerado). Conviene reemplazarla (y
revisar otras fotos con el mismo síntoma) desde `/admin/speakers` con un
original de buena resolución.

---

## 2026-09-28 — Pop-up con la bio del speaker al hacer clic en su tarjeta

**Quién:** Miguel Salazar (con Claude) · **Tipo:** funcionalidad
**Qué cambió:** en la sección Speakers de la portada, hacer clic en cualquier
parte de la tarjeta de un speaker confirmado abre un pop-up con su foto (sin
el filtro duotono), nombre, cargo · empresa, track y la descripción (bio),
que antes no se mostraba en ningún lado del sitio. Si hay LinkedIn, el
pop-up trae un botón "Ver en LinkedIn" que abre en pestaña nueva. El ícono
de LinkedIn de la tarjeta sigue abriendo LinkedIn directamente y ya no
dispara el pop-up (se detiene la propagación del clic y de la tecla Enter).
Los speakers confirmados sin bio abren el mismo pop-up sin el bloque de
descripción (no se muestra ningún mensaje de "sin descripción"). Los
speakers "Por confirmar" no son clicables. La tarjeta es accesible por
teclado (foco visible, Enter/Espacio abren el pop-up) y el pop-up se cierra
con el botón X, la tecla Escape o clic en el fondo oscuro, bloquea el
scroll de la página mientras está abierto y devuelve el foco a la tarjeta
al cerrarse. Solo hay un pop-up para toda la sección (no uno por tarjeta).
**Archivos:**
- `components/ui/SpeakerCard.tsx` — tarjeta ahora es un `role="button"`
  enfocable con teclado (sin anidar un `<a>` dentro de un `<button>` real);
  acepta `onOpen` y expone su nodo por `ref` para devolver el foco al cerrar
  el pop-up.
- `components/ui/SpeakerModal.tsx` (nuevo) — el pop-up en sí: foto, nombre,
  cargo · empresa, track, bio (`whitespace-pre-line`) y botón de LinkedIn;
  animado con framer-motion respetando `prefers-reduced-motion`, responsive
  (pantalla casi completa en celular, ancho máximo en escritorio, scroll
  interno si la bio es larga).
- `components/sections/SpeakersGrid.tsx` (nuevo) — componente cliente que
  arma la grilla de tarjetas y guarda el estado de qué speaker está abierto
  en el pop-up (un solo pop-up para toda la sección), para no convertir en
  cliente toda la sección `Speakers.tsx`.
- `components/sections/Speakers.tsx` — ahora usa `SpeakersGrid` en vez de
  mapear las tarjetas directamente.
- `content/es/ui.json`, `content/en/ui.json` — nuevos textos
  `speakers.modal.close` y `speakers.modal.viewLinkedin` ("Cerrar" / "Ver en
  LinkedIn" y sus equivalentes en inglés).
**Cómo verificar:** en la portada, ir a la sección Speakers y hacer clic en
cualquier parte de una tarjeta de speaker confirmado (no en el ícono de
LinkedIn) → se abre el pop-up con su información; clic en el ícono de
LinkedIn → abre LinkedIn en pestaña nueva sin abrir el pop-up; con el
pop-up abierto, probar el botón X, Escape y clic fuera de la tarjeta para
cerrarlo, y confirmar que el foco vuelve a la tarjeta. `npx tsc --noEmit`
sin errores.
**Notas / pendientes:** de los 33 speakers activos, solo 11 tienen
descripción cargada; se completan desde `/admin/speakers` (campo bio en
español e inglés).

---

## 2026-09-26 — Categorías internas Staff, Speaker y Prensa (Registros internos)

**Quién:** Miguel Salazar (con Claude) · **Tipo:** funcionalidad
**Qué cambió:** se agregaron tres categorías de entrada de uso interno,
**Staff**, **Speaker** y **Prensa**. Viven en `ticket_tiers` como cualquier
otro tier y se editan en `/admin/tiers` (con una casilla nueva "Solo admin"),
pero aunque estén activas nunca aparecen en la portada, en el JSON-LD de SEO
ni se pueden comprar por `/checkout?tier=staff`. Solo un admin las asigna,
desde una pantalla nueva `/admin/registros` llamada **"Registros internos"**
en el menú (genérica: sirve para staff, speakers, prensa… y cualquier otra
categoría interna que se cree después): un formulario con nombre, correo,
celular, tipo y número de documento, empresa, cargo, LinkedIn y una nota
interna. Al registrar, se procesa exactamente igual que cualquier otra venta
pagada: nace como orden `paid` con método `cortesia`, queda en la bitácora de
cambios de estado, se emite la boleta con QR y se envía a la API de
InContacto con `tipoBoleta` = "Staff", "Speaker" o "Prensa". Si InContacto
falla, el registro igual queda creado y se puede reintentar desde el detalle
de la venta (`/admin/orders/<id>`, botón que ya existía). Debajo del
formulario hay una lista de los últimos registros internos con su estado en
InContacto.
**Archivos:**
- `supabase/migrations/0018_tiers_internos.sql` (nuevo) — columna
  `admin_only` en `ticket_tiers`, ajuste del check de `price_cop` para
  permitir 0 solo en tiers internos, y el seed de `staff` / `speaker` /
  `prensa`.
- `lib/tickets.ts` — `admin_only` en `TierRow`; `getActiveTiers` excluye
  `admin_only = true` filtrando en JS (no en la query) para no depender de
  que la columna ya exista; `getAdminOnlyTiers()` nuevo.
- `app/admin/tiers/TierForm.tsx`, `app/admin/tiers/actions.ts`,
  `app/admin/tiers/page.tsx` — casilla "Solo admin", validación de precio 0
  solo para tiers internos, etiqueta visible en el listado, textos genéricos
  ("categorías internas: staff, speakers, prensa…").
- `app/admin/registros/page.tsx`, `app/admin/registros/RegistroForm.tsx`,
  `app/admin/registros/actions.ts` (nuevos) — la pantalla "Registros
  internos" y su server action `registerInternal`.
- `components/admin/AdminShell.tsx` — enlace "Registros internos" en el
  menú (antes "Staff y speakers").
**Cómo verificar:** aplicar la migración 0018, activar Staff/Speaker/Prensa
en `/admin/tiers` (deben mostrar la etiqueta "Solo admin" y no aparecer en la
portada ni en `/checkout?tier=staff`), registrar a alguien desde
`/admin/registros` ("Registros internos" en el menú) y confirmar en
`/admin/orders` que la venta quedó pagada, con boleta y estado de InContacto.
**Notas / pendientes:**
- Desde el cambio de infraestructura de este mismo día ("Migraciones de
  Supabase automáticas en el deploy"), la migración 0018 ya no hay que
  correrla a mano: el workflow de GitHub Actions la aplica sola al publicar
  a `main`. El código de todas formas sigue siendo seguro si por algún
  motivo la migración no se ha aplicado todavía: `getActiveTiers()` filtra
  `admin_only` en JavaScript (no con `.eq('admin_only', false)` en la
  consulta a Supabase), así que si la columna todavía no existe,
  `row.admin_only` es simplemente `undefined` y el filtro deja pasar todos
  los tiers — la portada y el checkout público siguen funcionando
  exactamente igual que hoy. Lo que SÍ requiere la migración aplicada: los
  tiers Staff/Speaker/Prensa (no existen sin el seed) y la pantalla
  `/admin/registros` (su formulario sale vacío y no hay nada que registrar
  hasta que la columna y las filas existan).
- Al publicar, avisar al equipo de InContacto que los valores exactos que
  llegan en el campo "Tipo de boleta" para estos registros son `Staff`,
  `Speaker` y `Prensa` (el `name_es` del tier tal cual, igual que con los
  demás tiers), y que si un admin renombra la categoría desde
  `/admin/tiers`, el valor que se envía cambia con ella.
- Los registros internos aparecen en `/admin/orders` como una venta más,
  método "Cortesía" y total $0; no se distinguen ahí de una cortesía
  cualquiera salvo por el nombre del tier y la nota de la bitácora
  ("Registro interno desde admin: …").
- No se tocó `/admin/settings` (selector de tiers con acceso a la agenda de
  citas 1:1): un admin podría, en teoría, marcar Staff/Speaker ahí. Se dejó
  así a propósito por ser un caso de uso legítimo (dar acceso a citas a
  ciertos speakers) y porque no afecta nada público.

---

## 2026-09-26 — Migraciones de Supabase automáticas en el deploy

**Quién:** Miguel Salazar (con Claude) · **Tipo:** infraestructura
**Qué cambió:** el workflow `.github/workflows/deploy.yml` ahora aplica las
migraciones pendientes de `supabase/migrations/` automáticamente, en un paso
propio antes de compilar, en vez de solo avisar que había migraciones nuevas.
Si una migración falla, el job se detiene ahí y no llega a compilar ni
publicar (producción no cambia). `scripts/run-migrations.mjs` ahora lee
`SUPABASE_PROJECT_REF`/`SUPABASE_ACCESS_TOKEN` primero del entorno (para CI) y
de `.env.local` como respaldo local; se hizo más robusto para correr sin
supervisión: una lectura de tracking que falla o no se puede parsear ahora
termina en error (antes se trataba como "tabla vacía", lo que podía disparar
el modo bootstrap y marcar migraciones como aplicadas sin correrlas); y el
modo bootstrap (tracking vacío → registrar todo sin re-ejecutar) queda
desactivado en CI a propósito, porque en el workflow automático un tracking
vacío es señal de error, no de un proyecto nuevo. Tras revisión se agregaron
dos resguardos más: (1) `runSql` ahora también trata como fallo una respuesta
con HTTP 2xx pero cuerpo de error (`{ error: ... }` / `{ message: ... }` en
vez del arreglo de filas que la Management API devuelve en éxito), así que
esas migraciones tampoco se marcan aplicadas; (2) si una migración corre bien
pero el `insert` de tracking falla, ya no es solo un `console.warn` — el
script termina con `exit 1`, imprime el SQL exacto para registrarla a mano, y
lo anota en `GITHUB_STEP_SUMMARY`, porque dejarla sin registrar haría que la
próxima corrida intente re-aplicarla. El script sigue existiendo para uso
manual (plan B).
**Archivos:**
- `scripts/run-migrations.mjs`
- `.github/workflows/deploy.yml`
- `docs/DEPLOY.md`
- `CLAUDE.md`

**Cómo verificar:** `node --check scripts/run-migrations.mjs`; validar el YAML
del workflow; tras el próximo push a `main`, revisar en Actions que el paso
"Aplicar migraciones de Supabase" corra antes de "Compilar" y que su resumen
liste qué migraciones aplicó (o "Sin migraciones nuevas").
**Notas / pendientes:** **este cambio solo puede fusionarse a `main` después**
de crear en GitHub (Settings → Secrets and variables → Actions) el secret
`SUPABASE_ACCESS_TOKEN` y la variable `SUPABASE_PROJECT_REF`. Si se fusiona
antes de configurarlos, **todas las publicaciones automáticas fallarán** en el
paso de migraciones (sin afectar el sitio en vivo, porque el build y el
deploy no llegan a correr) hasta que se configuren.

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
