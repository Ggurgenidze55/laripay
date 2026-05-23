export const WAREHOUSE_SYSTEMS = [
  { id: 'fina', name: 'Fina', nameKa: 'Fina', status: 'live' as const, capabilities: ['products', 'stock', 'orders', 'warehouses'] as const, envPrefix: 'FINA' },
  { id: 'fmg_soft', name: 'FMG Soft', nameKa: 'FMG Soft', status: 'live' as const, capabilities: ['products', 'stock', 'orders', 'warehouses'] as const, envPrefix: 'FMG_SOFT' },
  { id: 'optimo', name: 'Optimo WMS', nameKa: 'Optimo WMS', status: 'live' as const, capabilities: ['products', 'stock', 'orders', 'warehouses'] as const, envPrefix: 'OPTIMO_WMS' },
  { id: 'one_c', name: '1C:Enterprise', nameKa: '1C:Enterprise', status: 'live' as const, capabilities: ['products', 'stock', 'orders'] as const, envPrefix: 'ONE_C' },
  { id: 'balance', name: 'Balance', nameKa: 'Balance', status: 'beta' as const, capabilities: ['products', 'stock', 'orders'] as const, envPrefix: 'BALANCE' },
  { id: 'libra', name: 'Libra Software', nameKa: 'Libra Software', status: 'beta' as const, capabilities: ['products', 'stock'] as const, envPrefix: 'LIBRA' },
  { id: 'orbit', name: 'Orbit ERP', nameKa: 'Orbit ERP', status: 'beta' as const, capabilities: ['products', 'stock', 'orders'] as const, envPrefix: 'ORBIT' },
  { id: 'micros', name: 'Micros / Business', nameKa: 'Micros / Business', status: 'beta' as const, capabilities: ['products', 'stock'] as const, envPrefix: 'MICROS' },
  { id: 'sap_b1', name: 'SAP Business One', nameKa: 'SAP Business One', status: 'beta' as const, capabilities: ['products', 'stock', 'orders', 'warehouses'] as const, envPrefix: 'SAP_B1' },
  { id: 'logista', name: 'Logista WMS', nameKa: 'Logista WMS', status: 'beta' as const, capabilities: ['stock', 'orders', 'warehouses'] as const, envPrefix: 'LOGISTA' },
] as const;

export type WarehouseSystemId = (typeof WAREHOUSE_SYSTEMS)[number]['id'];
export type WarehouseCapability = (typeof WAREHOUSE_SYSTEMS)[number]['capabilities'][number];

export type WarehouseCredentials = {
  apiOrigin?: string | null;
  apiKey?: string | null;
  companyId?: string | null;
};

export type WarehouseCredentialsMap = Partial<Record<WarehouseSystemId, WarehouseCredentials>>;

export function isWarehouseSystemId(value: string): value is WarehouseSystemId {
  return WAREHOUSE_SYSTEMS.some((s) => s.id === value);
}

export function getWarehouseSystem(id: string) {
  return WAREHOUSE_SYSTEMS.find((s) => s.id === id) ?? null;
}

export function warehouseSystemLabel(id: WarehouseSystemId, locale: 'en' | 'ka' = 'en'): string {
  const s = getWarehouseSystem(id);
  if (!s) return id;
  return locale === 'ka' ? s.nameKa : s.name;
}
