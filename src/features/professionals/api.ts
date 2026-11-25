import { supabase } from '@/lib/supabase'
import type { Professional, ProfessionalFormValues, ProfessionalSchedule, ProfessionalServiceLink } from './schema'

export async function listProfessionals(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from('professionals')
    .select('id, clinic_id, profile_id, name, specialty, photo_url, bio, is_active')
    .order('name')
  if (error) throw error
  return (data ?? []) as Professional[]
}

export async function getProfessional(id: string): Promise<Professional> {
  const { data, error } = await supabase.from('professionals').select('*').eq('id', id).single()
  if (error) throw error
  return data as Professional
}

export async function createProfessional(input: ProfessionalFormValues): Promise<void> {
  const { data: clinic } = await supabase.from('clinics').select('id').single()
  const { error } = await supabase.from('professionals').insert({
    clinic_id: clinic!.id,
    name: input.name,
    specialty: input.specialty === '' ? null : input.specialty,
    bio: input.bio === '' ? null : input.bio,
    profile_id: input.profile_id === '' ? null : input.profile_id,
    is_active: input.is_active,
  })
  if (error) throw error
}

export async function updateProfessional(id: string, input: ProfessionalFormValues): Promise<void> {
  const { error } = await supabase
    .from('professionals')
    .update({
      name: input.name,
      specialty: input.specialty === '' ? null : input.specialty,
      bio: input.bio === '' ? null : input.bio,
      profile_id: input.profile_id === '' ? null : input.profile_id,
      is_active: input.is_active,
    })
    .eq('id', id)
  if (error) throw error
}

export async function listProfessionalServices(professionalId: string): Promise<ProfessionalServiceLink[]> {
  // join services
  const { data, error } = await supabase
    .from('professional_services')
    .select('service_id, duration_minutes, price_cents, services(name, duration_minutes, price_cents)')
    .eq('professional_id', professionalId)
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    service_id: r.service_id,
    service_name: r.services?.name ?? '',
    duration_minutes: r.services?.duration_minutes ?? null,
    price_cents: r.services?.price_cents ?? null,
    override_duration: r.duration_minutes,
    override_price: r.price_cents,
  })) as ProfessionalServiceLink[]
}

export async function listAllServices(): Promise<{ id: string; name: string; duration_minutes: number; price_cents: number | null }[]> {
  const { data, error } = await supabase.from('services').select('id, name, duration_minutes, price_cents').eq('is_active', true).order('name')
  if (error) throw error
  return (data ?? []) as any
}

export async function saveProfessionalServices(
  professionalId: string,
  links: { service_id: string; duration_minutes: number | null; price_cents: number | null }[],
): Promise<void> {
  // delete all then insert
  const { data: prof } = await supabase.from('professionals').select('clinic_id').eq('id', professionalId).single()
  const clinicId = prof!.clinic_id
  const { error: delErr } = await supabase.from('professional_services').delete().eq('professional_id', professionalId)
  if (delErr) throw delErr
  if (links.length === 0) return
  const rows = links.map((l) => ({
    clinic_id: clinicId,
    professional_id: professionalId,
    service_id: l.service_id,
    duration_minutes: l.duration_minutes,
    price_cents: l.price_cents,
  }))
  const { error: insErr } = await supabase.from('professional_services').insert(rows)
  if (insErr) throw insErr
}

export async function listProfessionalSchedules(professionalId: string): Promise<ProfessionalSchedule[]> {
  const { data, error } = await supabase
    .from('professional_schedules')
    .select('id, weekday, starts_at, ends_at')
    .eq('professional_id', professionalId)
    .order('weekday')
    .order('starts_at')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    weekday: r.weekday,
    starts_at: String(r.starts_at).slice(0, 5),
    ends_at: String(r.ends_at).slice(0, 5),
  })) as ProfessionalSchedule[]
}

export async function saveProfessionalSchedules(professionalId: string, schedules: ProfessionalSchedule[]): Promise<void> {
  const { error } = await supabase.rpc('save_professional_schedules', {
    p_professional_id: professionalId,
    p_schedules: schedules.map((s) => ({ weekday: s.weekday, starts_at: s.starts_at, ends_at: s.ends_at })),
  })
  if (error) throw error
}

async function resizeImage(file: File, maxPx: number): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = URL.createObjectURL(file)
  })
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  URL.revokeObjectURL(img.src)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize_failed'))), file.type || 'image/jpeg', 0.9)
  })
}

export async function uploadProfessionalPhoto(professionalId: string, file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('mime_invalido')
  if (file.size > 2 * 1024 * 1024) throw new Error('arquivo_grande')
  const { data: prof } = await supabase.from('professionals').select('clinic_id').eq('id', professionalId).single()
  const clinicId = prof!.clinic_id
  const resized = await resizeImage(file, 512)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${clinicId}/${professionalId}/photo.${ext}`
  const { error: upErr } = await supabase.storage.from('professional-photos').upload(path, resized, { upsert: true, contentType: file.type })
  if (upErr) throw upErr
  const { data } = supabase.storage.from('professional-photos').getPublicUrl(path)
  const url = `${data.publicUrl}?t=${Date.now()}`
  await supabase.from('professionals').update({ photo_url: url }).eq('id', professionalId)
  return url
}

export async function listProfilesForLink(): Promise<{ id: string; full_name: string; role: string }[]> {
  const { data, error } = await supabase.from('profiles').select('id, full_name, role').eq('role', 'professional').eq('is_active', true)
  if (error) throw error
  return (data ?? []) as any
}