import prisma from '@/lib/prisma';
import {
  buildWarehouseClient,
  type SyncOrdersInput,
  type SyncProductsInput,
  type SyncStockInput,
} from '@/lib/georgian-warehouse';
import {
  isWarehouseSystemConfigured,
  parseWarehouseCredentialsJson,
  type MerchantWarehouseConfig,
} from '@/lib/georgian-warehouse/config';
import type { WarehouseSystemId } from '@/lib/georgian-warehouse/registry';
import { isWarehouseSystemId, warehouseSystemLabel } from '@/lib/georgian-warehouse/registry';

export async function getMerchantWarehouseConfig(
  merchantId: string,
): Promise<MerchantWarehouseConfig> {
  const m = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!m) throw new Error('Merchant not found');

  const defaultSystem = (
    isWarehouseSystemId(m.defaultWarehouseSystem || '') ? m.defaultWarehouseSystem : 'fina'
  ) as WarehouseSystemId;

  return {
    defaultSystem,
    warehouseCredentials: parseWarehouseCredentialsJson(m.warehouseCredentials),
  };
}

export { isWarehouseSystemConfigured };

type SyncKind = 'products' | 'stock' | 'orders';

async function createSyncJob(
  merchantId: string,
  system: WarehouseSystemId,
  kind: SyncKind,
) {
  return prisma.warehouseSyncJob.create({
    data: {
      merchantId,
      system,
      kind,
      status: 'running',
      startedAt: new Date(),
    },
  });
}

async function finishSyncJob(
  jobId: string,
  result: {
    status: 'completed' | 'failed';
    synced?: number;
    result?: object;
    error?: string;
  },
) {
  return prisma.warehouseSyncJob.update({
    where: { id: jobId },
    data: {
      status: result.status,
      syncedCount: result.synced ?? 0,
      result: result.result ? (result.result as object) : undefined,
      error: result.error ?? null,
      finishedAt: new Date(),
    },
  });
}

function resolveSystem(
  config: MerchantWarehouseConfig,
  system?: WarehouseSystemId,
): WarehouseSystemId {
  const resolved =
    system && isWarehouseSystemId(system) ? system : config.defaultSystem;
  if (!isWarehouseSystemConfigured(config, resolved)) {
    throw new Error(
      `${warehouseSystemLabel(resolved, 'en')} is not configured. Add warehouse API credentials.`,
    );
  }
  return resolved;
}

export async function listWarehouseLocations(merchantId: string, system?: WarehouseSystemId) {
  const config = await getMerchantWarehouseConfig(merchantId);
  const resolved = resolveSystem(config, system);
  const client = buildWarehouseClient(config);
  const warehouses = await client.listWarehouses(resolved);
  return { system: resolved, warehouses };
}

export async function runProductsSync(
  merchantId: string,
  input: SyncProductsInput,
  system?: WarehouseSystemId,
) {
  const config = await getMerchantWarehouseConfig(merchantId);
  const resolved = resolveSystem(config, system);
  const job = await createSyncJob(merchantId, resolved, 'products');

  try {
    const client = buildWarehouseClient(config);
    const result = await client.syncProducts(input, resolved);
    await finishSyncJob(job.id, {
      status: 'completed',
      synced: result.synced,
      result: { items: result.items, direction: result.direction },
    });
    return formatSyncJobResponse(job.id, resolved, 'products', result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Products sync failed';
    await finishSyncJob(job.id, { status: 'failed', error: message });
    throw err;
  }
}

export async function runStockSync(
  merchantId: string,
  input: SyncStockInput,
  system?: WarehouseSystemId,
) {
  const config = await getMerchantWarehouseConfig(merchantId);
  const resolved = resolveSystem(config, system);
  const job = await createSyncJob(merchantId, resolved, 'stock');

  try {
    const client = buildWarehouseClient(config);
    const result = await client.syncStock(input, resolved);
    await finishSyncJob(job.id, {
      status: 'completed',
      synced: result.synced,
      result: { items: result.items },
    });
    return formatSyncJobResponse(job.id, resolved, 'stock', result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stock sync failed';
    await finishSyncJob(job.id, { status: 'failed', error: message });
    throw err;
  }
}

export async function runOrdersSync(
  merchantId: string,
  input: SyncOrdersInput,
  system?: WarehouseSystemId,
) {
  const config = await getMerchantWarehouseConfig(merchantId);
  const resolved = resolveSystem(config, system);
  const job = await createSyncJob(merchantId, resolved, 'orders');

  try {
    const client = buildWarehouseClient(config);
    const result = await client.syncOrders(input, resolved);
    await finishSyncJob(job.id, {
      status: 'completed',
      synced: result.synced,
      result: { orders: result.orders },
    });
    return formatSyncJobResponse(job.id, resolved, 'orders', result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Orders sync failed';
    await finishSyncJob(job.id, { status: 'failed', error: message });
    throw err;
  }
}

export async function getWarehouseSyncJob(merchantId: string, jobId: string) {
  const job = await prisma.warehouseSyncJob.findFirst({
    where: { id: jobId, merchantId },
  });
  if (!job) return null;

  return {
    id: job.id,
    object: 'warehouse.sync_job' as const,
    system: job.system,
    kind: job.kind,
    status: job.status,
    synced_count: job.syncedCount,
    error: job.error,
    result: job.result,
    started_at: job.startedAt ? Math.floor(job.startedAt.getTime() / 1000) : null,
    finished_at: job.finishedAt ? Math.floor(job.finishedAt.getTime() / 1000) : null,
    created: Math.floor(job.createdAt.getTime() / 1000),
  };
}

function formatSyncJobResponse(
  jobId: string,
  system: WarehouseSystemId,
  kind: SyncKind,
  result: { synced?: number; items?: unknown; orders?: unknown; direction?: string },
) {
  return {
    id: jobId,
    object: 'warehouse.sync_job' as const,
    system,
    kind,
    status: 'completed' as const,
    synced_count: result.synced ?? 0,
    direction: result.direction,
    items: result.items,
    orders: result.orders,
  };
}
