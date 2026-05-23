import type { WarehouseCredentialsMap, WarehouseSystemId } from '@/lib/georgian-warehouse/registry';
import { WAREHOUSE_SYSTEMS } from '@/lib/georgian-warehouse/registry';

export type MerchantWarehouseConfig = {
  defaultSystem: WarehouseSystemId;
  warehouseCredentials?: WarehouseCredentialsMap | null;
};

function envWarehouseCreds(systemId: WarehouseSystemId) {
  const meta = WAREHOUSE_SYSTEMS.find((s) => s.id === systemId);
  const prefix = meta?.envPrefix || systemId.toUpperCase();
  return {
    apiOrigin: process.env[`${prefix}_API_ORIGIN`] || null,
    apiKey: process.env[`${prefix}_API_KEY`] || null,
    companyId: process.env[`${prefix}_COMPANY_ID`] || null,
  };
}

export function warehouseCredentialsFor(
  config: MerchantWarehouseConfig,
  systemId: WarehouseSystemId,
) {
  const fromJson = config.warehouseCredentials?.[systemId];
  const fromEnv = envWarehouseCreds(systemId);
  return {
    apiOrigin: fromJson?.apiOrigin || fromEnv.apiOrigin,
    apiKey: fromJson?.apiKey || fromEnv.apiKey,
    companyId: fromJson?.companyId || fromEnv.companyId,
  };
}

export function isWarehouseSystemConfigured(
  config: MerchantWarehouseConfig,
  systemId: WarehouseSystemId,
) {
  const c = warehouseCredentialsFor(config, systemId);
  return Boolean(c.apiOrigin && c.apiKey);
}

export function parseWarehouseCredentialsJson(raw: unknown): WarehouseCredentialsMap | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as WarehouseCredentialsMap;
}
