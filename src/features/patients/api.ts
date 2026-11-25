import { supabase } from '@/lib/supabase'

export interface Patient {
  id: string
  clinic_id: string
  full_name: string
  phone: string
  email: string | null
  consent_at: string | null
  consent_version: string | null
  created_at: string
}

export interface PatientInput {
  full_name: string
  phone: string
  email: string | null
}

export async function listPatients(search?: string): Promise<Patient[]> {
  let q = supabase.from('patients').select('id, clinic_id, full_name, phone, email, consent_at, consent_version, created_at').order('full_name')
  if (search && search.trim()) {
    q = q.ilike('full_name', `%${search.trim()}%`)
  }
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Patient[]
}

export async function getPatient(id: string): Promise<Patient> {
  const { data, error } = await supabase.from('patients').select('*').eq('id', id).single()
  if (error) throw error
  return data as Patient
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const { data: clinic } = await supabase.from('clinics').select('id').single()
  const { data, error } = await supabase
    .from('patients')
    .insert({ clinic_id: clinic!.id, full_name: input.full_name, phone: input.phone, email: input.email })
    .select()
    .single()
  if (error) throw error
  return data as Patient
}

export async function updatePatient(id: string, input: PatientInput): Promise<void> {
  const { error } = await supabase.from('patients').update({
    full_name: input.full_name,
    phone: input.phone,
    email: input.email,
  }).eq('id', id)
  if (error) throw error
}

export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) throw error
}