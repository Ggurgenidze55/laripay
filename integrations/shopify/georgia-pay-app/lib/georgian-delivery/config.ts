import type { CarrierCredentialsMap, GeorgianCarrierId } from '@/lib/georgian-delivery/registry';
import { GEORGIAN_CARRIERS } from '@/lib/georgian-delivery/registry';

export type MerchantDeliveryConfig = {
  defaultCarrier: GeorgianCarrierId;
  carrierCredentials?: CarrierCredentialsMap | null;
};

function envCarrierCreds(carrierId: GeorgianCarrierId) {
  const meta = GEORGIAN_CARRIERS.find((c) => c.id === carrierId);
  const prefix = meta?.envPrefix || carrierId.toUpperCase();
  return {
    apiOrigin: process.env[`${prefix}_API_ORIGIN`] || null,
    apiKey: process.env[`${prefix}_API_KEY`] || null,
    merchantId: process.env[`${prefix}_MERCHANT_ID`] || null,
  };
}

export function carrierCredentialsFor(
  config: MerchantDeliveryConfig,
  carrierId: GeorgianCarrierId,
) {
  const fromJson = config.carrierCredentials?.[carrierId];
  const fromEnv = envCarrierCreds(carrierId);
  return {
    apiOrigin: fromJson?.apiOrigin || fromEnv.apiOrigin,
    apiKey: fromJson?.apiKey || fromEnv.apiKey,
    merchantId: fromJson?.merchantId || fromEnv.merchantId,
  };
}

export function isCarrierConfigured(config: MerchantDeliveryConfig, carrierId: GeorgianCarrierId) {
  const c = carrierCredentialsFor(config, carrierId);
  return Boolean(c.apiOrigin && c.apiKey);
}

export function parseCarrierCredentialsJson(raw: unknown): CarrierCredentialsMap | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as CarrierCredentialsMap;
}
