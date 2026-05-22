export interface PlatformEvent {
    type: string;
    merchantId?: string;
    entityId?: string;
    payload: Record<string, unknown>;
    occurredAt?: Date;
}
export interface EventTransport {
    publish(topic: string, event: PlatformEvent): Promise<void>;
}
export declare class EventsService {
    private transport;
    setTransport(transport: EventTransport): void;
    logEvent(topic: string, event: PlatformEvent): Promise<void>;
}
