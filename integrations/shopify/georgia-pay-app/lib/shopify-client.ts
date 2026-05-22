export function getAppUrl(path = '') {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  const base = process.env.NEXT_PUBLIC_HOST || process.env.HOST || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
