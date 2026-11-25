-- =====================================================================
-- AgendaMogi — Migração 12: Painel (RPC de indicadores)
-- Onde rodar: Supabase > SQL Editor > New query > colar tudo > Run
-- Pré-requisito: Migrações 01 e 02.
-- =====================================================================

create or replace function public.get_dashboard_stats()
returns jsonb
language sql stable security invoker set search_path = ''
as $$
with
  ctx as (
    select (select private.my_clinic_id()) as clinic_id,
           (select private.my_professional_id()) as prof_id,
           (select private.is_staff()) as is_staff,
           (select timezone from public.clinics where id = (select private.my_clinic_id())) as tz
  ),
  scoped as (
    select a.* from public.appointments a, ctx
    where a.clinic_id = ctx.clinic_id
      and (ctx.is_staff or a.professional_id = ctx.prof_id)
  ),
  today as (
    select count(*) filter (where (starts_at at time zone (select tz from ctx))::date = (now() at time zone (select tz from ctx))::date) as total,
           count(*) filter (where status = 'pending'   and (starts_at at time zone (select tz from ctx))::date = (now() at time zone (select tz from ctx))::date) as pending,
           count(*) filter (where status = 'confirmed' and (starts_at at time zone (select tz from ctx))::date = (now() at time zone (select tz from ctx))::date) as confirmed,
           count(*) filter (where status = 'completed' and (starts_at at time zone (select tz from ctx))::date = (now() at time zone (select tz from ctx))::date) as completed,
           count(*) filter (where status = 'cancelled' and (starts_at at time zone (select tz from ctx))::date = (now() at time zone (select tz from ctx))::date) as cancelled,
           count(*) filter (where status = 'no_show'   and (starts_at at time zone (select tz from ctx))::date = (now() at time zone (select tz from ctx))::date) as no_show
    from scoped
  ),
  week as (
    select count(*) filter (where (starts_at at time zone (select tz from ctx))::date between (now() at time zone (select tz from ctx))::date and (now() at time zone (select tz from ctx))::date + 6) as total,
           count(*) filter (where status = 'pending'   and (starts_at at time zone (select tz from ctx))::date between (now() at time zone (select tz from ctx))::date and (now() at time zone (select tz from ctx))::date + 6) as pending,
           count(*) filter (where status = 'confirmed' and (starts_at at time zone (select tz from ctx))::date between (now() at time zone (select tz from ctx))::date and (now() at time zone (select tz from ctx))::date + 6) as confirmed,
           count(*) filter (where status = 'completed' and (starts_at at time zone (select tz from ctx))::date between (now() at time zone (select tz from ctx))::date and (now() at time zone (select tz from ctx))::date + 6) as completed,
           count(*) filter (where status = 'cancelled' and (starts_at at time zone (select tz from ctx))::date between (now() at time zone (select tz from ctx))::date and (now() at time zone (select tz from ctx))::date + 6) as cancelled,
           count(*) filter (where status = 'no_show'   and (starts_at at time zone (select tz from ctx))::date between (now() at time zone (select tz from ctx))::date and (now() at time zone (select tz from ctx))::date + 6) as no_show
    from scoped
  ),
  upcoming as (
    select jsonb_agg(jsonb_build_object(
      'id', a.id,
      'starts_at', a.starts_at,
      'ends_at', a.ends_at,
      'status', a.status,
      'patient', p.full_name,
      'professional', pr.name,
      'service', s.name
    ) order by a.starts_at) as data
    from scoped a
    left join public.patients p on p.id = a.patient_id
    left join public.professionals pr on pr.id = a.professional_id
    left join public.services s on s.id = a.service_id
    where a.starts_at > now()
      and a.status in ('pending', 'confirmed')
    limit 5
  )
select jsonb_build_object(
  'today', (select row_to_json(today) from today),
  'week',  (select row_to_json(week) from week),
  'upcoming', coalesce((select data from upcoming), '[]'::jsonb),
  'timezone', (select tz from ctx)
);
$$;

revoke execute on function public.get_dashboard_stats() from public, anon;
grant  execute on function public.get_dashboard_stats() to authenticated;