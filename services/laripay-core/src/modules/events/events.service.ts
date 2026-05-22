import { Injectable, Logger } from '@nestjs/common';

export interface PlatformEvent {
  type: string;
  merchantId?: string;
  entityId?: string;
  payload: Record<string, unknown>;
  occurredAt?: Date;
}

/** Kafka-ready transport; noop until broker is configured. */
export interface EventTransport {
  publish(topic: string, event: PlatformEvent): Promise<void>;
}

class NoopEventTransport implements EventTransport {
  private readonly logger = new Logger('EventTransport');

  async publish(topic: string, event: PlatformEvent): Promise<void> {
    this.logger.debug(`[noop] ${topic} ${event.type}`, event.payload);
  }
}

@Injectable()
export class EventsService {
  private transport: EventTransport = new NoopEventTransport();

  setTransport(transport: EventTransport) {
    this.transport = transport;
  }

  async logEvent(topic: string, event: PlatformEvent): Promise<void> {
    await this.transport.publish(topic, {
      ...event,
      occurredAt: event.occurredAt ?? new Date(),
    });
  }
}
