// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GeorgianDelivery } = require('@georgian-delivery');

import type { MerchantDeliveryConfig } from '@/lib/georgian-delivery/config';
import type { GeorgianCarrierId } from '@/lib/georgian-delivery/registry';

export function buildDeliveryClient(config: MerchantDeliveryConfig) {
  return new GeorgianDelivery({
    defaultCarrier: config.defaultCarrier,
    carrierCredentials: config.carrierCredentials || undefined,
  });
}

export type DeliveryRateInput = {
  from: Record<string, unknown>;
  to: Record<string, unknown>;
  weight_kg?: number;
  dimensions_cm?: { length?: number; width?: number; height?: number };
  cod_amount?: number;
  service?: string;
};

export type CreateShipmentInput = DeliveryRateInput & {
  reference?: string;
  description?: string;
  items?: Array<{ name: string; quantity: number; weight_kg?: number }>;
};

export type { GeorgianCarrierId, MerchantDeliveryConfig };
