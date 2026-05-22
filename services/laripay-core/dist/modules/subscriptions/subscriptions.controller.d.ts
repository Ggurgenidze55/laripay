import { RequestWithAuth } from '../../common/types/request.types';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class SubscriptionsController {
    private readonly subscriptions;
    constructor(subscriptions: SubscriptionsService);
    createPlan(dto: CreatePlanDto): Promise<{
        id: string;
        code: string;
        name: string;
        amount: number;
        currency: string;
        interval: string;
        usage_based: boolean;
        active: boolean;
    }>;
    listPlans(): Promise<{
        id: string;
        code: string;
        name: string;
        amount: number;
        currency: string;
        interval: string;
        usage_based: boolean;
        active: boolean;
    }[]>;
    getPlan(code: string): Promise<{
        id: string;
        code: string;
        name: string;
        amount: number;
        currency: string;
        interval: string;
        usage_based: boolean;
        active: boolean;
    }>;
    updatePlan(code: string, dto: Partial<CreatePlanDto>): Promise<{
        id: string;
        code: string;
        name: string;
        amount: number;
        currency: string;
        interval: string;
        usage_based: boolean;
        active: boolean;
    }>;
    deletePlan(code: string): Promise<{
        deleted: boolean;
    }>;
    create(req: RequestWithAuth, dto: CreateSubscriptionDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        plan: {
            id: string;
            code: string;
            name: string;
            amount: number;
            currency: string;
            interval: string;
            usage_based: boolean;
            active: boolean;
        };
        current_period_start: Date;
        current_period_end: Date;
    }>;
}
