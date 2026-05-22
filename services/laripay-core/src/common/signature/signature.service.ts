import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';

export type SignatureAlgorithm = 'sha256' | 'sha1';

@Injectable()
export class SignatureService {
  sign(
    secret: string,
    payload: string,
    algorithm: SignatureAlgorithm = 'sha256',
  ): string {
    return createHmac(algorithm, secret).update(payload).digest('hex');
  }

  signRequest(
    secret: string,
    timestamp: number,
    body: string,
    algorithm: SignatureAlgorithm = 'sha256',
  ): string {
    return this.sign(secret, `${timestamp}.${body}`, algorithm);
  }

  verifyRequest(
    secret: string,
    timestamp: string,
    signature: string,
    body: string,
    algorithm: SignatureAlgorithm = 'sha256',
    toleranceSec = 300,
  ): boolean {
    const ts = parseInt(timestamp, 10);
    if (!ts || Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;
    const expected = this.signRequest(secret, ts, body, algorithm);
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  /** Flitt-style SHA1 merchant signature over sorted params. */
  signParamsSha1(secret: string, params: Record<string, string>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return createHash('sha1').update(`${sorted}${secret}`).digest('hex');
  }
}
