-- =====================================================================
-- AgendaMogi — Migração 10: Usuários (coluna email + proteção último admin)
-- Onde rodar: Supabase > SQL Editor > New query > colar tudo > Run
-- Pré-requisito: Migrações 01 e 02.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Adiciona coluna email em profiles (para exibir/enviar reset sem auth.users).
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

-- ---------------------------------------------------------------------
-- 2. Proteção: um admin não pode desativar nem rebaixar o último admin
--    ativo da clínica. Implementado por gatilho BEFORE UPDATE.
-- ---------------------------------------------------------------------
create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  active_admins int;
begin
  -- só interessa quando estamos desativando ou mudando o papel de um admin ativo
  if (old.role = 'admin' and old.is_active = true)
     and (new.is_active = false or new.role <> 'admin') then
    select count(*) into active_admins
    from public.profiles
    where clinic_id = old.clinic_id
      and role = 'admin'
      and is_active = true
      and id <> old.id;
    if active_admins = 0 then
      raise exception 'last_admin_protected';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_last_admin on public.profiles;
create trigger profiles_protect_last_admin
  before update on public.profiles
  for each row execute function public.protect_last_admin();