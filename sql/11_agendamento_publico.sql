-- =====================================================================
-- AgendaMogi — Migração 11: Agendamento público (get_available_days)
-- Onde rodar: Supabase > SQL Editor > New query > colar tudo > Run
-- Pré-requisito: Migração 03 executada.
-- =====================================================================

create or replace function public.get_available_days(
  p_slug            text,
  p_professional_id uuid,
  p_service_id      uuid
)
returns table (available_date date)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_clinic public.clinics%rowtype;
  v_today  date;
begin
  select * into v_clinic from public.clinics where slug = p_slug and is_active;
  if not found then return; end if;

  v_today := (now() at time zone v_clinic.timezone)::date;

  return query
  select d::date
  from generate_series(v_today, v_today + v_clinic.booking_max_days_ahead, interval '1 day') as d
  where exists (
    select 1 from public.get_available_slots(p_slug, p_professional_id, p_service_id, d::date) limit 1
  );
end;
$$;

revoke execute on function public.get_available_days(text, uuid, uuid) from public, anon, authenticated;
grant  execute on function public.get_available_days(text, uuid, uuid) to anon, authenticated;