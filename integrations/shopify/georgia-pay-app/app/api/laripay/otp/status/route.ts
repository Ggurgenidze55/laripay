import { laripayJson } from '@/lib/laripay/api-response';
import { isEmailDeliveryConfigured, isSmsDeliveryConfigured } from '@/lib/laripay/otp-delivery';

export const dynamic = 'force-dynamic';

/** Check whether real email/SMS providers are configured (no secrets exposed). */
export async function GET() {
  return laripayJson({
    email: isEmailDeliveryConfigured(),
    sms: isSmsDeliveryConfigured(),
    ready: isEmailDeliveryConfigured() && isSmsDeliveryConfigured(),
  });
}
