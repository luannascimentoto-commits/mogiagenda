-- =====================================================================
-- AgendaMogi — Migração 08: Clínica (RPC transacional + Storage)
-- Onde rodar: Supabase > SQL Editor > New query > colar tudo > Run
-- Pré-requisito: Migrações 01 e 02 executadas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RPC transacional para gravar os horários de funcionamento.
--    Apaga todos os registros da clínica e reinsere os novos numa transação.
-- ---------------------------------------------------------------------
create or replace function public.save_clinic_hours(p_clinic_id uuid, p_hours jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_clinic_id <> (select private.my_clinic_id()) then
    raise exception 'clinic_mismatch';
  end if;
  if not (select private.is_admin()) then
    raise exception 'not_admin';
  end if;

  delete from public.clinic_hours where clinic_id = p_clinic_id;

  insert into public.clinic_hours (clinic_id, weekday, opens_at, closes_at)
  select p_clinic_id,
         (h->>'weekday')::smallint,
         (h->>'opens_at')::time,
         (h->>'closes_at')::time
  from jsonb_array_elements(coalesce(p_hours, '[]'::jsonb)) as h;
end;
$$;

grant execute on function public.save_clinic_hours(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 2. Bucket de logotipos (leitura pública).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clinic-assets', 'clinic-assets', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 3. Políticas do Storage: leitura pública; escrita restrita ao admin
--    da própria clínica, com prefixo <clinic_id>/ no caminho do objeto.
-- ---------------------------------------------------------------------
drop policy if exists "clinic_assets_public_read" on storage.objects;
create policy "clinic_assets_public_read" on storage.objects
  for select
  using (bucket_id = 'clinic-assets');

drop policy if exists "clinic_assets_admin_insert" on storage.objects;
create policy "clinic_assets_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] = (select private.my_clinic_id())::text
    and (select private.is_admin())
  );

drop policy if exists "clinic_assets_admin_update" on storage.objects;
create policy "clinic_assets_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] = (select private.my_clinic_id())::text
    and (select private.is_admin())
  )
  with check (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] = (select private.my_clinic_id())::text
    and (select private.is_admin())
  );

drop policy if exists "clinic_assets_admin_delete" on storage.objects;
create policy "clinic_assets_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] = (select private.my_clinic_id())::text
    and (select private.is_admin())
  );