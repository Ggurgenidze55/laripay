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
      res.status === 503
        ? 'Database is unavailable. Check server configuration or try again shortly.'
        : 'Server error. Refresh the page and try again.',
      res.status,
    );
  }

  if (res.status >= 502) {
    throw new ApiResponseError(
      'Server is temporarily unavailable. Try again in a few seconds.',
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
    return 'Connection lost while contacting the server. Try again.';
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'Request timed out. Try again.';
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
    return (
      data?.error?.code === 'database_unavailable' ||
      data?.error?.code === 'database_misconfigured'
    );
  } catch {
    return true;
  }
}

/** Single auth request with at most one quick retry on cold Postgres. */
export async function fetchWithDbRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  attempt = 0,
  maxAttempts = 2,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    if (
      res.status === 503 &&
      attempt < maxAttempts &&
      (await isDatabaseUnavailable503(res))
    ) {
      const data = (await res.clone().json()) as { error?: { code?: string } };
      if (data?.error?.code === 'database_misconfigured') {
        return res;
      }
      await sleep(1500);
      return fetchWithDbRetry(input, init, attempt + 1, maxAttempts);
    }
    return res;
  } catch (err) {
    if (attempt < maxAttempts) {
      await sleep(1500);
      return fetchWithDbRetry(input, init, attempt + 1, maxAttempts);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
