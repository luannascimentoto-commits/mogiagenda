import { supabase } from '@/lib/supabase'
import type { UserRow, CreateUserValues } from './schema'

export async function listUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('full_name')
  if (error) throw error
  return (data ?? []) as UserRow[]
}

export async function createUser(values: CreateUserValues): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-create-user', {
    body: { email: values.email, full_name: values.full_name, role: values.role },
  })
  if (error) throw error
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_active: active }).eq('id', id)
  if (error) throw error
}

export async function sendResetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  })
  if (error) throw error
}