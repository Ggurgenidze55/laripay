import { platformEnv } from '@/lib/laripay-env';
import { isEmailDeliveryConfigured } from './otp-delivery';

/** 2FA off when LARIPAY_REQUIRE_2FA=0, or when email OTP is not configured yet. */
export function is2faRequired(): boolean {
  const flag = platformEnv('REQUIRE_2FA');
  if (flag === '0') return false;
  if (flag === '1') return true;
  return isEmailDeliveryConfigured();
}
