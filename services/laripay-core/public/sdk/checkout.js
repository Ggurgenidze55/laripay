/**
 * LariPay Embedded Checkout SDK v2
 * Usage: LariPayCheckout.init({ sessionToken, container, onPaymentSuccess, ... })
 */
(function (global) {
  const PRESETS = [
    'black', 'silver', 'vibrant_gold', 'vibrant_silver', 'euphoric_pink',
    'heated_steel', 'navy_shimmer', 'tropical_gold',
  ];

  function applyTheme(el, theme) {
    if (!theme) return;
    const preset = theme.preset || 'navy_shimmer';
    if (PRESETS.includes(preset)) el.dataset.preset = preset;
    if (theme.mode) el.dataset.theme = theme.mode;
    if (theme.layout === 'wallets_only') el.classList.add('wallets_only');
    if (theme.layout === 'compact') el.classList.add('compact');
    if (theme.layout === 'fullscreen') el.classList.add('fullscreen');
    const vars = theme.css_variable || {};
    Object.keys(vars).forEach((k) => el.style.setProperty(k, vars[k]));
  }

  function emit(handlers, name, payload) {
    if (handlers && typeof handlers[name] === 'function') handlers[name](payload);
  }

  async function fetchConfig(apiBase, token) {
    const res = await fetch(`${apiBase}/api/v1/checkout/embedded/${token}/config`);
    if (!res.ok) throw new Error('Failed to load checkout config');
    return res.json();
  }

  const LariPayCheckout = {
    version: '2.0.0',
    init(options) {
      const apiBase = options.apiBase || '';
      const token = options.sessionToken || options.params?.session_token;
      const container = typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container;
      if (!container || !token) throw new Error('container and sessionToken required');

      const handlers = {
        onPaymentSuccess: options.onPaymentSuccess,
        onPaymentFailed: options.onPaymentFailed,
        onValidationError: options.onValidationError,
        onSubmit: options.onSubmit,
        on3DSRedirect: options.on3DSRedirect,
        onWebhookReceived: options.onWebhookReceived,
      };

      const root = document.createElement('div');
      root.className = 'lp-checkout';
      container.appendChild(root);

      fetchConfig(apiBase, token).then((cfg) => {
        applyTheme(root, { ...cfg.theme, ...(options.theme || {}) });
        const methods = (options.methods || cfg.methods || ['card', 'wallets', 'banks']).join(' · ');
        root.innerHTML = `
          <h2 class="lp-title">${(options.messages || cfg.messages || {}).title || 'Pay with LariPay'}</h2>
          <div class="lp-amount">${cfg.amount} ${cfg.currency}</div>
          <div class="lp-methods lp-method-card">${methods}</div>
          <div id="lp-custom-fields"></div>
          <input class="lp-field" placeholder="Card (tokenized)" data-lp="card" />
          <button type="button" class="lp-btn">Pay</button>`;

        const custom = options.fields_custom || cfg.fields_custom || {};
        const customEl = root.querySelector('#lp-custom-fields');
        Object.keys(custom).forEach((key) => {
          const f = custom[key];
          const input = document.createElement(f.type === 'checkbox' ? 'input' : 'input');
          input.className = 'lp-field';
          input.name = key;
          input.placeholder = f.label || key;
          if (f.required) input.required = true;
          if (f.readonly) input.readOnly = true;
          customEl.appendChild(input);
        });

        root.querySelector('.lp-btn').addEventListener('click', async () => {
          emit(handlers, 'onSubmit', { order_id: cfg.order_id });
          try {
            const res = await fetch(`${apiBase}/api/v1/checkout/direct`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: options.apiKey ? `Bearer ${options.apiKey}` : '',
              },
              body: JSON.stringify({ order_id: cfg.order_id, payment_method: 'card' }),
            });
            const data = await res.json();
            if (data.requires_3ds && data.three_ds_url) {
              emit(handlers, 'on3DSRedirect', data);
              window.location.href = data.three_ds_url;
              return;
            }
            if (res.ok) emit(handlers, 'onPaymentSuccess', data);
            else emit(handlers, 'onPaymentFailed', data);
          } catch (e) {
            emit(handlers, 'onValidationError', e);
            emit(handlers, 'onPaymentFailed', e);
          }
        });
      }).catch((e) => emit(handlers, 'onPaymentFailed', e));

      return { destroy() { root.remove(); } };
    },
  };

  global.LariPayCheckout = LariPayCheckout;
})(typeof window !== 'undefined' ? window : globalThis);
