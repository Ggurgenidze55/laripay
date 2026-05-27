export type LariPayRedirectResult = 'success' | 'failed';

/** Append laripay result flag so merchant store can show instant payment outcome. */
export function appendLariPayResult(
  url: string | null | undefined,
  result: LariPayRedirectResult,
): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('laripay', result);
    return parsed.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}laripay=${result}`;
  }
}
