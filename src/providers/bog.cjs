'use strict';

const { CURRENCY, TBC } = require('../constants.cjs');
const {
  getBogApiOrigin,
  getBogOauthOrigin,
  isBogSandbox,
  buildWebhookUrl,
} = require('../env.cjs');

class BogProvider {
  /**
   * @param {object} config
   * @param {string} config.bogPublicKey - Basic auth username (public_key)
   * @param {string} config.bogSecretKey - Basic auth password (secret_key)
   * @param {string} [config.bogCallbackUrl]
   * @param {typeof fetch} [config.fetch]
   */
  constructor(config) {
    this.publicKey = config.bogPublicKey || '';
    this.secretKey = config.bogSecretKey || '';
    this.callbackUrl = config.bogCallbackUrl || buildWebhookUrl('bog') || '';
    this.apiOrigin = (config.bogOrigin || getBogApiOrigin()).replace(/\/$/, '');
    this.oauthOrigin = (config.bogOauthOrigin || getBogOauthOrigin()).replace(/\/$/, '');
    this.sandbox = config.bogSandbox ?? isBogSandbox();
    this.fetchFn = config.fetch || globalThis.fetch;
    this._token = null;
    this._tokenExpiresAt = 0;
  }

  basicAuthHeader() {
    const credentials = Buffer.from(`${this.publicKey}:${this.secretKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async getAccessToken() {
    if (this._token && Date.now() < this._tokenExpiresAt - 60_000) {
      return this._token;
    }

    const body = new URLSearchParams({ grant_type: 'client_credentials' });

    const response = await this.fetchFn(`${this.oauthOrigin}${BOG.OAUTH_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: this.basicAuthHeader(),
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`BOG auth failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    this._token = data.access_token;
    let expiresIn = Number(data.expires_in) || 3600;
    if (expiresIn > 86400) expiresIn = 3600;
    this._tokenExpiresAt = Date.now() + expiresIn * 1000;
    return this._token;
  }

  async request(method, path, body = null, extraHeaders = {}) {
    const token = await this.getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...extraHeaders,
    };

    const init = { method, headers };
    if (body !== null) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await this.fetchFn(`${this.apiOrigin}${path}`, init);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`BOG API error (${response.status}): ${JSON.stringify(data)}`);
    }

    return data;
  }

  async createPayment(amount, currency, orderId, returnUrl, options = {}) {
    const callbackUrl = options.callbackUrl || this.callbackUrl;
    if (!callbackUrl) {
      throw new Error('BOG requires callbackUrl (set bogCallbackUrl in config or pass in options)');
    }

    const payload = {
      callback_url: callbackUrl,
      external_order_id: String(orderId),
      purchase_units: {
        currency: currency || CURRENCY.CODE,
        total_amount: amount,
        basket: options.basket || [{
          product_id: String(orderId),
          quantity: 1,
          unit_price: amount,
        }],
      },
      redirect_urls: {
        success: options.successUrl || returnUrl,
        fail: options.failUrl || returnUrl,
      },
    };

    if (options.paymentMode === 'installment') {
      payload.payment_method = ['installment'];
      payload.meta = {
        ...(payload.meta || {}),
        installment: {
          enabled: true,
          term_months: options.installmentTerms ? Number(options.installmentTerms) : undefined,
        },
      };
    }

    const headers = {};
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    if (options.language) headers['Accept-Language'] = options.language;

    const data = await this.request('POST', BOG.ORDERS_PATH, payload, headers);

    return {
      provider: 'bog',
      paymentId: data.id,
      status: 'created',
      redirectUrl: data._links?.redirect?.href || null,
      currency: currency || CURRENCY.CODE,
      amount,
      raw: data,
    };
  }

  async checkStatus(orderId) {
    const data = await this.request('GET', `${BOG.RECEIPT_PATH}/${encodeURIComponent(orderId)}`);
    return {
      provider: 'bog',
      paymentId: data.order_id || orderId,
      status: data.order_status?.key || data.order_status,
      currency: data.purchase_units?.currency_code || CURRENCY.CODE,
      amount: parseFloat(data.purchase_units?.transfer_amount || data.purchase_units?.request_amount || 0),
      raw: data,
    };
  }

  async refund(orderId, amount) {
    const path = `${BOG.REFUND_PATH}/${encodeURIComponent(orderId)}/refund`;
    const body = amount != null ? { amount } : {};
    const data = await this.request('POST', path, body);
    return {
      provider: 'bog',
      paymentId: orderId,
      status: 'refund_requested',
      amount: amount ?? null,
      raw: data,
    };
  }
}

module.exports = { BogProvider };
