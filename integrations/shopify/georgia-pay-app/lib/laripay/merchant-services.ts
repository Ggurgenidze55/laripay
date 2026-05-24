import prisma from '@/lib/prisma';
import {
  isCarrierConfigured,
  parseCarrierCredentialsJson,
  type MerchantDeliveryConfig,
} from '@/lib/georgian-delivery/config';
import { GEORGIAN_CARRIERS, type GeorgianCarrierId } from '@/lib/georgian-delivery/registry';
import {
  isWarehouseSystemConfigured,
  parseWarehouseCredentialsJson,
  type MerchantWarehouseConfig,
} from '@/lib/georgian-warehouse/config';
import { isWarehouseSystemId, type WarehouseSystemId } from '@/lib/georgian-warehouse/registry';
import type { IntegrationPlatformId } from '@/lib/laripay/integration-platform';

export type MerchantServiceId =
  | 'checkout'
  | 'webhooks'
  | 'tbc'
  | 'bog'
  | 'delivery'
  | 'warehouse'
  | 'installments'
  | 'integration';

export type MerchantServiceRow = {
  id: MerchantServiceId;
  enabled: boolean;
  region: string;
  integrationPlatform?: IntegrationPlatformId;
};

type MerchantRow = {
  id: string;
  defaultCarrier: string;
  defaultWarehouseSystem: string;
  carrierCredentials: unknown;
  warehouseCredentials: unknown;
  tbcClientId: string | null;
  tbcClientSecret: string | null;
  bogPublicKey: string | null;
  bogSecretKey: string | null;
  integrationPlatform: string | null;
};

function bankConfigured(merchant: MerchantRow) {
  return {
    tbc: Boolean(merchant.tbcClientId && merchant.tbcClientSecret),
    bog: Boolean(merchant.bogPublicKey && merchant.bogSecretKey),
  };
}

function deliveryConfigured(merchant: MerchantRow): boolean {
  const carrierCredentials = parseCarrierCredentialsJson(merchant.carrierCredentials);
  const config: MerchantDeliveryConfig = {
    defaultCarrier: (merchant.defaultCarrier || 'delivo') as GeorgianCarrierId,
    carrierCredentials,
  };
  if (isCarrierConfigured(config, config.defaultCarrier)) return true;
  return GEORGIAN_CARRIERS.some((c) => isCarrierConfigured(config, c.id));
}

function warehouseConfigured(merchant: MerchantRow): boolean {
  const defaultSystem = (
    isWarehouseSystemId(merchant.defaultWarehouseSystem || '') ? merchant.defaultWarehouseSystem : 'fina'
  ) as WarehouseSystemId;
  const config: MerchantWarehouseConfig = {
    defaultSystem,
    warehouseCredentials: parseWarehouseCredentialsJson(merchant.warehouseCredentials),
  };
  return isWarehouseSystemConfigured(config, defaultSystem);
}

export async function buildMerchantServices(merchant: MerchantRow): Promise<MerchantServiceRow[]> {
  const banks = bankConfigured(merchant);
  const apiKeyCount = await prisma.apiKey.count({
    where: { merchantId: merchant.id, revokedAt: null },
  });
  const webhookEndpointsEnabled = await prisma.webhookEndpoint.count({
    where: { merchantId: merchant.id, enabled: true },
  });

  const checkoutEnabled = apiKeyCount > 0 || banks.tbc || banks.bog;
  const banksAny = banks.tbc || banks.bog;

  const integrationPlatform = (merchant.integrationPlatform || 'api') as IntegrationPlatformId;

  return [
    { id: 'checkout', enabled: checkoutEnabled, region: 'eu-west' },
    { id: 'webhooks', enabled: webhookEndpointsEnabled > 0, region: 'eu-west' },
    { id: 'tbc', enabled: banks.tbc, region: 'ge-tbc' },
    { id: 'bog', enabled: banks.bog, region: 'ge-bog' },
    { id: 'delivery', enabled: deliveryConfigured(merchant), region: 'ge' },
    { id: 'warehouse', enabled: warehouseConfigured(merchant), region: 'ge' },
    { id: 'installments', enabled: banksAny, region: 'ge' },
    {
      id: 'integration',
      enabled: Boolean(merchant.integrationPlatform) || checkoutEnabled,
      region: integrationPlatform,
      integrationPlatform,
    },
  ];
}

export function countEnabledServices(services: MerchantServiceRow[]): {
  enabled: number;
  total: number;
  allEnabled: boolean;
} {
  const enabled = services.filter((s) => s.enabled).length;
  return { enabled, total: services.length, allEnabled: enabled === services.length };
}
