export interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price_cents: number | null
  is_active: boolean
}

export type ServiceInput = Omit<Service, 'id'>
