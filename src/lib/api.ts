/**
 * PULSE OS v3 - Backend API Base Configuration
 * In Production: Set VITE_API_URL in Cloudflare Pages / .env.production
 * Example: VITE_API_URL=https://api-pulse.vyshnavpc.com
 */

export const BACKEND_URL = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return BACKEND_URL ? `${BACKEND_URL}${path}` : path;
}
