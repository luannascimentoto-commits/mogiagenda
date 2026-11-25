import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'receptionist' | 'professional'

export interface Profile {
  id: string
  clinic_id: string
  full_name: string
  role: UserRole
  is_active: boolean
}

export interface Clinic {
  id: string
  name: string
  slug: string
}

export interface AuthState {
  session: Session | null
  profile: Profile | null
  clinic: Clinic | null
  loading: boolean
  /** Devolve uma mensagem de erro, ou null se o login deu certo. */
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
