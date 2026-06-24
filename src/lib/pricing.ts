export interface ServicePrice {
  id: string
  service_type: string
  name: string
  duration: string
  price: number
  is_active: boolean
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://cryorevive.onrender.com'

export async function fetchLivePrices(): Promise<ServicePrice[]> {
  try {
    const res = await fetch(`${API_URL}/api/pricing/services`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error('Failed to fetch prices')
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('[PRICING] Failed to fetch live prices:', err)
    return []
  }
}

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function getServicePrice(
  prices: ServicePrice[],
  serviceType: string
): ServicePrice | undefined {
  return prices.find((p) => p.service_type === serviceType && p.is_active)
}
