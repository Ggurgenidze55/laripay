"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
let SignatureService = class SignatureService {
    sign(secret, payload, algorithm = 'sha256') {
        return (0, crypto_1.createHmac)(algorithm, secret).update(payload).digest('hex');
    }
    signRequest(secret, timestamp, body, algorithm = 'sha256') {
        return this.sign(secret, `${timestamp}.${body}`, algorithm);
    }
    verifyRequest(secret, timestamp, signature, body, algorithm = 'sha256', toleranceSec = 300) {
        const ts = parseInt(timestamp, 10);
        if (!ts || Math.abs(Date.now() / 1000 - ts) > toleranceSec)
            return false;
        const expected = this.signRequest(secret, ts, body, algorithm);
        try {
            return (0, crypto_1.timingSafeEqual)(Buffer.from(expected), Buffer.from(signature));
        }
        catch {
            return false;
        }
    }
    signParamsSha1(secret, params) {
        const sorted = Object.keys(params)
            .sort()
            .map((k) => `${k}=${params[k]}`)
            .join('&');
        return (0, crypto_1.createHash)('sha1').update(`${sorted}${secret}`).digest('hex');
    }
};
exports.SignatureService = SignatureService;
exports.SignatureService = SignatureService = __decorate([
    (0, common_1.Injectable)()
], SignatureService);
//# sourceMappingURL=signature.service.js.map