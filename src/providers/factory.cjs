'use strict';

const { TbcProvider } = require('./tbc.cjs');
const { BogProvider } = require('./bog.cjs');
const { RedirectBankProvider } = require('./redirect-bank.cjs');
const { getBank } = require('../banks/registry.cjs');

const REDIRECT_BANKS = new Set(['liberty', 'credo', 'cartu', 'basis', 'flitt']);

function envForBank(bankId, suffix) {
  const meta = getBank(bankId);
  const prefix = meta?.envPrefix || bankId.toUpperCase();
  return process.env[`${prefix}_${suffix}`];
}

function buildRedirectProvider(bankId, config) {
  const fromNested = config.bankCredentials?.[bankId] || {};
  return new RedirectBankProvider({
    bankId,
    apiOrigin:
      fromNested.apiOrigin ||
      config[`${bankId}ApiOrigin`] ||
      envForBank(bankId, 'API_ORIGIN'),
    merchantId:
      fromNested.merchantId ||
      config[`${bankId}MerchantId`] ||
      envForBank(bankId, 'MERCHANT_ID'),
    secretKey:
      fromNested.secretKey ||
      config[`${bankId}SecretKey`] ||
      envForBank(bankId, 'SECRET_KEY'),
    fetch: config.fetch,
  });
}

function createProviders(config = {}) {
  const providers = {};

  const tbcSecret = config.tbcSecret || config.tbcClientSecret;
  if (config.tbcClientId && tbcSecret) {
    providers.tbc = new TbcProvider({ ...config, tbcSecret });
  }
  if (config.bogPublicKey && config.bogSecretKey) {
    providers.bog = new BogProvider(config);
  }

  for (const bankId of REDIRECT_BANKS) {
    const p = buildRedirectProvider(bankId, config);
    if (p.apiOrigin && p.merchantId && p.secretKey) {
      providers[bankId] = p;
    }
  }

  return providers;
}

module.exports = { createProviders, REDIRECT_BANKS, buildRedirectProvider };
