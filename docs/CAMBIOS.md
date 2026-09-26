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
