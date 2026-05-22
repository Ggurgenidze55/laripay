export function mapOtpDeliveryError(err: unknown): { message: string; status: number } | null {
  const code = err instanceof Error ? err.message : String(err);
  if (code.includes('OTP_EMAIL_NOT_CONFIGURED')) {
    return {
      message:
        'Email sending is not configured. Add LARIPAY_RESEND_API_KEY and LARIPAY_OTP_EMAIL_FROM to .env',
      status: 503,
    };
  }
  if (code.includes('OTP_SMS_NOT_CONFIGURED')) {
    return {
      message:
        'SMS sending is not configured. Add LARIPAY_TWILIO_* variables to .env (Twilio account)',
      status: 503,
    };
  }
  if (code === 'EMAIL_SEND_FAILED') {
    return { message: 'Could not send email. Check Resend domain and API key.', status: 503 };
  }
  if (code === 'SMS_SEND_FAILED') {
    return {
      message: 'Could not send SMS. Check Twilio sender and +995 number format.',
      status: 503,
    };
  }
  return null;
}
