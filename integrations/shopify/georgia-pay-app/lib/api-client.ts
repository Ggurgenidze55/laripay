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

/** Retry auth/API calls while Postgres wakes (Railway free tier). */
export async function fetchWithDbRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  attempt = 0,
  maxAttempts = 8,
): Promise<Response> {
  const res = await fetch(input, init);
  const retryable =
    res.status === 503 ||
    (res.status >= 500 && res.status !== 501);
  if (retryable && attempt < maxAttempts) {
    await new Promise((r) => setTimeout(r, 4000));
    return fetchWithDbRetry(input, init, attempt + 1, maxAttempts);
  }
  return res;
}
