import { RequestWithAuth } from '../../common/types/request.types';
import { WebhooksService } from './webhooks.service';
import { RegisterEndpointDto } from './dto/register-endpoint.dto';
export declare class WebhooksController {
    private readonly webhooks;
    constructor(webhooks: WebhooksService);
    register(req: RequestWithAuth, dto: RegisterEndpointDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        merchantId: string;
        secret: string;
        url: string;
        events: string[];
        enabled: boolean;
    }>;
    listEndpoints(req: RequestWithAuth): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        merchantId: string;
        secret: string;
        url: string;
        events: string[];
        enabled: boolean;
    }[]>;
    listDeliveries(req: RequestWithAuth): Promise<({
        event: {
            id: string;
            createdAt: Date;
            merchantId: string;
            type: string;
            payload: import("@prisma/client/runtime/library").JsonValue;
        };
        endpoint: {
            url: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.WebhookDeliveryStatus;
        eventId: string;
        endpointId: string;
        attempts: number;
        responseCode: number | null;
        lastError: string | null;
        nextRetryAt: Date | null;
        deliveredAt: Date | null;
    })[]>;
}
