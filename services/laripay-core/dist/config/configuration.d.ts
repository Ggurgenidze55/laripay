declare const _default: () => {
    port: number;
    nodeEnv: string;
    databaseUrl: string | undefined;
    redisUrl: string;
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    encryptionKey: string;
    corsOrigins: string[];
    workerEnabled: boolean;
    checkoutBaseUrl: string;
    appPublicUrl: string;
    sandboxMode: boolean;
};
export default _default;
