import { getShopSession } from './shopify';

const PAYMENTS_API_VERSION = '2024-10';

const PAYMENT_SESSION_RESOLVE = `
  mutation PaymentSessionResolve($id: ID!, $authorizationExpiresAt: DateTime, $networkTransactionId: String) {
    paymentSessionResolve(
      id: $id
      authorizationExpiresAt: $authorizationExpiresAt
      networkTransactionId: $networkTransactionId
    ) {
      paymentSession {
        id
        state { code }
        nextAction {
          action
          context {
            ... on PaymentSessionActionsRedirect { redirectUrl }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const PAYMENT_SESSION_REJECT = `
  mutation PaymentSessionReject($id: ID!, $reason: PaymentSessionRejectionReasonInput!) {
    paymentSessionReject(id: $id, reason: $reason) {
      paymentSession { id state { code } }
      userErrors { field message }
    }
  }
`;

const REFUND_SESSION_RESOLVE = `
  mutation RefundSessionResolve($id: ID!) {
    refundSessionResolve(id: $id) {
      refundSession { id state { code } }
      userErrors { field message }
    }
  }
`;

const REFUND_SESSION_REJECT = `
  mutation RefundSessionReject($id: ID!, $reason: RefundSessionRejectionReasonInput!) {
    refundSessionReject(id: $id, reason: $reason) {
      refundSession { id state { code } }
      userErrors { field message }
    }
  }
`;

async function paymentsGraphql<T>(
  shopDomain: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const session = await getShopSession(shopDomain);
  if (!session?.accessToken) {
    throw new Error(`No access token for shop ${shopDomain}`);
  }

  const url = `https://${shopDomain}/payments_apps/api/${PAYMENTS_API_VERSION}/graphql.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': session.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors || json));
  }

  return json.data as T;
}

export async function resolvePaymentSession(
  shopDomain: string,
  paymentGid: string,
  options: { authorizationExpiresAt?: Date; networkTransactionId?: string } = {},
) {
  const authorizationExpiresAt =
    options.authorizationExpiresAt?.toISOString() ||
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  return paymentsGraphql<{
    paymentSessionResolve: {
      paymentSession: {
        nextAction?: { context?: { redirectUrl?: string } };
      };
      userErrors: Array<{ message: string }>;
    };
  }>(shopDomain, PAYMENT_SESSION_RESOLVE, {
    id: paymentGid,
    authorizationExpiresAt,
    networkTransactionId: options.networkTransactionId,
  });
}

export async function rejectPaymentSession(shopDomain: string, paymentGid: string, message: string) {
  return paymentsGraphql(shopDomain, PAYMENT_SESSION_REJECT, {
    id: paymentGid,
    reason: { code: 'PROCESSING_ERROR', merchantMessage: message },
  });
}

export async function resolveRefundSession(shopDomain: string, refundGid: string) {
  return paymentsGraphql(shopDomain, REFUND_SESSION_RESOLVE, { id: refundGid });
}

export async function rejectRefundSession(shopDomain: string, refundGid: string, message: string) {
  return paymentsGraphql(shopDomain, REFUND_SESSION_REJECT, {
    id: refundGid,
    reason: { code: 'PROCESSING_ERROR', merchantMessage: message },
  });
}

export function extractShopifyRedirectUrl(resolveResult: {
  paymentSessionResolve?: {
    paymentSession?: { nextAction?: { context?: { redirectUrl?: string } } };
    userErrors?: Array<{ message: string }>;
  };
}): string | null {
  const errors = resolveResult.paymentSessionResolve?.userErrors;
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(', '));
  }
  return resolveResult.paymentSessionResolve?.paymentSession?.nextAction?.context?.redirectUrl || null;
}
