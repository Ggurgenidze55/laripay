import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl } from '@/lib/laripay/database-url';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const databaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
  });

globalForPrisma.prisma = prisma;

export default prisma;
