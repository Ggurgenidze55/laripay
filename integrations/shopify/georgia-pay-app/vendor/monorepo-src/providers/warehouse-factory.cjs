'use strict';

const { WarehouseApiProvider } = require('./warehouse-api.cjs');
const { WAREHOUSE_SYSTEMS, getWarehouseSystem } = require('../warehouse/registry.cjs');

function envForSystem(systemId, suffix) {
  const meta = getWarehouseSystem(systemId);
  const prefix = meta?.envPrefix || systemId.toUpperCase();
  return process.env[`${prefix}_${suffix}`];
}

function buildWarehouseProvider(systemId, config) {
  const fromNested = config.warehouseCredentials?.[systemId] || {};
  return new WarehouseApiProvider({
    systemId,
    apiOrigin:
      fromNested.apiOrigin ||
      config[`${systemId}ApiOrigin`] ||
      envForSystem(systemId, 'API_ORIGIN'),
    apiKey:
      fromNested.apiKey || config[`${systemId}ApiKey`] || envForSystem(systemId, 'API_KEY'),
    companyId:
      fromNested.companyId ||
      config[`${systemId}CompanyId`] ||
      envForSystem(systemId, 'COMPANY_ID'),
    fetch: config.fetch,
  });
}

function createWarehouseProviders(config = {}) {
  const providers = {};
  for (const sys of WAREHOUSE_SYSTEMS) {
    const p = buildWarehouseProvider(sys.id, config);
    if (p.apiOrigin && p.apiKey) {
      providers[sys.id] = p;
    }
  }
  return providers;
}

module.exports = { createWarehouseProviders, buildWarehouseProvider };
