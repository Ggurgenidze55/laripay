"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                role: client_1.UserRole.USER,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                action: client_1.AuditAction.CREATE,
                actorId: user.id,
                entityType: 'user',
                entityId: user.id,
                metadata: { event: 'register' },
            },
        });
        return this.issueTokens(user.id, user.email, user.role);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { merchantUsers: { take: 1, orderBy: { createdAt: 'asc' } } },
        });
        if (!user?.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        await this.prisma.auditLog.create({
            data: {
                action: client_1.AuditAction.LOGIN,
                actorId: user.id,
                entityType: 'user',
                entityId: user.id,
            },
        });
        return this.issueTokens(user.id, user.email, user.role, user.merchantUsers[0]?.merchantId);
    }
    async refresh(refreshToken) {
        const tokenHash = this.hashRefreshToken(refreshToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: { include: { merchantUsers: { take: 1, orderBy: { createdAt: 'asc' } } } } },
        });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });
        const user = stored.user;
        return this.issueTokens(user.id, user.email, user.role, user.merchantUsers[0]?.merchantId);
    }
    async issueTokens(userId, email, role, merchantId) {
        const payload = { sub: userId, email, role, merchantId };
        const accessToken = await this.jwt.signAsync(payload);
        const refreshToken = (0, crypto_1.randomBytes)(32).toString('base64url');
        const refreshExpires = this.config.get('jwt.refreshExpiresIn') || '7d';
        const expiresAt = this.addDuration(new Date(), refreshExpires);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: this.hashRefreshToken(refreshToken),
                expiresAt,
            },
        });
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: this.config.get('jwt.expiresIn') || '15m',
            user: { id: userId, email, role, merchantId },
        };
    }
    hashRefreshToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    addDuration(from, duration) {
        const match = /^(\d+)([smhd])$/.exec(duration);
        if (!match)
            return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const ms = unit === 's'
            ? value * 1000
            : unit === 'm'
                ? value * 60 * 1000
                : unit === 'h'
                    ? value * 60 * 60 * 1000
                    : value * 24 * 60 * 60 * 1000;
        return new Date(from.getTime() + ms);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map