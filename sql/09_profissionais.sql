-- =====================================================================
-- AgendaMogi — Migração 09: Profissionais (RPC + Storage)
-- Onde rodar: Supabase > SQL Editor > New query > colar tudo > Run
-- Pré-requisito: Migrações 01 e 02.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RPC transacional para gravar os horários de atendimento do profissional.
-- ---------------------------------------------------------------------
create or replace function public.save_professional_schedules(p_professional_id uuid, p_schedules jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_clinic_id uuid;
begin
  select clinic_id into v_clinic_id from public.professionals where id = p_professional_id;
  if v_clinic_id is null or v_clinic_id <> (select private.my_clinic_id()) then
    raise exception 'professional_mismatch';
  end if;
  if not (select private.is_admin()) then
    raise exception 'not_admin';
  end if;

  delete from public.professional_schedules where professional_id = p_professional_id;

  insert into public.professional_schedules (clinic_id, professional_id, weekday, starts_at, ends_at)
  select v_clinic_id, p_professional_id,
         (s->>'weekday')::smallint,
         (s->>'starts_at')::time,
         (s->>'ends_at')::time
  from jsonb_array_elements(coalesce(p_schedules, '[]'::jsonb)) as s;
end;
$$;

grant execute on function public.save_professional_schedules(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 2. Bucket de fotos de profissionais.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('professional-photos', 'professional-photos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 3. Políticas do Storage.
-- ---------------------------------------------------------------------
drop policy if exists "prof_photos_public_read" on storage.objects;
create policy "prof_photos_public_read" on storage.objects
  for select using (bucket_id = 'professional-photos');

drop policy if exists "prof_photos_admin_insert" on storage.objects;
create policy "prof_photos_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'professional-photos'
    and (storage.foldername(name))[1] = (select private.my_clinic_id())::text
    and (select private.is_admin())
  );

drop policy if exists "prof_photos_admin_update" on storage.objects;
create policy "prof_photos_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'professional-photos'
    and (storage.foldername(name))[1] = (select private.my_clinic_id())::text
    and (select private.is_admin())
  )
  with check (
    bucket_id = 'professional-photos'
    and (storage.foldername(name))[1] = (select private.my_clinic_id())::text
    and (select private.is_admin())
  );

drop policy if exists "prof_photos_admin_delete" on storage.objects;
create policy "prof_photos_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'professional-photos'
    and (storage.foldername(name))[1] = (select private.my_clinic_id())::text
    and (select private.is_admin())
  );