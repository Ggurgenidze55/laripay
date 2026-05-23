'use strict';

const { createCourierProviders } = require('./providers/courier-factory.cjs');
const { isGeorgianCarrierId, getCarrier } = require('./couriers/registry.cjs');

/**
 * Universal Georgian delivery SDK — rates, shipments, tracking across local couriers.
 */
class GeorgianDelivery {
  constructor(config = {}) {
    this.config = config;
    this.defaultCarrier = config.defaultCarrier || 'delivo';
    this.providers = createCourierProviders(config);
  }

  listConfiguredCarriers() {
    return Object.keys(this.providers);
  }

  _resolveCarrier(carrier) {
    const c = carrier || this.defaultCarrier;
    if (!isGeorgianCarrierId(c)) {
      throw new Error(
        `Unknown carrier "${c}". Supported: delivo, onway, georgian_post, glovo, wolt, bolt, kiwipost, optimo, multiline, dhl, fedex, ups.`,
      );
    }
    const instance = this.providers[c];
    if (!instance) {
      const meta = getCarrier(c);
      throw new Error(
        `${meta?.name || c} not configured. Add ${meta?.envPrefix || c.toUpperCase()}_API_ORIGIN and _API_KEY.`,
      );
    }
    return c;
  }

  _provider(carrier) {
    return this.providers[this._resolveCarrier(carrier)];
  }

  async getRates(input, carrier) {
    return this._provider(carrier).getRates(input);
  }

  async createShipment(input, carrier) {
    return this._provider(carrier).createShipment(input);
  }

  async trackShipment(trackingNumber, carrier) {
    return this._provider(carrier).trackShipment(trackingNumber);
  }
}

module.exports = { GeorgianDelivery };
