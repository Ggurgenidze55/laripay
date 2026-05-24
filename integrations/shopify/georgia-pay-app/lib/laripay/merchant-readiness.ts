export type ReadinessItemId =
  | 'integration'
  | 'test_key'
  | 'webhook'
  | 'bank'
  | 'live_key'
  | 'first_payment';

export type ReadinessItem = {
  id: ReadinessItemId;
  done: boolean;
  optional?: boolean;
  tab: 'integrations' | 'settings' | 'webhooks' | 'overview';
};

export type MerchantReadiness = {
  items: ReadinessItem[];
  ready_for_sandbox: boolean;
  ready_for_live: boolean;
  progress_percent: number;
};

type Input = {
  integration_platform: string | null;
  bank_configured: { tbc: boolean; bog: boolean };
  api_keys: { mode: string; revoked_at?: Date | null }[];
  webhook_count: number;
  payments_succeeded: number;
};

export function buildMerchantReadiness(input: Input): MerchantReadiness {
  const hasTestKey = input.api_keys.some((k) => k.mode === 'test');
  const hasLiveKey = input.api_keys.some((k) => k.mode === 'live');
  const bankOk = input.bank_configured.tbc || input.bank_configured.bog;
  const platformSet = Boolean(
    input.integration_platform && input.integration_platform !== 'api',
  );
  const webhookOk = input.webhook_count > 0;
  const paymentOk = input.payments_succeeded > 0;

  const items: ReadinessItem[] = [
    { id: 'integration', done: platformSet, tab: 'integrations' },
    { id: 'test_key', done: hasTestKey, tab: 'integrations' },
    { id: 'webhook', done: webhookOk, tab: 'webhooks' },
    { id: 'bank', done: bankOk, tab: 'settings' },
    { id: 'live_key', done: hasLiveKey, optional: true, tab: 'integrations' },
    { id: 'first_payment', done: paymentOk, optional: true, tab: 'overview' },
  ];

  const required = items.filter((i) => !i.optional);
  const doneRequired = required.filter((i) => i.done).length;
  const progress_percent = required.length
    ? Math.round((doneRequired / required.length) * 100)
    : 0;

  const ready_for_sandbox = hasTestKey && platformSet;
  const ready_for_live = ready_for_sandbox && bankOk && hasLiveKey && webhookOk;

  return { items, ready_for_sandbox, ready_for_live, progress_percent };
}
