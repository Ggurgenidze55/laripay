import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(merchantId: string, body: {
        email?: string;
        name?: string;
        phone?: string;
        metadata?: object;
    }): Promise<{
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        metadata: Prisma.JsonValue | null;
        merchantId: string;
        phone: string | null;
    }>;
    list(merchantId: string): Promise<{
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        metadata: Prisma.JsonValue | null;
        merchantId: string;
        phone: string | null;
    }[]>;
    get(merchantId: string, id: string): Promise<{
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        metadata: Prisma.JsonValue | null;
        merchantId: string;
        phone: string | null;
    }>;
}
