import prisma from '@/lib/prisma';
import { isTransientDbError } from './db-errors';

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, delayMs = 1000 } = {},
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientDbError(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

/** Wait until Postgres accepts connections (Railway free tier cold start). */
export async function ensureDatabaseReady(
  { attempts = 4, delayMs = 1500 } = {},
): Promise<void> {
  await withDbRetry(async () => {
    await prisma.$queryRaw`SELECT 1`;
  }, { attempts, delayMs });
}
