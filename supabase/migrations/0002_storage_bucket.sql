-- =====================================================================
-- LINKU SUMMIT — Migración 0002
-- Crea: bucket 'summit-media' + policies de lectura pública
-- =====================================================================

-- Bucket público para fotos de speakers, logos de sponsors/partners, etc.
insert into storage.buckets (id, name, public)
values ('summit-media', 'summit-media', true)
on conflict (id) do nothing;

-- Cualquiera puede leer archivos del bucket (necesario para que la landing los muestre)
drop policy if exists "Public read summit-media" on storage.objects;
create policy "Public read summit-media"
  on storage.objects for select
  using (bucket_id = 'summit-media');

-- Solo usuarios autenticados pueden subir archivos al bucket
-- (en Fase 2+ esto se usará; por ahora el admin sube vía dashboard con service_role)
drop policy if exists "Authenticated upload summit-media" on storage.objects;
create policy "Authenticated upload summit-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'summit-media');

-- Solo el dueño del archivo puede borrarlo/actualizarlo
drop policy if exists "Owner can update summit-media" on storage.objects;
create policy "Owner can update summit-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'summit-media' and owner = auth.uid());

drop policy if exists "Owner can delete summit-media" on storage.objects;
create policy "Owner can delete summit-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'summit-media' and owner = auth.uid());
