'use strict';

/**
 * Shared Payka / Fintech Pay environment configuration.
 * Load from process.env (dotenv in app entrypoints).
 */

function readEnv(name, fallback = '') {
  const value = process.env[name];
  return value !== undefined && value !== '' ? value : fallback;
}

function isSandbox(envName) {
  return readEnv(envName, 'sandbox').toLowerCase() === 'sandbox';
}

const TBC_ENV = readEnv('TBC_ENV', 'sandbox');
const BOG_ENV = readEnv('BOG_ENV', 'sandbox');

const PAYKA_RETURN_URL = readEnv('PAYKA_RETURN_URL');
const PAYKA_WEBHOOK_URL = readEnv('PAYKA_WEBHOOK_URL');

function getTbcApiOrigin() {
  return isSandbox('TBC_ENV')
    ? 'https://test-api.tbcbank.ge/v1'
    : 'https://api.tbcbank.ge/v1';
}

function getBogApiOrigin() {
  return 'https://api.bog.ge';
}

function getBogOauthOrigin() {
  return 'https://oauth2.bog.ge';
}

/**
 * Customer return URL after bank checkout.
 * @param {string} [paymentId] Appended as ?paymentId=
 */
function buildReturnUrl(paymentId) {
  if (!PAYKA_RETURN_URL) {
    return null;
  }
  const url = new URL(PAYKA_RETURN_URL);
  if (paymentId) {
    url.searchParams.set('paymentId', paymentId);
  }
  return url.toString();
}

/**
 * Bank IPN/callback URL from PAYKA_WEBHOOK_URL (single endpoint for TBC & BOG).
 * @param {'tbc'|'bog'} [_provider] Ignored unless PAYKA_WEBHOOK_PER_PROVIDER=1
 */
function buildWebhookUrl(_provider) {
  if (!PAYKA_WEBHOOK_URL) {
    return null;
  }
  const base = PAYKA_WEBHOOK_URL.replace(/\/$/, '');
  if (_provider && readEnv('PAYKA_WEBHOOK_PER_PROVIDER') === '1') {
    return `${base}/${_provider}`;
  }
  return base;
}

module.exports = {
  TBC_ENV,
  BOG_ENV,
  PAYKA_RETURN_URL,
  PAYKA_WEBHOOK_URL,
  isSandbox,
  isTbcSandbox: () => isSandbox('TBC_ENV'),
  isBogSandbox: () => isSandbox('BOG_ENV'),
  getTbcApiOrigin,
  getBogApiOrigin,
  getBogOauthOrigin,
  buildReturnUrl,
  buildWebhookUrl,
};
