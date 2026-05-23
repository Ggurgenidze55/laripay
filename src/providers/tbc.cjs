'use strict';

const { CURRENCY, TBC } = require('../constants.cjs');
const {
  getTbcApiOrigin,
  isTbcSandbox,
  buildWebhookUrl,
} = require('../env.cjs');

class TbcProvider {
  /**
   * @param {object} config
   * @param {string} config.tbcClientId
   * @param {string} config.tbcSecret
   * @param {string} [config.tbcApiKey] - Developer app apikey header
   * @param {string} [config.tbcCallbackUrl]
   * @param {typeof fetch} [config.fetch]
   */
  constructor(config) {
    this.clientId = config.tbcClientId || '';
    this.clientSecret = config.tbcSecret || '';
    this.apiKey = config.tbcApiKey || '';
    this.callbackUrl = config.tbcCallbackUrl || buildWebhookUrl('tbc') || '';
    this.origin = (config.tbcOrigin || getTbcApiOrigin()).replace(/\/$/, '');
    this.sandbox = config.tbcSandbox ?? isTbcSandbox();
    this.fetchFn = config.fetch || globalThis.fetch;
    this._token = null;
    this._tokenExpiresAt = 0;
  }

  async getAccessToken() {
    if (this._token && Date.now() < this._tokenExpiresAt - 60_000) {
      return this._token;
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (this.apiKey) headers.apikey = this.apiKey;

    const response = await this.fetchFn(`${this.origin}${TBC.TOKEN_PATH}`, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`TBC OAuth failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    this._token = data.access_token;
    this._tokenExpiresAt = Date.now() + (Number(data.expires_in) || 86400) * 1000;
    return this._token;
  }

  async request(method, path, body = null) {
    const token = await this.getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    if (this.apiKey) headers.apikey = this.apiKey;

    const init = { method, headers };
    if (body !== null) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await this.fetchFn(`${this.origin}${path}`, init);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = data.developerMessage || data.userMessage || JSON.stringify(data);
      throw new Error(`TBC API error (${response.status}): ${msg}`);
    }

    return data;
  }

  async createPayment(amount, currency, orderId, returnUrl, options = {}) {
    const payload = {
      amount: {
        currency: currency || CURRENCY.CODE,
        total: amount,
      },
      returnurl: returnUrl,
      merchantPaymentId: String(orderId),
      language: options.language || 'EN',
      preAuth: options.preAuth || false,
    };

    if (options.paymentMode === 'installment') {
      payload.methods = ['Installment'];
      payload.allowedPaymentMethods = ['Installment'];
      if (options.installmentTerms) {
        payload.installmentTerm = Number(options.installmentTerms);
      }
    }

    if (this.callbackUrl || options.callbackUrl) {
      payload.callbackUrl = options.callbackUrl || this.callbackUrl;
    }
    if (options.description) payload.description = options.description;

    const data = await this.request('POST', TBC.PAYMENTS_PATH, payload);
    const redirectUrl = (data.links || []).find((l) => l.rel === 'approval_url')?.uri || null;

    return {
      provider: 'tbc',
      paymentId: data.payId,
      status: data.status,
      redirectUrl,
      currency: data.currency || currency || CURRENCY.CODE,
      amount: data.amount ?? amount,
      raw: data,
    };
  }

  async checkStatus(payId) {
    const data = await this.request('GET', `${TBC.PAYMENTS_PATH}/${encodeURIComponent(payId)}`);
    return {
      provider: 'tbc',
      paymentId: data.payId || payId,
      status: data.status,
      currency: data.currency,
      amount: data.amount,
      raw: data,
    };
  }

  async refund(payId, amount) {
    // TBC Checkout uses cancel/return flows; expose cancel as refund entry point
    const data = await this.request('POST', `${TBC.PAYMENTS_PATH}/${encodeURIComponent(payId)}/cancel`, amount != null ? { amount } : null);
    return {
      provider: 'tbc',
      paymentId: payId,
      status: data.status,
      raw: data,
    };
  }
}

module.exports = { TbcProvider };
