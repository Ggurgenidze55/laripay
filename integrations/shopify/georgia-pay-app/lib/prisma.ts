import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw || !/^postgres(ql)?:\/\//i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '10');
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '10');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: databaseUrl() ? { db: { url: databaseUrl() } } : undefined,
  });

globalForPrisma.prisma = prisma;

export default prisma;
