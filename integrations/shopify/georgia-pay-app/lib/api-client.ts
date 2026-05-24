export class ApiResponseError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiResponseError';
    this.status = status;
  }
}

export async function parseApiJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiResponseError('Invalid JSON from server', res.status);
    }
  }

  if (res.status === 500 || res.status === 503) {
    throw new ApiResponseError(
      'Server or database is waking up. Wait 15–20 seconds and try again.',
      res.status,
    );
  }

  if (res.status >= 502) {
    throw new ApiResponseError(
      'Server is waking up or temporarily unavailable. Wait 10–20 seconds and try again.',
      res.status,
    );
  }

  throw new ApiResponseError(
    `Unexpected server response (${res.status}). Refresh the page and try again.`,
    res.status,
  );
}

export function apiErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const err = (data as { error?: { message?: string } }).error;
    if (err?.message) return err.message;
  }
  return fallback;
}

/** Coerce unknown JSON fields to string for React state / sessionStorage. */
export function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

export function formatFetchError(err: unknown, fallback: string): string {
  if (err instanceof ApiResponseError) return err.message;
  if (err instanceof TypeError && /fetch|network|load failed/i.test(err.message)) {
    return 'Connection lost while contacting the server. Wait 10–15 seconds and try again.';
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'Request timed out. The database may still be waking up — try again in a few seconds.';
  }
  return err instanceof Error ? err.message : fallback;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function isDatabaseUnavailable503(res: Response): Promise<boolean> {
  if (res.status !== 503) return false;
  try {
    const data = (await res.clone().json()) as { error?: { code?: string } };
    return data?.error?.code === 'database_unavailable';
  } catch {
    return true;
  }
}

/** Retry auth/API calls while Postgres wakes (Railway free tier). */
export async function fetchWithDbRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  attempt = 0,
  maxAttempts = 4,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const res = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    if (res.status === 503 && attempt < maxAttempts && (await isDatabaseUnavailable503(res))) {
      await sleep(3000);
      return fetchWithDbRetry(input, init, attempt + 1, maxAttempts);
    }
    return res;
  } catch (err) {
    if (attempt < maxAttempts) {
      await sleep(3000);
      return fetchWithDbRetry(input, init, attempt + 1, maxAttempts);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/** Ping health before auth to wake Postgres on cold start. */
export async function warmDatabase(): Promise<void> {
  try {
    await fetch('/api/health', { credentials: 'include', cache: 'no-store' });
  } catch {
    /* ignore — login will retry */
  }
}
