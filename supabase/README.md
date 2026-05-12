# Supabase — guía rápida

Esta carpeta tiene las migraciones SQL del proyecto. Cada archivo `NNNN_*.sql` se aplica una vez, en orden, dentro del SQL Editor de Supabase.

## Cómo aplicar una migración

1. Abre el dashboard de Supabase → tu proyecto.
2. Menú izquierdo → **SQL Editor**.
3. Clic en **New query**.
4. Abre el archivo `.sql` de esta carpeta y copia todo el contenido.
5. Pega en el editor y clic en **Run** (botón verde, abajo a la derecha).
6. Si todo va bien, deberías ver "Success. No rows returned." o similar.

## Migraciones en orden

| Archivo | Qué hace |
|---|---|
| `0001_init.sql` | Tabla `profiles` + trigger autopoblado + RLS básicas |

## Bucket de Storage

Aparte de las migraciones SQL, hay que crear UN bucket de Storage para las imágenes del summit (fotos de speakers, logos de sponsors, etc.):

1. Dashboard → **Storage** (menú izquierdo).
2. **New bucket**.
3. Nombre: `summit-media`
4. Marca **Public bucket** (✅).
5. Clic en **Create bucket**.

Una vez creado, dentro de él podemos crear carpetas: `speakers/`, `sponsors/`, `partners/`, `og/`.
