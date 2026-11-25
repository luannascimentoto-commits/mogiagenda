import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  today: { total: number; pending: number; confirmed: number; completed: number; cancelled: number; no_show: number }
  week: { total: number; pending: number; confirmed: number; completed: number; cancelled: number; no_show: number }
  upcoming: { id: string; starts_at: string; ends_at: string; status: string; patient: string; professional: string; service: string }[]
  timezone: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats')
  if (error) throw error
  return data as DashboardStats
}