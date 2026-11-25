import { supabase } from '@/lib/supabase'
import type { Service, ServiceInput } from './types'

const columns = 'id, name, description, duration_minutes, price_cents, is_active'

// As regras de segurança do banco (RLS) já limitam tudo à clínica de quem está logado.

export async function listServices(): Promise<Service[]> {
  const { data, error } = await supabase.from('services').select(columns).order('name')
  if (error) throw error
  return (data ?? []) as Service[]
}

export async function createService(clinicId: string, input: ServiceInput): Promise<void> {
  const { error } = await supabase.from('services').insert({ clinic_id: clinicId, ...input })
  if (error) throw error
}

export async function updateService(id: string, input: ServiceInput): Promise<void> {
  const { data, error } = await supabase.from('services').update(input).eq('id', id).select('id')
  if (error) throw error
  // O banco não dá erro quando a regra de segurança bloqueia: simplesmente nada é alterado.
  if (!data || data.length === 0) throw new Error('sem_permissao')
}
