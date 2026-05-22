# LariPay.ai production image (build from repo root)
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY integrations/shopify/georgia-pay-app/package.json integrations/shopify/georgia-pay-app/package-lock.json ./
COPY integrations/shopify/georgia-pay-app/prisma ./prisma
COPY integrations/shopify/georgia-pay-app/prisma/schema.postgresql.prisma ./prisma/schema.postgresql.prisma
RUN npm ci

FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY integrations/shopify/georgia-pay-app ./
# next.config alias resolves to /src (../../../src from /app)
COPY src /src
RUN mkdir -p public
# Production uses PostgreSQL schema + versioned migrations
RUN cp prisma/schema.postgresql.prisma prisma/schema.prisma
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S laripay && adduser -S laripay -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=laripay:laripay /app/.next/standalone ./
COPY --from=builder --chown=laripay:laripay /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /src ./node_modules/@georgian-payments
RUN mv ./node_modules/@georgian-payments/georgian-payments.cjs ./node_modules/@georgian-payments/index.cjs && \
  printf '{"name":"@georgian-payments","main":"index.cjs"}' > ./node_modules/@georgian-payments/package.json
COPY deploy/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh
USER laripay
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/entrypoint.sh"]
