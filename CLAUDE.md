# LinkU Capital Summit — guía para Claude

Landing bilingüe (ES/EN) + venta de entradas + panel admin del evento.
Next.js 15 · Supabase · Wompi · Cloudflare Workers. Ver
`docs/ANALISIS-2026-09-26.md` para el mapa completo y `docs/DEPLOY.md` para
publicar.

## Regla obligatoria: documentar cada cambio

Todo cambio al repositorio (código, contenido, diseño, configuración,
migraciones, dependencias) se registra en **`docs/CAMBIOS.md`**, en la misma
tarea y antes de hacer commit, con una entrada nueva arriba siguiendo el
formato del archivo (fecha, quién, tipo, qué cambió en lenguaje simple,
archivos, cómo verificar, pendientes). Si el cambio altera algo descrito en
`docs/` (arquitectura, deploy, variables de entorno), actualizar también ese
documento.

## Convenciones

- Idioma: comentarios, docs y commits en español.
- Textos del sitio: `content/es/*.json` y `content/en/*.json` — cambiar ambos
  idiomas siempre.
- Antes de dar por terminado un cambio de código: `npx tsc --noEmit`.
- Nunca usar ni escribir llaves de producción en `.env.local`; en local solo
  las públicas de Supabase o llaves `pub_test_` de Wompi.
- Todo lo que llega a `main` se publica solo en producción (GitHub Actions,
  ver `docs/DEPLOY.md`). Nunca hacer push/merge a `main` sin confirmación
  explícita del usuario. Las migraciones de Supabase son manuales y van antes
  del merge.
