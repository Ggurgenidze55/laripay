'use strict';

/** Georgian warehouse / ERP / WMS systems for e-commerce stock sync. */
const WAREHOUSE_SYSTEMS = [
  {
    id: 'fina',
    name: 'Fina',
    nameKa: 'Fina',
    status: 'live',
    capabilities: ['products', 'stock', 'orders', 'warehouses'],
    envPrefix: 'FINA',
  },
  {
    id: 'fmg_soft',
    name: 'FMG Soft',
    nameKa: 'FMG Soft',
    status: 'live',
    capabilities: ['products', 'stock', 'orders', 'warehouses'],
    envPrefix: 'FMG_SOFT',
  },
  {
    id: 'optimo',
    name: 'Optimo WMS',
    nameKa: 'Optimo WMS',
    status: 'live',
    capabilities: ['products', 'stock', 'orders', 'warehouses'],
    envPrefix: 'OPTIMO_WMS',
  },
  {
    id: 'one_c',
    name: '1C:Enterprise',
    nameKa: '1C:Enterprise',
    status: 'live',
    capabilities: ['products', 'stock', 'orders'],
    envPrefix: 'ONE_C',
  },
  {
    id: 'balance',
    name: 'Balance',
    nameKa: 'Balance',
    status: 'beta',
    capabilities: ['products', 'stock', 'orders'],
    envPrefix: 'BALANCE',
  },
  {
    id: 'libra',
    name: 'Libra Software',
    nameKa: 'Libra Software',
    status: 'beta',
    capabilities: ['products', 'stock'],
    envPrefix: 'LIBRA',
  },
  {
    id: 'orbit',
    name: 'Orbit ERP',
    nameKa: 'Orbit ERP',
    status: 'beta',
    capabilities: ['products', 'stock', 'orders'],
    envPrefix: 'ORBIT',
  },
  {
    id: 'micros',
    name: 'Micros / Business',
    nameKa: 'Micros / Business',
    status: 'beta',
    capabilities: ['products', 'stock'],
    envPrefix: 'MICROS',
  },
  {
    id: 'sap_b1',
    name: 'SAP Business One',
    nameKa: 'SAP Business One',
    status: 'beta',
    capabilities: ['products', 'stock', 'orders', 'warehouses'],
    envPrefix: 'SAP_B1',
  },
  {
    id: 'logista',
    name: 'Logista WMS',
    nameKa: 'Logista WMS',
    status: 'beta',
    capabilities: ['stock', 'orders', 'warehouses'],
    envPrefix: 'LOGISTA',
  },
];

const SYSTEM_IDS = WAREHOUSE_SYSTEMS.map((s) => s.id);

function isWarehouseSystemId(id) {
  return SYSTEM_IDS.includes(id);
}

function getWarehouseSystem(id) {
  return WAREHOUSE_SYSTEMS.find((s) => s.id === id) || null;
}

module.exports = { WAREHOUSE_SYSTEMS, SYSTEM_IDS, isWarehouseSystemId, getWarehouseSystem };
