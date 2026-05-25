import { getShopSession } from './shopify';

const ADMIN_API_VERSION = '2024-07';

async function adminGraphql<T = unknown>(
  shopDomain: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const session = await getShopSession(shopDomain);
  if (!session?.accessToken) {
    throw new Error(`No access token for shop ${shopDomain}`);
  }

  const url = `https://${shopDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': session.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Shopify Admin API ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Shopify Admin GQL: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

// ── Mark order as paid ──

const ORDER_MARK_AS_PAID = `
  mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
    orderMarkAsPaid(input: $input) {
      order { id name }
      userErrors { field message }
    }
  }
`;

export async function markOrderAsPaid(
  shopDomain: string,
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  type Res = {
    orderMarkAsPaid: {
      order: { id: string; name: string } | null;
      userErrors: { field: string[]; message: string }[];
    };
  };

  const gid = orderId.startsWith('gid://') ? orderId : `gid://shopify/Order/${orderId}`;

  const data = await adminGraphql<Res>(shopDomain, ORDER_MARK_AS_PAID, {
    input: { id: gid },
  });

  const errors = data.orderMarkAsPaid.userErrors;
  if (errors.length > 0) {
    return { success: false, error: errors.map((e) => e.message).join('; ') };
  }
  return { success: true };
}

// ── Register webhook subscription ──

const WEBHOOK_CREATE = `
  mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription { id }
      userErrors { field message }
    }
  }
`;

export async function registerWebhook(
  shopDomain: string,
  topic: string,
  callbackUrl: string,
): Promise<{ success: boolean; error?: string }> {
  type Res = {
    webhookSubscriptionCreate: {
      webhookSubscription: { id: string } | null;
      userErrors: { field: string[]; message: string }[];
    };
  };

  const data = await adminGraphql<Res>(shopDomain, WEBHOOK_CREATE, {
    topic,
    webhookSubscription: {
      callbackUrl,
      format: 'JSON',
    },
  });

  const errors = data.webhookSubscriptionCreate.userErrors;
  if (errors.length > 0) {
    return { success: false, error: errors.map((e) => e.message).join('; ') };
  }
  return { success: true };
}

// ── Get order details ──

const ORDER_QUERY = `
  query getOrder($id: ID!) {
    order(id: $id) {
      id
      name
      email
      displayFinancialStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      customAttributes { key value }
      lineItems(first: 50) {
        edges { node { title quantity } }
      }
    }
  }
`;

export interface ShopifyOrder {
  id: string;
  name: string;
  email: string | null;
  displayFinancialStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  customAttributes: { key: string; value: string | null }[];
  lineItems: { edges: { node: { title: string; quantity: number } }[] };
}

export async function getOrder(
  shopDomain: string,
  orderId: string,
): Promise<ShopifyOrder | null> {
  const gid = orderId.startsWith('gid://') ? orderId : `gid://shopify/Order/${orderId}`;

  const data = await adminGraphql<{ order: ShopifyOrder | null }>(
    shopDomain,
    ORDER_QUERY,
    { id: gid },
  );
  return data.order;
}

// ── Add order note ──

const ORDER_UPDATE = `
  mutation orderUpdate($input: OrderInput!) {
    orderUpdate(input: $input) {
      order { id }
      userErrors { field message }
    }
  }
`;

export async function addOrderNote(
  shopDomain: string,
  orderId: string,
  note: string,
): Promise<void> {
  const gid = orderId.startsWith('gid://') ? orderId : `gid://shopify/Order/${orderId}`;
  await adminGraphql(shopDomain, ORDER_UPDATE, {
    input: { id: gid, note },
  });
}
