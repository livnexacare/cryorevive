export interface Service {
  id: string
  name: string
  duration: string
  price: number
  priceDisplay: string
  description: string
  serviceType: string
}

export const SERVICES: Service[] = [
  {
    id: 'ice_bath',
    name: 'Ice Bath',
    duration: '15 min',
    price: 0,
    priceDisplay: '',
    description: 'Cold plunge therapy for recovery and inflammation reduction',
    serviceType: 'ice_bath',
  },
  {
    id: 'steam_sauna',
    name: 'Steam Sauna',
    duration: '20 min',
    price: 0,
    priceDisplay: '',
    description: 'Heat therapy for detoxification and relaxation',
    serviceType: 'steam_sauna',
  },
  {
    id: 'contrast_therapy',
    name: 'Contrast Therapy',
    duration: '45 min',
    price: 0,
    priceDisplay: '',
    description: 'Alternating hot and cold therapy for maximum recovery',
    serviceType: 'contrast_therapy',
  },
  {
    id: 'cryo_chamber',
    name: 'Cryo Chamber',
    duration: '3 min',
    price: 0,
    priceDisplay: '',
    description: 'Whole-body cryotherapy in sub-zero chamber for rapid recovery',
    serviceType: 'cryo_chamber',
  },
]

export const getService = (serviceType: string): Service | undefined =>
  SERVICES.find((s) => s.serviceType === serviceType)
