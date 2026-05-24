import { platformEnv } from '@/lib/laripay-env';
import { isEmailDeliveryConfigured } from './otp-delivery';

/** 2FA only when LARIPAY_REQUIRE_2FA=1 and email OTP is configured. Default off. */
export function is2faRequired(): boolean {
  if (platformEnv('REQUIRE_2FA') !== '1') return false;
  return isEmailDeliveryConfigured();
}
