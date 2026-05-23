'use strict';

const { createWarehouseProviders } = require('./providers/warehouse-factory.cjs');
const { isWarehouseSystemId, getWarehouseSystem } = require('./warehouse/registry.cjs');

/**
 * Universal Georgian warehouse sync SDK — Fina, FMG Soft, Optimo, 1C, etc.
 */
class GeorgianWarehouse {
  constructor(config = {}) {
    this.config = config;
    this.defaultSystem = config.defaultSystem || 'fina';
    this.providers = createWarehouseProviders(config);
  }

  listConfiguredSystems() {
    return Object.keys(this.providers);
  }

  _resolveSystem(system) {
    const s = system || this.defaultSystem;
    if (!isWarehouseSystemId(s)) {
      throw new Error(
        `Unknown warehouse system "${s}". Supported: fina, fmg_soft, optimo, one_c, balance, libra, orbit, micros, sap_b1, logista.`,
      );
    }
    const instance = this.providers[s];
    if (!instance) {
      const meta = getWarehouseSystem(s);
      throw new Error(
        `${meta?.name || s} not configured. Add ${meta?.envPrefix || s.toUpperCase()}_API_ORIGIN and _API_KEY.`,
      );
    }
    return s;
  }

  _provider(system) {
    return this.providers[this._resolveSystem(system)];
  }

  async listWarehouses(system) {
    return this._provider(system).listWarehouses();
  }

  async syncProducts(input, system) {
    return this._provider(system).syncProducts(input);
  }

  async syncStock(input, system) {
    return this._provider(system).syncStock(input);
  }

  async syncOrders(input, system) {
    return this._provider(system).syncOrders(input);
  }
}

module.exports = { GeorgianWarehouse };
