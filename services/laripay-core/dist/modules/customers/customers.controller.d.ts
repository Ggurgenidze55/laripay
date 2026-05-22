import { RequestWithAuth } from '../../common/types/request.types';
import { CustomersService } from './customers.service';
export declare class CustomersController {
    private readonly customers;
    constructor(customers: CustomersService);
    create(req: RequestWithAuth, body: Record<string, unknown>): Promise<{
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        merchantId: string;
        phone: string | null;
    }>;
    list(req: RequestWithAuth): Promise<{
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        merchantId: string;
        phone: string | null;
    }[]>;
    get(req: RequestWithAuth, id: string): Promise<{
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        merchantId: string;
        phone: string | null;
    }>;
}
