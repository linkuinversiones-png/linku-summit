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

## 2026-10-02 — Arreglo: un rechazo tardío de Wompi ya no revierte una orden pagada

**Quién:** Miguel Salazar (con Claude) · **Tipo:** arreglo
**Qué cambió:** caso real: la orden `LSUMMIT26-MUQZXWSM-Y9WGAJ` recibió de Wompi
casi a la vez dos eventos para la misma referencia (el checkout permite varios
intentos): primero APPROVED (transacción `1439192-1790947741-15521`), que la
pasó a pagada, emitió la boleta y la envió a InContacto; segundos después un
DECLINED de otro intento, que la devolvió a "fallida". Causa: el webhook solo
protegía el caso pagada + APPROVED, pero no impedía que otro evento degradara
una orden ya pagada. Dos arreglos:
1. **Webhook:** si la orden ya está pagada y llega cualquier evento que no sea
   APPROVED, no se toca (ni estado ni id de transacción); se responde 200 con
   `ignored: order already paid`, se deja un `console.warn` y una entrada
   informativa en la bitácora ("Pagada → Pagada", motivo "Evento de Wompi
   ignorado"). Una orden reembolsada tampoco la modifica ningún evento. Una
   orden fallida sí sigue pudiendo pasar a pagada con un APPROVED.
   Los UPDATE del webhook son atómicos: se condicionan en la base a que la orden
   siga en pendiente/fallida/expirada, así que dos eventos simultáneos no se
   pisan ni entregan dos veces; si el UPDATE falla responde 500 para que Wompi
   reintente.
2. **Admin:** al marcar como pagada con motivo "Corrección de un error", si la
   orden ya tenía método de pago (p. ej. `wompi`) se conserva; solo se usa
   `otro` si estaba vacío. Los demás motivos no cambian.
3. **Entrega:** `fulfillPaidOrder` ya no vuelve a enviar a InContacto si la
   boleta existía y la orden ya estaba en `incontacto_status = 'sent'` (el
   reintento manual sigue enviando siempre).
**Archivos:** `app/api/webhooks/wompi/route.ts`, `app/admin/orders/actions.ts`,
`lib/orders/fulfill.ts`, `lib/orders/status-log.ts`, `docs/CAMBIOS.md`.
**Cómo verificar:** reenviar un evento DECLINED de la misma referencia de una
orden pagada (Wompi Dashboard → eventos) y comprobar que sigue pagada y que la
bitácora muestra la entrada de evento ignorado.
**Notas / pendientes:** paso manual tras publicar: en `/admin/orders` → venta
`LSUMMIT26-MUQZXWSM-Y9WGAJ` → "Marcar como pagada" con motivo "Corrección de un
error" y una nota explicando el evento DECLINED posterior. La orden quedó con el `payment_provider_id` de la transacción
DECLINED; la nota de la corrección debe decir que la transacción aprobada es
`1439192-1790947741-15521`. Patricia ya tiene
boleta activa y está enviada a InContacto. Al re-marcar como pagada no se
duplican boleta, cupo, cupón ni registro en InContacto.

---

## 2026-10-01 — Diseño: empresas de la agenda solo con logo

**Quién:** Miguel Salazar (con Claude) · **Tipo:** diseño
**Qué cambió:** las empresas vinculadas a un espacio de la agenda ahora se ven
solo como logo (blanco, sin recuadro ni nombre visible). El nombre queda como
texto alternativo y tooltip; el logo sigue abriendo la web en otra pestaña. Si
una empresa no tiene logo se muestra su nombre como texto discreto.
**Archivos:** `components/sections/Agenda.tsx`, `docs/CAMBIOS.md`.
**Cómo verificar:** abrir la agenda en una charla con empresas vinculadas; ver
solo logos, pasar el mouse para ver el nombre.

## 2026-10-01 — Funcionalidad: empresas vinculadas a la agenda

**Quién:** Miguel Salazar (con Claude) · **Tipo:** funcionalidad
**Qué cambió:** cualquier espacio de la agenda (y cualquier charla de un salón)
puede tener **empresas vinculadas**, por ejemplo "Elevator Pitches — proyectos
por clase de activo". En la portada aparecen como una fila de logos pequeños
con el nombre, debajo del título/speakers; si la empresa tiene web, el logo
abre su sitio en otra pestaña; sin logo se ve solo el nombre. Las empresas
salen del catálogo de Sponsors. Para empresas que no son sponsors hay una
categoría nueva, **"Empresa invitada (solo agenda)"** (`empresa-agenda`), que
**nunca** aparece en el muro público de sponsors.
**Cómo usarlo:** (1) Admin → Sponsors → "Nuevo sponsor" con categoría "Empresa
invitada (solo agenda)" (o usa el link "Crear empresa nueva" desde la agenda,
que ya la preselecciona). (2) Admin → Agenda → abre el bloque o la charla →
sección "Empresas vinculadas": añade, quita y reordena con las flechas →
Guardar.
**Migración 0023** (`agenda_empresas`): crea `agenda_item_companies` y
`agenda_salon_item_companies` (idempotente, no destructiva; RLS igual que las
de speakers: lectura pública, gestión admin). `sponsors.category` no tiene
CHECK, así que no se toca.
**Compatibilidad:** las empresas se leen en consultas aparte del select
principal. Si el código sale antes que la migración, la portada sigue normal
(sin empresas, sin caer al JSON) y el editor muestra la sección deshabilitada
con un aviso.
**Archivos:** `supabase/migrations/0023_agenda_empresas.sql`,
`lib/sponsors-constants.ts`, `lib/sponsors.ts`, `lib/agenda.ts`,
`components/sections/Agenda.tsx`, `app/admin/agenda/{page,AgendaEditor,ItemEditor,SalonEditor,actions,tree,ui}`,
`app/admin/sponsors/new/page.tsx`, `app/admin/sponsors/SponsorForm.tsx`.
**Cómo verificar:** tras aplicar la migración, vincula una empresa a un bloque
y revisa `/` y `/en`; confirma que una empresa de categoría "solo agenda" no
sale en el muro de sponsors.
**Ajustes:** los logos de empresas en la agenda usan el mismo filtro blanco que el muro de sponsors; el formulario de sponsors avisa (ayuda bajo la categoría y texto de "Activo") cuando la categoría es "solo agenda".
**Notas / pendientes:** requiere que se aplique la migración 0023 al publicar.
Los textos de la portada no cambian (los nombres de empresa no se traducen).

---

## 2026-09-30 — Funcionalidad: credenciales de la plataforma de citas en el perfil

**Quién:** Miguel Salazar (con Claude) · **Tipo:** funcionalidad
**Qué cambió:** en la tarjeta de citas 1:1 de `/me` (solo para asistentes con
cita habilitada y con la agenda abierta) aparece el recuadro "Tus datos de
acceso": usuario (el correo con el que inició sesión) y clave compartida
(oculta, con botones Mostrar y Copiar), más una línea de ayuda. La clave se
configura en Admin → Ajustes → Citas ("Clave de acceso a la plataforma de
citas"); vacía = no se muestra el recuadro. **La clave no está en el código,
ni en GitHub, ni en migraciones**: el admin la escribe después de publicar.
**Seguridad:** `site_settings` tenía lectura pública, así que la clave vive en
una fila `private_meetings_access`. La migración 0022 cambia la política de
lectura: las filas con clave `private_*` solo las leen admins. En `/me` se lee
en el servidor con la service key y solo si el usuario puede agendar y la
agenda está abierta; si falla o no hay clave, no se muestra nada y la página
no se rompe. Sin esas condiciones la clave nunca llega al navegador.
**Archivos:** `supabase/migrations/0022_ajustes_privados.sql`, `lib/settings.ts`,
`app/[locale]/me/page.tsx`, `app/[locale]/me/MeetingsCredentials.tsx`,
`app/admin/settings/{page.tsx,actions.ts,SettingsForm.tsx}`,
`content/es/ui.json`, `content/en/ui.json`.
**Cómo verificar:** tras publicar, escribir la clave en Admin → Ajustes y
abrir `/me` con un usuario Smart Access y la agenda activa; probar Mostrar y
Copiar. Con una cuenta sin cita habilitada no aparece nada.
**Notas / pendientes:** el admin debe escribir la clave tras publicar. La
migración es idempotente y no destructiva (la aplica el workflow). Sin la
migración, el admin guarda igual, pero la fila seguiría legible públicamente
hasta que se aplique.

---

## 2026-09-30 — Funcionalidad: actividad paralela de todo el día en la agenda

**Quién:** Miguel Salazar (con Claude) · **Tipo:** funcionalidad
**Qué cambió:** cada día de la agenda puede tener una actividad opcional que
corre en paralelo todo el día (ej. la rueda de negocios). En la portada se
muestra como un recuadro destacado (borde y fondo coral suave, ícono de
apretón de manos) arriba de los bloques de ese día, con la etiqueta "En
paralelo todo el día" / "Running all day in parallel", el título, el horario
y la descripción si existen. Si el día no la tiene, nada cambia. En inglés,
los campos vacíos caen al texto en español.
**Cómo usarlo:** Admin → Agenda → elegir el día → "Editar día" → sección
"Actividad en paralelo todo el día (opcional)" (título, horario y
descripción en ES y EN). Vacío = no se muestra.
**Archivos:** `supabase/migrations/0021_agenda_actividad_paralela.sql`
(6 columnas `parallel_*` en `agenda_days`), `lib/agenda.ts`,
`components/sections/Agenda.tsx`, `app/admin/agenda/actions.ts`,
`app/admin/agenda/AgendaEditor.tsx`, `content/es/ui.json`,
`content/en/ui.json`.
**Cómo verificar:** aplicada la migración, llenar la actividad en un día
desde el admin y abrir `/` y `/en` en la sección Agenda; cambiar de día.
**Notas / pendientes:** la migración es idempotente y no destructiva (la
aplica el workflow al publicar). Compatibilidad: sin la migración la portada
funciona igual (sin recuadro) y el admin oculta la sección y no envía esos
campos, así que editar días sigue funcionando.

---

## 2026-09-29 — Funcionalidad: panel "Por resolver" (pagos rechazados/pendientes) en Ventas

**Quién:** Miguel Salazar (con Claude) · **Tipo:** funcionalidad
**Qué cambió:** arriba de `/admin/orders` hay un panel "Por resolver" con los
compradores cuyos pagos fueron rechazados o quedaron pendientes, para que el
equipo los contacte. Un caso agrupa por comprador (documento sin puntos ni
espacios; si no hay, el correo) todas sus órdenes `failed` y las `pending`
con más de 30 minutos. Se ocultan solos si el comprador tiene una orden
`paid` (por documento o correo) creada después de su último intento, si es
tier interno (`admin_only`) o método `cortesia`. Cada tarjeta muestra
nombre, empresa, correo (mailto), teléfono con botón WhatsApp (celular
colombiano de 10 dígitos que empieza por 3 se antepone 57; con indicativo se
respeta; si no es claro solo se ve el teléfono), tier y monto del último
intento (con cupón), número de intentos, fechas del primero y el último,
estado (Rechazado/Pendiente), último motivo reportado por Wompi (de
`order_status_log`) y links a las órdenes. Botón "Marcar como resuelto" con
motivo obligatorio (pagó por otro medio, cortesía, desistió, contactado en
espera, otro; la nota es obligatoria con "otro"). Un caso resuelto reaparece
si hay un intento fallido/pendiente posterior al cierre. Se muestran 6 casos
y el resto bajo "Ver todos"; hay sección plegable "Resueltos recientemente"
(últimos 10). Sin casos, solo una línea corta en verde. Si la tabla nueva aún
no existe, la página sigue funcionando (sin resoluciones) y el botón avisa
del error.
**Archivos:** `supabase/migrations/0020_seguimiento_pagos.sql` (tabla
`payment_followups`, RLS solo admins select/insert),
`lib/admin/followups.ts` (lógica pura), `lib/admin/followups-data.ts`
(lectura con sesión del admin), `app/admin/orders/FollowupsPanel.tsx`,
`app/admin/orders/ResolveFollowupForm.tsx`, `app/admin/orders/actions.ts`
(`resolveFollowup`), `app/admin/orders/page.tsx` (monta el panel).
**Cómo verificar:** abrir `/admin/orders`: aparece el panel; un comprador con
pago posterior no debe aparecer; al marcar un caso como resuelto desaparece
y queda en "Resueltos recientemente".
**Notas / pendientes:** requiere la migración 0020 (idempotente, no
destructiva; la aplica el workflow al publicar). Solo se miran los últimos 60
días y hasta 1000 órdenes por consulta. No se filtran compradores de prueba:
no hay una convención en el código. El `mailto:` solo se enlaza si el correo
tiene forma válida (sin `?`, `&`, espacios) y la consulta del log de Wompi se
hace en lotes de 50 órdenes.

---

## 2026-09-29 — Arreglo: Registros internos fallaban con precio 0

**Quién:** Miguel Salazar (con Claude) · **Tipo:** arreglo
**Qué cambió:** al registrar a alguien en `/admin/registros` (Staff, Speaker,
Prensa, categorías internas con precio 0) Supabase respondía "new row for
relation orders violates check constraint orders_subtotal_cop_check". La
tabla `orders` exigía `subtotal_cop > 0` desde la migración 0003, y la 0018
solo había relajado esa regla en `ticket_tiers.price_cop`, no en `orders`.
La nueva migración 0019 reemplaza ese check por: `subtotal_cop > 0` o
(`subtotal_cop = 0` y `payment_method = 'cortesia'`). Cualquier otra orden
sigue necesitando subtotal mayor que 0. `total_cop` y `discount_cop` ya
permitían 0. Se revisó el resto del flujo (bitácora, boleta, cupo del tier,
cupones) y no hay otra restricción que falle con precio 0. Los intentos
fallidos no dejaron datos a medias: el INSERT de la orden falló completo,
así que no se creó orden, boleta ni registro en la bitácora.
**Archivos:** `supabase/migrations/0019_orders_subtotal_cortesia.sql`.
**Cómo verificar:** tras publicar, en `/admin/registros` registrar a una
persona como Staff: debe quedar la boleta emitida y la orden en
`/admin/orders` con total $0 y método cortesía.
**Notas / pendientes:** la migración 0019 la aplica GitHub Actions
automáticamente al publicar (antes de compilar); es idempotente y no
destructiva.

---

## 2026-09-28 — Diseño: pop-up de speakers con encabezado (foto + nombre) y descripción a todo el ancho

**Quién:** Miguel Salazar (con Claude) · **Tipo:** diseño
**Qué cambió:** en `SpeakerModal.tsx`, el diseño de dos columnas (foto fija
de 256 px a la izquierda, texto a la derecha) dejaba un hueco vacío grande
debajo de la foto cuando la bio era corta o mediana, porque la columna de
la foto ocupaba todo el alto de la fila mientras el texto era más corto que
la foto. Se rediseñó a un único bloque de contenido: arriba un encabezado
en fila con la foto (proporción 4:5, 96 px en celular / 160 px en
escritorio, `object-cover object-top`, iniciales si no hay foto) a la
izquierda y a la derecha el nombre, cargo · empresa, la pill del track y el
botón "Ver en LinkedIn"; debajo, un separador sutil (`border-linku-border`)
y la descripción a todo el ancho del modal (el separador y la descripción
solo aparecen si el speaker tiene bio). Así el alto del encabezado lo
define el contenido real (foto o texto, lo que sea más alto) y la bio ya
no compite por espacio con la foto, sin importar si es corta o larga. Se
quitó el `sticky` de la foto (ya no hace falta con una sola columna) y
todo el modal sigue con scroll interno (`max-h-[85vh]` en escritorio). El
botón de cerrar (X) ahora tiene más padding a la derecha (`pr-14`/`pr-16`)
para no tapar el nombre. En celular el patrón es el mismo (foto más chica
junto al nombre) porque a 375 px con foto de 96 px y `min-w-0` en el bloque
de texto el nombre y el cargo hacen wrap sin verse apretados. Ajuste
posterior: la pill del track y el botón "Ver en LinkedIn" quedaban en la
misma fila y casi pegados (ambos son elementos `inline-flex`, que fluyen
en línea); se envolvió cada uno en su propio `<div className="mt-3">` para
forzar que el botón caiga en su propia línea, debajo de la pill y alineado
a la izquierda con el resto del texto (o debajo del cargo, con el mismo
espaciado, cuando no hay track).
**Archivos:**
- `components/ui/SpeakerModal.tsx` — reestructurado de `sm:flex` de dos
  columnas a un solo contenedor con scroll (`overflow-y-auto`), un
  encabezado `flex` (foto + texto) y la bio condicional debajo con
  separador; `sizes` del `<Image>` actualizado a
  `(max-width: 640px) 96px, 160px`; ancho del modal (`max-w-2xl`) sin
  cambios.
**Cómo verificar:** en la portada, sección Speakers, abrir "Charles
Zamorano" (bio mediana) y confirmar que no queda espacio vacío bajo el
encabezado; abrir "Hector Shibata" (bio larga) y confirmar que la
descripción fluye a todo el ancho sin recortes ni superposición con el
botón de cerrar; abrir un speaker sin bio (por ejemplo, revisar el listado
de speakers sin descripción cargada) y confirmar que no aparece separador
ni bloque vacío. Repetir en ~375 px de ancho: la foto queda junto al
nombre, el texto hace wrap sin apretarse y el botón X no tapa el nombre.
`npx tsc --noEmit` sin errores.
**Notas / pendientes:** ninguna.

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
