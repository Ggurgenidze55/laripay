"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
class NoopEventTransport {
    constructor() {
        this.logger = new common_1.Logger('EventTransport');
    }
    async publish(topic, event) {
        this.logger.debug(`[noop] ${topic} ${event.type}`, event.payload);
    }
}
let EventsService = class EventsService {
    constructor() {
        this.transport = new NoopEventTransport();
    }
    setTransport(transport) {
        this.transport = transport;
    }
    async logEvent(topic, event) {
        await this.transport.publish(topic, {
            ...event,
            occurredAt: event.occurredAt ?? new Date(),
        });
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)()
], EventsService);
//# sourceMappingURL=events.service.js.map