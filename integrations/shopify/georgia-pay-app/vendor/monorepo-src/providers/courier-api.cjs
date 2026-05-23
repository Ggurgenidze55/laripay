'use strict';

const { randomUUID } = require('crypto');

/**
 * Generic courier API provider — rates, shipment create, tracking.
 * Credentials: {PREFIX}_API_ORIGIN, {PREFIX}_API_KEY, optional {PREFIX}_MERCHANT_ID
 */
class CourierApiProvider {
  /**
   * @param {object} opts
   * @param {string} opts.carrierId
   * @param {string} opts.apiOrigin
   * @param {string} opts.apiKey
   * @param {string} [opts.merchantId]
   * @param {typeof fetch} [opts.fetch]
   */
  constructor(opts) {
    this.carrierId = opts.carrierId;
    this.apiOrigin = (opts.apiOrigin || '').replace(/\/$/, '');
    this.apiKey = opts.apiKey || '';
    this.merchantId = opts.merchantId || '';
    this.fetch = opts.fetch || globalThis.fetch;
  }

  _headers() {
    const h = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (this.merchantId) h['X-Merchant-Id'] = this.merchantId;
    return h;
  }

  async _request(method, path, body) {
    if (!this.apiOrigin || !this.apiKey) {
      throw new Error(
        `${this.carrierId}: courier credentials not configured (API origin + API key)`,
      );
    }
    const res = await this.fetch(`${this.apiOrigin}${path}`, {
      method,
      headers: this._headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.message || data.error || res.statusText;
      throw new Error(`${this.carrierId} API error: ${msg}`);
    }
    return data;
  }

  _mockRates(input) {
    const base = 5 + (input.weight_kg || 1) * 2;
    return [
      {
        carrier: this.carrierId,
        service: 'standard',
        price_gel: Math.round(base * 100) / 100,
        currency: 'GEL',
        eta_hours: 24,
        eta_label: '1 business day',
      },
      {
        carrier: this.carrierId,
        service: 'express',
        price_gel: Math.round((base + 4) * 100) / 100,
        currency: 'GEL',
        eta_hours: 4,
        eta_label: 'Same day',
      },
    ];
  }

  async getRates(input) {
    try {
      const data = await this._request('POST', '/v1/rates', {
        from: input.from,
        to: input.to,
        weight_kg: input.weight_kg,
        dimensions_cm: input.dimensions_cm,
        cod_amount: input.cod_amount,
        service: input.service,
      });
      const rates = data.rates || data.data || data;
      if (Array.isArray(rates) && rates.length) {
        return rates.map((r) => ({
          carrier: this.carrierId,
          service: r.service || r.service_type || 'standard',
          price_gel: r.price_gel ?? r.price ?? r.amount,
          currency: r.currency || 'GEL',
          eta_hours: r.eta_hours ?? r.etaHours,
          eta_label: r.eta_label ?? r.etaLabel ?? r.eta,
        }));
      }
      throw new Error('Carrier did not return rates');
    } catch (err) {
      if (process.env[`${this.carrierId.toUpperCase()}_SANDBOX_MOCK`] === '1') {
        return this._mockRates(input);
      }
      throw err;
    }
  }

  async createShipment(input) {
    const payload = {
      from: input.from,
      to: input.to,
      weight_kg: input.weight_kg,
      dimensions_cm: input.dimensions_cm,
      cod_amount: input.cod_amount,
      service: input.service || 'standard',
      reference: input.reference,
      description: input.description,
      items: input.items,
    };

    try {
      const data = await this._request('POST', '/v1/shipments', payload);
      return {
        carrier: this.carrierId,
        shipmentId: data.shipment_id || data.id || data.tracking_number,
        trackingNumber: data.tracking_number || data.trackingNumber || data.id,
        trackingUrl: data.tracking_url || data.trackingUrl,
        labelUrl: data.label_url || data.labelUrl,
        priceGel: data.price_gel ?? data.price,
        status: data.status || 'created',
        raw: data,
      };
    } catch (err) {
      if (process.env[`${this.carrierId.toUpperCase()}_SANDBOX_MOCK`] === '1') {
        const mockId = randomUUID().slice(0, 12).toUpperCase();
        return {
          carrier: this.carrierId,
          shipmentId: mockId,
          trackingNumber: `${this.carrierId.toUpperCase()}-${mockId}`,
          trackingUrl: null,
          labelUrl: null,
          priceGel: this._mockRates(input)[0].price_gel,
          status: 'created',
          raw: { mock: true, error: err instanceof Error ? err.message : String(err) },
        };
      }
      throw err;
    }
  }

  async trackShipment(trackingNumber) {
    try {
      const data = await this._request(
        'GET',
        `/v1/shipments/${encodeURIComponent(trackingNumber)}/track`,
      );
      return {
        carrier: this.carrierId,
        trackingNumber,
        status: data.status || data.state || 'unknown',
        events: data.events || data.history || [],
        raw: data,
      };
    } catch (err) {
      if (process.env[`${this.carrierId.toUpperCase()}_SANDBOX_MOCK`] === '1') {
        return {
          carrier: this.carrierId,
          trackingNumber,
          status: 'in_transit',
          events: [{ at: new Date().toISOString(), status: 'in_transit', note: 'Mock tracking' }],
          raw: { mock: true },
        };
      }
      throw err;
    }
  }
}

module.exports = { CourierApiProvider };
