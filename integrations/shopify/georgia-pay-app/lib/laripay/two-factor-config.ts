/**
 * Platform-wide 2FA gate — disabled for now (email + password only).
 * To re-enable later: return platformEnv('REQUIRE_2FA') === '1' and set Resend/Twilio env vars.
 */
export function is2faRequired(): boolean {
  return false;
}
