import { platformEnv } from '@/lib/laripay-env';

/** 2FA only when explicitly enabled with LARIPAY_REQUIRE_2FA=1. */
export function is2faRequired(): boolean {
  return platformEnv('REQUIRE_2FA') === '1';
}
