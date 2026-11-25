import type { UserRole } from './auth-context'

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  receptionist: 'Recepção',
  professional: 'Profissional',
}
