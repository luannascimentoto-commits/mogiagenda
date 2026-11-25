import { supabase } from '@/lib/supabase'

export interface AppointmentRow {
  id: string
  clinic_id: string
  professional_id: string
  service_id: string
  patient_id: string
  starts_at: string
  ends_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  source: 'online' | 'manual'
  notes: string | null
  contact_email: string | null
  created_at: string
  professional?: { name: string } | null
  service?: { name: string; duration_minutes: number } | null
  patient?: { full_name: string; phone: string } | null
}

export interface AppointmentFilters {
  dateFrom?: string // ISO
  dateTo?: string
  professionalId?: string
  serviceId?: string
  status?: string
  search?: string
}

export async function listAppointments(filters: AppointmentFilters = {}): Promise<AppointmentRow[]> {
  let q = supabase
    .from('appointments')
    .select('id, clinic_id, professional_id, service_id, patient_id, starts_at, ends_at, status, source, notes, contact_email, created_at, professionals(name), services(name, duration_minutes), patients(full_name, phone)')
    .order('starts_at')
  if (filters.dateFrom) q = q.gte('starts_at', filters.dateFrom)
  if (filters.dateTo) q = q.lte('starts_at', filters.dateTo)
  if (filters.professionalId) q = q.eq('professional_id', filters.professionalId)
  if (filters.serviceId) q = q.eq('service_id', filters.serviceId)
  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
  const { data, error } = await q
  if (error) throw error
  let rows = (data ?? []).map((r: any) => ({
    id: r.id,
    clinic_id: r.clinic_id,
    professional_id: r.professional_id,
    service_id: r.service_id,
    patient_id: r.patient_id,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    status: r.status,
    source: r.source,
    notes: r.notes,
    contact_email: r.contact_email,
    created_at: r.created_at,
    professional: r.professionals,
    service: r.services,
    patient: r.patients,
  })) as AppointmentRow[]

  if (filters.search && filters.search.trim()) {
    const t = filters.search.trim().toLowerCase()
    rows = rows.filter((r) => r.patient?.full_name?.toLowerCase().includes(t) || r.patient?.phone?.includes(t))
  }
  return rows
}

export async function updateAppointmentStatus(id: string, status: AppointmentRow['status']): Promise<void> {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
  if (error) throw error
}

export async function rescheduleAppointment(id: string, newStartIso: string, durationMinutes: number): Promise<void> {
  const start = new Date(newStartIso)
  const end = new Date(start.getTime() + durationMinutes * 60000)
  const { error } = await supabase.from('appointments').update({
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
  }).eq('id', id)
  if (error) throw error
}

export async function createManualAppointment(input: {
  professional_id: string
  service_id: string
  patient_id: string
  starts_at: string // ISO
  duration_minutes: number
  notes?: string | null
}): Promise<void> {
  const start = new Date(input.starts_at)
  const end = new Date(start.getTime() + input.duration_minutes * 60000)
  const { data: clinic } = await supabase.from('clinics').select('id, auto_confirm').single()
  const { error } = await supabase.from('appointments').insert({
    clinic_id: clinic!.id,
    professional_id: input.professional_id,
    service_id: input.service_id,
    patient_id: input.patient_id,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    status: clinic!.auto_confirm ? 'confirmed' : 'pending',
    source: 'manual',
    notes: input.notes ?? null,
  })
  if (error) throw error
}

export async function listProfessionalsSimple2(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('professionals').select('id, name').eq('is_active', true).order('name')
  if (error) throw error
  return (data ?? []) as any
}

export async function listServicesSimple(): Promise<{ id: string; name: string; duration_minutes: number }[]> {
  const { data, error } = await supabase.from('services').select('id, name, duration_minutes').eq('is_active', true).order('name')
  if (error) throw error
  return (data ?? []) as any
}