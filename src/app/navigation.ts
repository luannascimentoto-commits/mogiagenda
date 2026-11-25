import {
  Ban,
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '@/auth/auth-context'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  roles: UserRole[]
  end?: boolean
}

const all: UserRole[] = ['admin', 'receptionist', 'professional']
const staff: UserRole[] = ['admin', 'receptionist']

/** Itens do menu lateral e quem pode ver cada um. */
export const navItems: NavItem[] = [
  { to: '/app', label: 'Painel', icon: LayoutDashboard, roles: all, end: true },
  { to: '/app/agenda', label: 'Agenda', icon: CalendarDays, roles: all },
  { to: '/app/agendamentos', label: 'Agendamentos', icon: ClipboardList, roles: all },
  { to: '/app/pacientes', label: 'Pacientes', icon: Users, roles: all },
  { to: '/app/profissionais', label: 'Profissionais', icon: Stethoscope, roles: staff },
  { to: '/app/servicos', label: 'Serviços', icon: ListChecks, roles: staff },
  { to: '/app/bloqueios', label: 'Bloqueios', icon: Ban, roles: staff },
  { to: '/app/clinica', label: 'Clínica', icon: Building2, roles: ['admin'] },
  { to: '/app/usuarios', label: 'Usuários', icon: ShieldCheck, roles: ['admin'] },
]
