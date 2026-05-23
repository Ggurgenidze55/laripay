'use strict';

const { CURRENCY } = require('./constants.cjs');
const { buildReturnUrl, buildWebhookUrl, isTbcSandbox, isBogSandbox } = require('./env.cjs');
const { createProviders } = require('./providers/factory.cjs');
const { TbcProvider } = require('./providers/tbc.cjs');
const { BogProvider } = require('./providers/bog.cjs');
const { verifyWebhook } = require('./webhooks.cjs');
const { isGeorgianBankId, getBank } = require('./banks/registry.cjs');

/**
 * Universal Georgian Payment SDK — all Georgian acquiring rails (bank-hosted card checkout).
 */
class GeorgianPayments {
  /**
   * @param {object} config
   */
  constructor(config = {}) {
    this.config = config;
    this.defaultProvider = config.defaultProvider || 'tbc';
    this.providers = createProviders(config);
  }

  get tbc() {
    return this.providers.tbc || null;
  }

  get bog() {
    return this.providers.bog || null;
  }

  listConfiguredProviders() {
    return Object.keys(this.providers);
  }

  _resolveProvider(provider) {
    const p = provider || this.defaultProvider;
    if (!isGeorgianBankId(p)) {
      throw new Error(
        `Unknown provider "${p}". Supported: tbc, bog, liberty, credo, cartu, basis, flitt.`,
      );
    }
    const instance = this.providers[p];
    if (!instance) {
      const bank = getBank(p);
      throw new Error(
        `${bank?.name || p} not configured. Add merchant credentials or env ${bank?.envPrefix || p.toUpperCase()}_* keys.`,
      );
    }
    return p;
  }

  _providerInstance(providerKey) {
    return this.providers[this._resolveProvider(providerKey)];
  }

  async createPayment(amount, currency, orderId, returnUrl, options = {}) {
    const provider = this._resolveProvider(options.provider);
    const cur = currency || CURRENCY.CODE;
    const enriched = {
      ...options,
      paymentMode: options.paymentMode || 'card',
    };
    return this._providerInstance(provider).createPayment(amount, cur, orderId, returnUrl, enriched);
  }

  /** Installment checkout — bank-hosted credit / pay-in-parts flow. */
  async createInstallmentPayment(amount, currency, orderId, returnUrl, options = {}) {
    return this.createPayment(amount, currency, orderId, returnUrl, {
      ...options,
      paymentMode: 'installment',
    });
  }

  async checkStatus(paymentId, provider) {
    return this._providerInstance(provider).checkStatus(paymentId);
  }

  async refund(paymentId, amount, provider) {
    return this._providerInstance(provider).refund(paymentId, amount);
  }

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
  verifyWebhook,
  TbcProvider,
  BogProvider,
  buildReturnUrl,
  buildWebhookUrl,
  isTbcSandbox,
  isBogSandbox,
};
