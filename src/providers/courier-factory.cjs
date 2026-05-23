'use strict';

const { CourierApiProvider } = require('./courier-api.cjs');
const { GEORGIAN_CARRIERS, getCarrier } = require('../couriers/registry.cjs');

const ALL_CARRIER_IDS = GEORGIAN_CARRIERS.map((c) => c.id);

function envForCarrier(carrierId, suffix) {
  const meta = getCarrier(carrierId);
  const prefix = meta?.envPrefix || carrierId.toUpperCase();
  return process.env[`${prefix}_${suffix}`];
}

function buildCourierProvider(carrierId, config) {
  const fromNested = config.carrierCredentials?.[carrierId] || {};
  return new CourierApiProvider({
    carrierId,
    apiOrigin:
      fromNested.apiOrigin ||
      config[`${carrierId}ApiOrigin`] ||
      envForCarrier(carrierId, 'API_ORIGIN'),
    apiKey:
      fromNested.apiKey || config[`${carrierId}ApiKey`] || envForCarrier(carrierId, 'API_KEY'),
    merchantId:
      fromNested.merchantId ||
      config[`${carrierId}MerchantId`] ||
      envForCarrier(carrierId, 'MERCHANT_ID'),
    fetch: config.fetch,
  });
}

function createCourierProviders(config = {}) {
  const providers = {};
  for (const carrierId of ALL_CARRIER_IDS) {
    const p = buildCourierProvider(carrierId, config);
    if (p.apiOrigin && p.apiKey) {
      providers[carrierId] = p;
    }
  }
  return providers;
}

module.exports = { createCourierProviders, buildCourierProvider, ALL_CARRIER_IDS };
