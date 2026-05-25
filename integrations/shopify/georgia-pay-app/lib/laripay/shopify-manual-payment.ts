import prisma from '@/lib/prisma';
import { createCheckoutSession } from './checkout';
import { markOrderAsPaid, addOrderNote } from '@/lib/shopify-admin';
import { getMerchantForShop } from './provision-merchant';
import { dispatchMerchantWebhook } from './webhooks-outbound';
import { isServiceEnabled } from './service-gate';

const LARIPAY_GATEWAY_KEYWORDS = ['laripay', 'lari pay', 'georgian bank', 'ქართული ბანკი', 'georgia pay'];

function isLariPayManualGateway(gatewayTitle: string): boolean {
  const lower = gatewayTitle.toLowerCase();
  return LARIPAY_GATEWAY_KEYWORDS.some((kw) => lower.includes(kw));
}

export interface ShopifyOrderWebhookPayload {
  id: number;
  admin_graphql_api_id: string;
  name: string;
  email: string;
  financial_status: string;
  currency: string;
  total_price: string;
  gateway: string;
  payment_gateway_names: string[];
  note: string | null;
  order_status_url: string;
  line_items: { title: string; quantity: number; price: string }[];
}

/**
 * Handle Shopify orders/create webhook for manual "LariPay" payment method.
 * Creates a checkout session and returns a payment link.
 */
export async function handleShopifyManualOrder(
  shopDomain: string,
  order: ShopifyOrderWebhookPayload,
): Promise<{ handled: boolean; paymentUrl?: string; sessionId?: string }> {
  const gatewayNames = order.payment_gateway_names || [];
  const gateway = order.gateway || '';
  const allGateways = [gateway, ...gatewayNames].filter(Boolean);

  const isLariPay = allGateways.some((g) => isLariPayManualGateway(g));
  if (!isLariPay) {
    return { handled: false };
  }

  if (order.financial_status === 'paid') {
    return { handled: false };
  }

  const merchant = await getMerchantForShop(shopDomain);
  if (!merchant) {
    console.error(`[shopify-manual] No LariPay merchant for shop ${shopDomain}`);
    return { handled: false };
  }

  const shopifyActive = await isServiceEnabled(merchant.id, 'shopify');
  if (!shopifyActive) {
    console.warn(`[shopify-manual] Shopify service suspended for merchant ${merchant.slug}`);
    return { handled: false };
  }

  const existing = await prisma.checkoutSession.findFirst({
    where: {
      merchantId: merchant.id,
      clientReferenceId: `shopify_order_${order.id}`,
      status: { in: ['open', 'complete'] },
    },
  });

  if (existing) {
    return {
      handled: true,
      paymentUrl: existing.redirectUrl || undefined,
      sessionId: existing.id,
    };
  }

  const amount = parseFloat(order.total_price);
  if (!amount || amount < 0.01) {
    return { handled: false };
  }

  const host = process.env.HOST || 'https://laripay.vercel.app';
  const successUrl = order.order_status_url || `${host}/payment/success`;

  const session = await createCheckoutSession(merchant, {
    amount,
    currency: order.currency === 'GEL' ? 'GEL' : 'GEL',
    successUrl,
    cancelUrl: `${host}/payment/cancel`,
    clientReferenceId: `shopify_order_${order.id}`,
    idempotencyKey: `shopify_manual_${order.id}`,
    metadata: {
      source: 'shopify_manual_payment',
      shopify_order_id: order.id,
      shopify_order_gid: order.admin_graphql_api_id,
      shopify_order_name: order.name,
      shop_domain: shopDomain,
      customer_email: order.email,
    },
  });

  const paymentUrl = session.url;

  if (paymentUrl) {
    const noteText = `💳 LariPay გადახდის ლინკი: ${paymentUrl}`;
    try {
      await addOrderNote(shopDomain, String(order.id), noteText);
    } catch (err) {
      console.error('[shopify-manual] Failed to add order note:', err);
    }
  }

  await dispatchMerchantWebhook(merchant.id, 'checkout.session.created', {
    id: session.id,
    object: 'checkout.session',
    status: 'open',
    amount: session.amount,
    currency: session.currency,
    url: paymentUrl,
    source: 'shopify_manual_payment',
    shopify_order_name: order.name,
  });

  console.log(
    `[shopify-manual] Created session ${session.id} for order ${order.name} (${shopDomain}), payment URL: ${paymentUrl}`,
  );

  return {
    handled: true,
    paymentUrl: paymentUrl || undefined,
    sessionId: session.id,
  };
}

/**
 * After bank payment succeeds, mark the Shopify order as paid.
 */
export async function markShopifyOrderPaidFromSession(sessionId: string): Promise<boolean> {
  const session = await prisma.checkoutSession.findUnique({
    where: { id: sessionId },
  });

  if (!session?.clientReferenceId?.startsWith('shopify_order_')) {
    return false;
  }

  const metadata = session.metadata ? JSON.parse(session.metadata) : {};
  const shopDomain = metadata.shop_domain;
  const shopifyOrderGid = metadata.shopify_order_gid;
  const shopifyOrderId = metadata.shopify_order_id;

  if (!shopDomain || (!shopifyOrderGid && !shopifyOrderId)) {
    return false;
  }

  const orderId = shopifyOrderGid || String(shopifyOrderId);

  try {
    const result = await markOrderAsPaid(shopDomain, orderId);
    if (result.success) {
      console.log(`[shopify-manual] Marked order ${orderId} as paid on ${shopDomain}`);
    } else {
      console.error(`[shopify-manual] Failed to mark paid: ${result.error}`);
    }
    return result.success;
  } catch (err) {
    console.error('[shopify-manual] markOrderAsPaid error:', err);
    return false;
  }
}
