import { apiFetch } from './api'

export interface ServicePrice {
  id: string
  service_type: string
  name: string
  duration: string
  price: number
  is_active: boolean
}

export async function getLivePrices(): Promise<ServicePrice[]> {
  try {
    const data = await apiFetch<ServicePrice[]>('/api/pricing/services')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
