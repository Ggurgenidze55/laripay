'use strict';

const { randomUUID } = require('crypto');

/**
 * Generic warehouse / ERP API provider — products, stock, orders sync.
 */
class WarehouseApiProvider {
  constructor(opts) {
    this.systemId = opts.systemId;
    this.apiOrigin = (opts.apiOrigin || '').replace(/\/$/, '');
    this.apiKey = opts.apiKey || '';
    this.companyId = opts.companyId || opts.merchantId || '';
    this.fetch = opts.fetch || globalThis.fetch;
  }

  _headers() {
    const h = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (this.companyId) h['X-Company-Id'] = this.companyId;
    return h;
  }

  async _request(method, path, body) {
    if (!this.apiOrigin || !this.apiKey) {
      throw new Error(
        `${this.systemId}: warehouse credentials not configured (API origin + API key)`,
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
      throw new Error(`${this.systemId} API error: ${msg}`);
    }
    return data;
  }

  _mockProducts() {
    return [
      { sku: 'SKU-001', name: 'Sample product A', quantity: 42, price_gel: 29.9 },
      { sku: 'SKU-002', name: 'Sample product B', quantity: 15, price_gel: 49.5 },
    ];
  }

  async listWarehouses() {
    try {
      const data = await this._request('GET', '/v1/warehouses');
      return data.warehouses || data.data || data;
    } catch (err) {
      if (process.env[`${this.systemId.toUpperCase()}_SANDBOX_MOCK`] === '1') {
        return [{ id: 'main', name: 'Main warehouse', city: 'Tbilisi' }];
      }
      throw err;
    }
  }

  async syncProducts(input = {}) {
    const payload = {
      direction: input.direction || 'pull',
      since: input.since,
      items: input.items,
      warehouse_id: input.warehouse_id,
    };

    try {
      const data = await this._request('POST', '/v1/sync/products', payload);
      return {
        system: this.systemId,
        direction: payload.direction,
        synced: data.synced ?? data.count ?? (data.items || []).length,
        items: data.items || data.products || [],
        raw: data,
      };
    } catch (err) {
      if (process.env[`${this.systemId.toUpperCase()}_SANDBOX_MOCK`] === '1') {
        const items = this._mockProducts();
        return {
          system: this.systemId,
          direction: payload.direction,
          synced: items.length,
          items,
          raw: { mock: true, error: err instanceof Error ? err.message : String(err) },
        };
      }
      throw err;
    }
  }

  async syncStock(input = {}) {
    const payload = {
      warehouse_id: input.warehouse_id,
      skus: input.skus,
      items: input.items,
      direction: input.direction || 'pull',
    };

    try {
      const data = await this._request('POST', '/v1/sync/stock', payload);
      return {
        system: this.systemId,
        synced: data.synced ?? data.count ?? (data.items || []).length,
        items: data.items || data.stock || [],
        raw: data,
      };
    } catch (err) {
      if (process.env[`${this.systemId.toUpperCase()}_SANDBOX_MOCK`] === '1') {
        const items = this._mockProducts().map((p) => ({
          sku: p.sku,
          quantity: p.quantity,
          warehouse_id: input.warehouse_id || 'main',
        }));
        return {
          system: this.systemId,
          synced: items.length,
          items,
          raw: { mock: true },
        };
      }
      throw err;
    }
  }

  async syncOrders(input = {}) {
    const payload = {
      orders: input.orders || [],
      direction: input.direction || 'push',
    };

    try {
      const data = await this._request('POST', '/v1/sync/orders', payload);
      return {
        system: this.systemId,
        synced: data.synced ?? data.count ?? (data.orders || []).length,
        orders: data.orders || [],
        raw: data,
      };
    } catch (err) {
      if (process.env[`${this.systemId.toUpperCase()}_SANDBOX_MOCK`] === '1') {
        const mockId = randomUUID().slice(0, 8);
        return {
          system: this.systemId,
          synced: (input.orders || []).length,
          orders: (input.orders || []).map((o, i) => ({
            reference: o.reference || o.id || `order-${i}`,
            warehouse_ref: `WH-${mockId}-${i}`,
            status: 'accepted',
          })),
          raw: { mock: true },
        };
      }
      throw err;
    }
  }
}

module.exports = { WarehouseApiProvider };
