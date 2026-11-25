import { z } from 'zod'

export interface Clinic {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address_line: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  timezone: string
  booking_min_notice_hours: number
  booking_max_days_ahead: number
  slot_step_minutes: number
  auto_confirm: boolean
}

export interface ClinicHour {
  id?: string
  weekday: number
  opens_at: string
  closes_at: string
}

export const clinicSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome (mínimo 2 letras).').max(120, 'Máximo de 120 caracteres.'),
  address_line: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  state: z.string().trim().max(2).optional().or(z.literal('')),
  zip_code: z.string().trim().max(20).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(20).optional().or(z.literal('')),
  email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
  timezone: z.string().min(1, 'Escolha o fuso.'),
  booking_min_notice_hours: z.number().int().min(0, 'Não pode ser negativo.'),
  booking_max_days_ahead: z.number().int().min(1).max(365),
  slot_step_minutes: z.number().int().refine((v) => [5, 10, 15, 20, 30, 60].includes(v), 'Passo inválido.'),
  auto_confirm: z.boolean(),
})

export type ClinicFormValues = z.infer<typeof clinicSchema>

export const hourRowSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    opens_at: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
    closes_at: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  })
  .refine((d) => d.closes_at > d.opens_at, { message: 'Fechamento deve ser após a abertura.', path: ['closes_at'] })

export const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Bahia',
  'America/Cuiaba',
  'America/Campo_Grande',
  'America/Porto_Velho',
  'America/Rio_Branco',
]