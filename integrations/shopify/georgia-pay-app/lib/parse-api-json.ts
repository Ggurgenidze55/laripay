/** Safe JSON parse for fetch responses (avoids crash on empty 500 bodies). */
export async function parseApiJson<T = Record<string, unknown>>(
  res: Response,
): Promise<{ data: T; ok: boolean }> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      ok: false,
      data: {
        error: { message: res.ok ? 'Empty response' : `Request failed (${res.status})` },
      } as T,
    };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return {
      ok: false,
      data: {
        error: { message: 'Invalid JSON from server' },
      } as T,
    };
  }
}
