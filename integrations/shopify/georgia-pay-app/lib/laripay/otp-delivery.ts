import { platformEnv } from '@/lib/laripay-env';

export type OtpPurpose = 'register' | 'login' | 'admin_login' | string;

function purposeLabel(purpose: OtpPurpose): string {
  if (purpose === 'register') return 'account registration';
  if (purpose === 'login') return 'sign-in';
  if (purpose === 'admin_login') return 'admin sign-in';
  return purpose;
}

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(platformEnv('RESEND_API_KEY'));
}

export function isSmsDeliveryConfigured(): boolean {
  const sid = platformEnv('TWILIO_ACCOUNT_SID');
  const token = platformEnv('TWILIO_AUTH_TOKEN');
  const from = platformEnv('TWILIO_FROM') || platformEnv('TWILIO_MESSAGING_SERVICE_SID');
  return Boolean(sid && token && from);
}

export function assertEmailDeliveryConfigured(): void {
  if (!isEmailDeliveryConfigured()) {
    throw new Error(
      'OTP_EMAIL_NOT_CONFIGURED: set LARIPAY_RESEND_API_KEY and LARIPAY_OTP_EMAIL_FROM in .env',
    );
  }
}

export function assertSmsDeliveryConfigured(): void {
  if (!isSmsDeliveryConfigured()) {
    throw new Error(
      'OTP_SMS_NOT_CONFIGURED: set LARIPAY_TWILIO_ACCOUNT_SID, LARIPAY_TWILIO_AUTH_TOKEN, and LARIPAY_TWILIO_FROM (or LARIPAY_TWILIO_MESSAGING_SERVICE_SID)',
    );
  }
}

export async function sendOtpEmail(email: string, code: string, purpose: OtpPurpose): Promise<void> {
  assertEmailDeliveryConfigured();

  const apiKey = platformEnv('RESEND_API_KEY')!;
  const from = platformEnv('OTP_EMAIL_FROM') || 'LariPay <noreply@laripay.ai>';
  const label = purposeLabel(purpose);
  const subject = `LariPay — დადასტურების კოდი / verification code`;

  const text = [
    'LariPay',
    '',
    `თქვენი დადასტურების კოდი (${label}): ${code}`,
    `Your LariPay verification code (${label}): ${code}`,
    '',
    'კოდი ვალიდურია 10 წუთი. არ გაუზიაროთ მესამე პირებს.',
    'Valid for 10 minutes. Do not share this code.',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0e17;color:#e8eaed;padding:24px">
  <div style="max-width:420px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:28px">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#22d3ee">LariPay</p>
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:600">დადასტურების კოდი</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#9ca3af">${label}</p>
    <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:.25em;font-family:ui-monospace,monospace;color:#f9fafb">${code}</p>
    <p style="margin:0;font-size:13px;color:#9ca3af">ვადა: 10 წუთი · Do not share this code.</p>
  </div>
</body>
</html>`.trim();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [email], subject, text, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[laripay][otp] Resend failed:', err);
    throw new Error('EMAIL_SEND_FAILED');
  }
}

/** SMS body — always branded as LariPay (Georgian + code). */
export function formatOtpSmsBody(code: string, purpose: OtpPurpose): string {
  const action =
    purpose === 'register'
      ? 'რეგისტრაცია'
      : purpose === 'admin_login'
        ? 'ადმინ შესვლა'
        : 'შესვლა';
  return `LariPay: თქვენი დადასტურების კოდი (${action}) — ${code}. ვადა 10 წთ. არ გაუზიაროთ.`;
}

export async function sendOtpSms(phone: string, code: string, purpose: OtpPurpose): Promise<void> {
  assertSmsDeliveryConfigured();

  const sid = platformEnv('TWILIO_ACCOUNT_SID')!;
  const token = platformEnv('TWILIO_AUTH_TOKEN')!;
  const messagingServiceSid = platformEnv('TWILIO_MESSAGING_SERVICE_SID');
  const fromNumber = platformEnv('TWILIO_FROM');
  const body = formatOtpSmsBody(code, purpose);

  const params = new URLSearchParams({ To: phone, Body: body });
  if (messagingServiceSid) {
    params.set('MessagingServiceSid', messagingServiceSid);
  } else if (fromNumber) {
    params.set('From', fromNumber);
  } else {
    throw new Error('OTP_SMS_NOT_CONFIGURED');
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[laripay][otp] Twilio failed:', err);
    throw new Error('SMS_SEND_FAILED');
  }
}
