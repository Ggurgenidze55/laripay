'use strict';

const { randomUUID } = require('crypto');

/**
 * Generic bank-hosted redirect provider (Liberty, Cartu, Credo, Basis, Flitt).
 * Credentials via env: {PREFIX}_MERCHANT_ID, {PREFIX}_SECRET_KEY, {PREFIX}_API_ORIGIN
 */
class RedirectBankProvider {
  /**
   * @param {object} opts
   * @param {string} opts.bankId
   * @param {string} opts.apiOrigin
   * @param {string} opts.merchantId
   * @param {string} opts.secretKey
   * @param {typeof fetch} [opts.fetch]
   */
  constructor(opts) {
    this.bankId = opts.bankId;
    this.apiOrigin = (opts.apiOrigin || '').replace(/\/$/, '');
    this.merchantId = opts.merchantId || '';
    this.secretKey = opts.secretKey || '';
    this.fetch = opts.fetch || globalThis.fetch;
  }

  async _request(method, path, body) {
    if (!this.apiOrigin || !this.merchantId || !this.secretKey) {
      throw new Error(
        `${this.bankId}: bank credentials not configured (API origin, merchant id, secret key)`,
      );
    }
    const res = await this.fetch(`${this.apiOrigin}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
        'X-Merchant-Id': this.merchantId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.message || data.error || res.statusText;
      throw new Error(`${this.bankId} API error: ${msg}`);
    }
    return data;
  }

  /**
   * @param {number} amount
   * @param {string} currency
   * @param {string} orderId
   * @param {string} returnUrl
   * @param {object} [options]
   */
  /**
   * Bank-hosted installment checkout (redirect).
   */
  async createInstallmentPayment(amount, currency, orderId, returnUrl, options = {}) {
    const payload = {
      amount,
      currency,
      order_id: String(orderId),
      return_url: returnUrl,
      callback_url: options.callbackUrl,
      success_url: options.successUrl || returnUrl,
      fail_url: options.failUrl || returnUrl,
      description: options.description || `Installment order ${orderId}`,
      payment_mode: 'installment',
      term_months: options.installmentTerms ? Number(options.installmentTerms) : undefined,
    };

    try {
      const data = await this._request('POST', '/v1/installments', payload);
      const redirectUrl =
        data.redirect_url ||
        data.redirectUrl ||
        data.approval_url ||
        data.links?.find?.((l) => l.rel === 'approve')?.uri ||
        data._links?.redirect?.href;

      if (!redirectUrl) {
        throw new Error('Bank did not return installment redirect URL');
      }

      return {
        provider: this.bankId,
        paymentId: data.payment_id || data.id || data.payId || String(orderId),
        status: data.status || 'pending',
        redirectUrl,
        currency: data.currency || currency,
        amount: data.amount ?? amount,
        paymentMode: 'installment',
        raw: data,
      };
    } catch (err) {
      if (process.env[`${this.bankId.toUpperCase()}_SANDBOX_MOCK`] === '1') {
        const mockId = randomUUID();
        return {
          provider: this.bankId,
          paymentId: mockId,
          status: 'pending',
          redirectUrl: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}mock_installment=${this.bankId}&mock_id=${mockId}`,
          currency,
          amount,
          paymentMode: 'installment',
          raw: { mock: true, error: err instanceof Error ? err.message : String(err) },
        };
      }
      throw err;
    }
  }

  async createPayment(amount, currency, orderId, returnUrl, options = {}) {
    if (options.paymentMode === 'installment') {
      return this.createInstallmentPayment(amount, currency, orderId, returnUrl, options);
    }
    const payload = {
      amount,
      currency,
      order_id: String(orderId),
      return_url: returnUrl,
      callback_url: options.callbackUrl,
      success_url: options.successUrl || returnUrl,
      fail_url: options.failUrl || returnUrl,
      description: options.description || `Order ${orderId}`,
    };

    try {
      const data = await this._request('POST', '/v1/payments', payload);
      const redirectUrl =
        data.redirect_url ||
        data.redirectUrl ||
        data.approval_url ||
        data.links?.find?.((l) => l.rel === 'approve')?.uri ||
        data._links?.redirect?.href;

      if (!redirectUrl) {
        throw new Error('Bank did not return redirect URL');
      }

      return {
        provider: this.bankId,
        paymentId: data.payment_id || data.id || data.payId || String(orderId),
        status: data.status || 'pending',
        redirectUrl,
        currency: data.currency || currency,
        amount: data.amount ?? amount,
        raw: data,
      };
    } catch (err) {
      if (process.env[`${this.bankId.toUpperCase()}_SANDBOX_MOCK`] === '1') {
        const mockId = randomUUID();
        return {
          provider: this.bankId,
          paymentId: mockId,
          status: 'pending',
          redirectUrl: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}mock_bank=${this.bankId}&mock_id=${mockId}`,
          currency,
          amount,
          raw: { mock: true, error: err instanceof Error ? err.message : String(err) },
        };
      }
      throw err;
    }
  }

  async checkStatus(paymentId) {
    try {
      const data = await this._request('GET', `/v1/payments/${encodeURIComponent(paymentId)}`);
      return {
        provider: this.bankId,
        paymentId,
        status: data.status || data.order_status?.key || 'unknown',
        raw: data,
      };
    } catch {
      return { provider: this.bankId, paymentId, status: 'unknown', raw: {} };
    }
  }

  async refund(paymentId, amount) {
    const data = await this._request('POST', `/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
      amount: amount ?? undefined,
    });
    return {
      provider: this.bankId,
      refundId: data.refund_id || data.id || paymentId,
      status: data.status || 'pending',
      raw: data,
    };
  }
}

module.exports = { RedirectBankProvider };
