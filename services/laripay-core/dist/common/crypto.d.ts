export declare function hashApiKey(fullKey: string): string;
export declare function generateSecretKey(mode: 'test' | 'live'): string;
export declare function generateClientSecret(): string;
export declare function signWebhook(secret: string, timestamp: number, body: string): string;
export declare function verifyWebhook(secret: string, timestamp: string, signature: string, body: string): boolean;
