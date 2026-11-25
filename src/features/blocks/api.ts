import { supabase } from '@/lib/supabase'
import type { TimeBlock } from './schema'

export async function listTimeBlocks(): Promise<TimeBlock[]> {
  const { data, error } = await supabase
    .from('time_blocks')
    .select('id, clinic_id, professional_id, starts_at, ends_at, reason')
    .order('starts_at')
  if (error) throw error
  return (data ?? []) as TimeBlock[]
}

export async function createTimeBlock(input: {
  professional_id: string | null
  starts_at: string
  ends_at: string
  reason: string | null
}): Promise<void> {
  const { data: clinic } = await supabase.from('clinics').select('id').single()
  const { error } = await supabase.from('time_blocks').insert({
    clinic_id: clinic!.id,
    professional_id: input.professional_id,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    reason: input.reason,
  })
  if (error) throw error
}

export async function deleteTimeBlock(id: string): Promise<void> {
  const { error } = await supabase.from('time_blocks').delete().eq('id', id)
  if (error) throw error
}

/** Consulta agendamentos ativos no intervalo (para detectar conflito). */
export async function findConflictingAppointments(startsAt: string, endsAt: string, professionalId: string | null): Promise<{ id: string; starts_at: string; ends_at: string }[]> {
  let q = supabase
    .from('appointments')
    .select('id, starts_at, ends_at')
    .lt('starts_at', endsAt)
    .gt('ends_at', startsAt)
    .in('status', ['pending', 'confirmed'])
  if (professionalId) q = q.eq('professional_id', professionalId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as any
}

export async function listProfessionalsSimple(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('professionals').select('id, name').eq('is_active', true).order('name')
  if (error) throw error
  return (data ?? []) as any
}