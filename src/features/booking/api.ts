import { supabase } from '@/lib/supabase'

export interface PublicService {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price_cents: number | null
}

export interface PublicProfessional {
  id: string
  name: string
  specialty: string | null
  photo_url: string | null
  bio: string | null
  services: { service_id: string; duration_minutes: number; price_cents: number | null }[]
}

export interface PublicClinic {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address_line: string | null
  city: string | null
  state: string | null
  phone: string | null
  whatsapp: string | null
  timezone: string
  booking_max_days_ahead: number
  auto_confirm: boolean
  services: PublicService[]
  professionals: PublicProfessional[]
}

export async function getPublicClinic(slug: string): Promise<PublicClinic> {
  const { data, error } = await supabase.rpc('get_public_clinic', { p_slug: slug })
  if (error) throw error
  return data as PublicClinic
}

export async function getAvailableDays(slug: string, professionalId: string, serviceId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_available_days', {
    p_slug: slug,
    p_professional_id: professionalId,
    p_service_id: serviceId,
  })
  if (error) throw error
  return (data ?? []).map((r: any) => (typeof r === 'string' ? r : r.available_date))
}

export async function getAvailableSlots(slug: string, professionalId: string, serviceId: string, date: string): Promise<{ start: string; end: string }[]> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_slug: slug,
    p_professional_id: professionalId,
    p_service_id: serviceId,
    p_date: date,
  })
  if (error) throw error
  return (data ?? []).map((r: any) => ({ start: r.slot_start, end: r.slot_end }))
}

export interface CreateAppointmentInput {
  slug: string
  professional_id: string
  service_id: string
  start: string
  full_name: string
  phone: string
  email: string
  consent: boolean
  consent_version?: string
  turnstile_token?: string
}

export async function createPublicAppointment(input: CreateAppointmentInput): Promise<{ cancel_token: string; status: string; starts_at: string; ends_at: string }> {
  // Se Turnstile estiver configurado, usa a Edge Function (valida token + cria com service role).
  // Caso contrário, chama a RPC diretamente (modo dev).
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  if (siteKey) {
    const { data, error } = await supabase.functions.invoke('create-booking', {
      body: {
        slug: input.slug,
        professional_id: input.professional_id,
        service_id: input.service_id,
        start: input.start,
        full_name: input.full_name,
        phone: input.phone,
        email: input.email,
        consent: input.consent,
        consent_version: input.consent_version ?? 'v1',
        turnstile_token: input.turnstile_token,
      },
    })
    if (error) throw error
    return data as any
  }
  const { data, error } = await supabase.rpc('create_public_appointment', {
    p_slug: input.slug,
    p_professional_id: input.professional_id,
    p_service_id: input.service_id,
    p_start: input.start,
    p_full_name: input.full_name,
    p_phone: input.phone,
    p_email: input.email,
    p_consent: input.consent,
    p_consent_version: input.consent_version ?? 'v1',
  })
  if (error) throw error
  return data as any
}

export async function getAppointmentByToken(token: string): Promise<any> {
  const { data, error } = await supabase.rpc('get_appointment_by_token', { p_token: token })
  if (error) throw error
  return data
}

export async function cancelAppointmentByToken(token: string): Promise<any> {
  const { data, error } = await supabase.rpc('cancel_appointment_by_token', { p_token: token })
  if (error) throw error
  return data
}