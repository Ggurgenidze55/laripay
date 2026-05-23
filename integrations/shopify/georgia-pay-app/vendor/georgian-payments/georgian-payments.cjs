'use strict';

const { CURRENCY } = require('./constants.cjs');
const { buildReturnUrl, buildWebhookUrl, isTbcSandbox, isBogSandbox } = require('./env.cjs');
const { TbcProvider } = require('./providers/tbc.cjs');
const { BogProvider } = require('./providers/bog.cjs');
const { verifyWebhook } = require('./webhooks.cjs');

/**
 * Universal Georgian Payment SDK — TBC Pay + BOG Pay
 *
 * @example
 * const payments = new GeorgianPayments({
 *   tbcClientId: process.env.TBC_CLIENT_ID,
 *   tbcSecret: process.env.TBC_CLIENT_SECRET,
 *   bogPublicKey: process.env.BOG_PUBLIC_KEY,
 *   bogSecretKey: process.env.BOG_SECRET_KEY,
 *   defaultProvider: 'tbc',
 * });
 */
class GeorgianPayments {
  /**
   * @param {object} config
   * @param {string} [config.tbcClientId]
   * @param {string} [config.tbcSecret]
   * @param {string} [config.tbcApiKey]
   * @param {string} [config.tbcCallbackUrl]
   * @param {string} [config.bogPublicKey]
   * @param {string} [config.bogSecretKey]
   * @param {string} [config.bogCallbackUrl]
   * @param {'tbc'|'bog'} [config.defaultProvider='tbc']
   * @param {typeof fetch} [config.fetch]
   */
  constructor(config = {}) {
    this.config = config;
    this.defaultProvider = config.defaultProvider || 'tbc';
    this.tbc = config.tbcClientId && config.tbcSecret
      ? new TbcProvider(config)
      : null;
    this.bog = config.bogPublicKey && config.bogSecretKey
      ? new BogProvider(config)
      : null;
  }

  _resolveProvider(provider) {
    const p = provider || this.defaultProvider;
    if (p === 'tbc' && !this.tbc) {
      throw new Error('TBC provider not configured (tbcClientId + tbcSecret required)');
    }
    if (p === 'bog' && !this.bog) {
      throw new Error('BOG provider not configured (bogPublicKey + bogSecretKey required)');
    }
    if (p !== 'tbc' && p !== 'bog') {
      throw new Error(`Unknown provider "${p}". Use "tbc" or "bog".`);
    }
    return p;
  }

  /**
   * Create a payment / order.
   * @param {number} amount
   * @param {string} [currency='GEL']
   * @param {string|number} orderId
   * @param {string} returnUrl
   * @param {object} [options]
   * @param {'tbc'|'bog'} [options.provider]
   */
  async createPayment(amount, currency, orderId, returnUrl, options = {}) {
    const provider = this._resolveProvider(options.provider);
    const cur = currency || CURRENCY.CODE;

    if (provider === 'tbc') {
      return this.tbc.createPayment(amount, cur, orderId, returnUrl, options);
    }
    return this.bog.createPayment(amount, cur, orderId, returnUrl, options);
  }

  /**
   * Check payment status.
   * @param {string} paymentId
   * @param {'tbc'|'bog'} provider
   */
  async checkStatus(paymentId, provider) {
    const p = this._resolveProvider(provider);
    if (p === 'tbc') return this.tbc.checkStatus(paymentId);
    return this.bog.checkStatus(paymentId);
  }

  /**
   * Refund a payment (full or partial).
   * @param {string} paymentId
   * @param {number|null} amount - Omit/null for full refund (BOG)
   * @param {'tbc'|'bog'} provider
   */
  async refund(paymentId, amount, provider) {
    const p = this._resolveProvider(provider);
    if (p === 'tbc') return this.tbc.refund(paymentId, amount);
    return this.bog.refund(paymentId, amount);
  }

  /**
   * Verify and parse an incoming webhook.
   * @param {'tbc'|'bog'} provider
   * @param {string|Buffer|object} payload - Raw body (string/Buffer) preferred
   * @param {string} signature - HMAC hex (TBC) or base64 RSA (BOG)
   * @returns {{ valid: boolean, error?: string, paymentId?: string, orderId?: string, payload?: object }}
   */
  handleWebhook(provider, payload, signature) {
    return verifyWebhook(provider, payload, signature, {
      secret: this.config.tbcSecret,
      tbcSecret: this.config.tbcSecret,
      publicKey: this.config.bogCallbackPublicKey,
    });
  }
}

module.exports = {
  GeorgianPayments,
  CURRENCY,
  TbcProvider,
  BogProvider,
  verifyWebhook,
  buildReturnUrl,
  buildWebhookUrl,
  isTbcSandbox,
  isBogSandbox,
};
