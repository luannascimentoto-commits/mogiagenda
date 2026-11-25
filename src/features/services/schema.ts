import { z } from 'zod'
import { parsePrice } from '@/lib/format'

export const DURATIONS = [10, 15, 20, 30, 40, 45, 50, 60, 75, 90, 120, 180]

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe o nome (mínimo 2 letras).')
    .max(80, 'Máximo de 80 caracteres.'),
  description: z.string().trim().max(300, 'Máximo de 300 caracteres.'),
  duration: z.string().min(1, 'Escolha a duração.'),
  price: z.string().refine((v) => parsePrice(v).ok, 'Valor inválido. Exemplo: 150,00'),
  is_active: z.boolean(),
})

export type ServiceFormValues = z.infer<typeof serviceSchema>