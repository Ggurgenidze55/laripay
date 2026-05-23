export const GEORGIAN_CARRIERS = [
  { id: 'delivo', name: 'Delivo', nameKa: 'Delivo', status: 'live' as const, services: ['standard', 'express', 'same_day'] as const, cod: true, tracking: true, envPrefix: 'DELIVO' },
  { id: 'onway', name: 'OnWay', nameKa: 'OnWay', status: 'live' as const, services: ['standard', 'express'] as const, cod: true, tracking: true, envPrefix: 'ONWAY' },
  { id: 'georgian_post', name: 'Georgian Post', nameKa: 'საქართველოს ფოსტა', status: 'live' as const, services: ['standard', 'registered', 'express'] as const, cod: true, tracking: true, envPrefix: 'GEORGIAN_POST' },
  { id: 'glovo', name: 'Glovo', nameKa: 'Glovo', status: 'beta' as const, services: ['courier', 'same_day'] as const, cod: false, tracking: true, envPrefix: 'GLOVO' },
  { id: 'wolt', name: 'Wolt Drive', nameKa: 'Wolt Drive', status: 'beta' as const, services: ['courier', 'same_day'] as const, cod: false, tracking: true, envPrefix: 'WOLT' },
  { id: 'bolt', name: 'Bolt Delivery', nameKa: 'Bolt Delivery', status: 'beta' as const, services: ['courier'] as const, cod: false, tracking: true, envPrefix: 'BOLT' },
  { id: 'kiwipost', name: 'KiwiPost', nameKa: 'KiwiPost', status: 'beta' as const, services: ['locker', 'courier'] as const, cod: true, tracking: true, envPrefix: 'KIWIPOST' },
  { id: 'optimo', name: 'Optimo Express', nameKa: 'Optimo Express', status: 'beta' as const, services: ['standard', 'express'] as const, cod: true, tracking: true, envPrefix: 'OPTIMO' },
  { id: 'multiline', name: 'MultiLine Express', nameKa: 'MultiLine Express', status: 'beta' as const, services: ['standard'] as const, cod: true, tracking: true, envPrefix: 'MULTILINE' },
  { id: 'dhl', name: 'DHL Georgia', nameKa: 'DHL საქართველო', status: 'live' as const, services: ['express', 'international'] as const, cod: false, tracking: true, envPrefix: 'DHL' },
  { id: 'fedex', name: 'FedEx Georgia', nameKa: 'FedEx საქართველო', status: 'beta' as const, services: ['express', 'international'] as const, cod: false, tracking: true, envPrefix: 'FEDEX' },
  { id: 'ups', name: 'UPS Georgia', nameKa: 'UPS საქართველო', status: 'beta' as const, services: ['express', 'international'] as const, cod: false, tracking: true, envPrefix: 'UPS' },
] as const;

export type GeorgianCarrierId = (typeof GEORGIAN_CARRIERS)[number]['id'];

export type DeliveryAddress = {
  name?: string;
  phone?: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
};

export type CarrierCredentials = {
  apiOrigin?: string | null;
  apiKey?: string | null;
  merchantId?: string | null;
};

export type CarrierCredentialsMap = Partial<Record<GeorgianCarrierId, CarrierCredentials>>;

export function isGeorgianCarrierId(value: string): value is GeorgianCarrierId {
  return GEORGIAN_CARRIERS.some((c) => c.id === value);
}

export function getGeorgianCarrier(id: string) {
  return GEORGIAN_CARRIERS.find((c) => c.id === id) ?? null;
}

export function carrierLabel(id: GeorgianCarrierId, locale: 'en' | 'ka' = 'en'): string {
  const c = getGeorgianCarrier(id);
  if (!c) return id;
  return locale === 'ka' ? c.nameKa : c.name;
}
