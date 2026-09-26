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
