export type SignatureAlgorithm = 'sha256' | 'sha1';
export declare class SignatureService {
    sign(secret: string, payload: string, algorithm?: SignatureAlgorithm): string;
    signRequest(secret: string, timestamp: number, body: string, algorithm?: SignatureAlgorithm): string;
    verifyRequest(secret: string, timestamp: string, signature: string, body: string, algorithm?: SignatureAlgorithm, toleranceSec?: number): boolean;
    signParamsSha1(secret: string, params: Record<string, string>): string;
}
