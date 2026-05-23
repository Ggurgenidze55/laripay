// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GeorgianWarehouse } = require('@georgian-warehouse');

import type { MerchantWarehouseConfig } from '@/lib/georgian-warehouse/config';

export function buildWarehouseClient(config: MerchantWarehouseConfig) {
  return new GeorgianWarehouse({
    defaultSystem: config.defaultSystem,
    warehouseCredentials: config.warehouseCredentials || undefined,
  });
}

export type SyncProductsInput = {
  direction?: 'pull' | 'push';
  since?: string;
  warehouse_id?: string;
  items?: Array<Record<string, unknown>>;
};

export type SyncStockInput = {
  direction?: 'pull' | 'push';
  warehouse_id?: string;
  skus?: string[];
  items?: Array<{ sku: string; quantity: number }>;
};

export type SyncOrdersInput = {
  direction?: 'push' | 'pull';
  orders?: Array<Record<string, unknown>>;
};

export type { MerchantWarehouseConfig };
