import { supabase } from '@/lib/supabase'
import type { Clinic, ClinicFormValues, ClinicHour } from './schema'

export async function getClinic(): Promise<Clinic> {
  const { data, error } = await supabase.from('clinics').select('*').single()
  if (error) throw error
  return data as Clinic
}

export async function updateClinic(clinicId: string, input: ClinicFormValues): Promise<void> {
  const payload = {
    name: input.name,
    address_line: input.address_line === '' ? null : input.address_line,
    city: input.city === '' ? null : input.city,
    state: input.state === '' ? null : input.state,
    zip_code: input.zip_code === '' ? null : input.zip_code,
    phone: input.phone === '' ? null : input.phone,
    whatsapp: input.whatsapp === '' ? null : input.whatsapp,
    email: input.email === '' ? null : input.email,
    timezone: input.timezone,
    booking_min_notice_hours: input.booking_min_notice_hours,
    booking_max_days_ahead: input.booking_max_days_ahead,
    slot_step_minutes: input.slot_step_minutes,
    auto_confirm: input.auto_confirm,
  }
  const { error } = await supabase.from('clinics').update(payload).eq('id', clinicId)
  if (error) throw error
}

export async function listClinicHours(): Promise<ClinicHour[]> {
  const { data, error } = await supabase
    .from('clinic_hours')
    .select('id, weekday, opens_at, closes_at')
    .order('weekday')
    .order('opens_at')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    weekday: r.weekday,
    opens_at: String(r.opens_at).slice(0, 5),
    closes_at: String(r.closes_at).slice(0, 5),
  })) as ClinicHour[]
}

export async function saveClinicHours(clinicId: string, hours: ClinicHour[]): Promise<void> {
  const payload = hours.map((h) => ({ weekday: h.weekday, opens_at: h.opens_at, closes_at: h.closes_at }))
  const { error } = await supabase.rpc('save_clinic_hours', { p_clinic_id: clinicId, p_hours: payload })
  if (error) throw error
}

/** Redimensiona a imagem no cliente para no máximo maxPx x maxPx. */
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

export async function uploadLogo(clinicId: string, file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('mime_invalido')
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('arquivo_grande')
  }
  const resized = await resizeImage(file, 512)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${clinicId}/logo.${ext}`
  const { error: upErr } = await supabase.storage.from('clinic-assets').upload(path, resized, {
    upsert: true,
    contentType: file.type,
  })
  if (upErr) throw upErr
  const { data } = supabase.storage.from('clinic-assets').getPublicUrl(path)
  const url = `${data.publicUrl}?t=${Date.now()}`
  const { error: updErr } = await supabase.from('clinics').update({ logo_url: url }).eq('id', clinicId)
  if (updErr) throw updErr
  return url
}