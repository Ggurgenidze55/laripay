import { platformEnv } from '@/lib/laripay-env';

/** When LARIPAY_REQUIRE_2FA=0, email/password login works without OTP (temporary / dev). */
export function is2faRequired(): boolean {
  return platformEnv('REQUIRE_2FA') !== '0';
}
