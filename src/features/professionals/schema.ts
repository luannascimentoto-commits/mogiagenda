import { z } from 'zod'

export interface Professional {
  id: string
  clinic_id: string
  profile_id: string | null
  name: string
  specialty: string | null
  photo_url: string | null
  bio: string | null
  is_active: boolean
}

export interface ProfessionalServiceLink {
  service_id: string
  service_name: string
  duration_minutes: number | null
  price_cents: number | null
  override_duration: number | null
  override_price: number | null
}

export interface ProfessionalSchedule {
  id?: string
  weekday: number
  starts_at: string
  ends_at: string
}

export const professionalSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome (mínimo 2 letras).').max(120),
  specialty: z.string().trim().max(80).optional().or(z.literal('')),
  bio: z.string().trim().max(500).optional().or(z.literal('')),
  profile_id: z.string().uuid().optional().or(z.literal('')),
  is_active: z.boolean(),
})

export type ProfessionalFormValues = z.infer<typeof professionalSchema>

export const scheduleRowSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    starts_at: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
    ends_at: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  })
  .refine((d) => d.ends_at > d.starts_at, { message: 'Fim deve ser após o início.', path: ['ends_at'] })

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

