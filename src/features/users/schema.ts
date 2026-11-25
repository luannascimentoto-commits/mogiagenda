import { z } from 'zod'

export interface UserRow {
  id: string
  full_name: string
  email: string | null
  role: 'admin' | 'receptionist' | 'professional'
  is_active: boolean
  created_at: string
}

export const createUserSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
  full_name: z.string().trim().min(2, 'Informe o nome (mínimo 2 letras).').max(120),
  role: z.enum(['admin', 'receptionist', 'professional']),
})

export type CreateUserValues = z.infer<typeof createUserSchema>