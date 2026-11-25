import { z } from 'zod'

export interface TimeBlock {
  id: string
  clinic_id: string
  professional_id: string | null
  starts_at: string
  ends_at: string
  reason: string | null
}

export const blockSchema = z
  .object({
    scope: z.enum(['clinic', 'professional']),
    professional_id: z.string().optional().or(z.literal('')),
    starts_at: z.string().min(1, 'Informe data e hora de início.'),
    ends_at: z.string().min(1, 'Informe data e hora de fim.'),
    reason: z.string().trim().max(200).optional().or(z.literal('')),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    message: 'Fim deve ser após o início.',
    path: ['ends_at'],
  })

export type BlockFormValues = z.infer<typeof blockSchema>

export const BRAZIL_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: 'Confraternização Universal' },
  { month: 4, day: 21, name: 'Tiradentes' },
  { month: 5, day: 1, name: 'Dia do Trabalho' },
  { month: 9, day: 7, name: 'Independência do Brasil' },
  { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
  { month: 11, day: 2, name: 'Finados' },
  { month: 11, day: 15, name: 'Proclamação da República' },
  { month: 12, day: 25, name: 'Natal' },
]