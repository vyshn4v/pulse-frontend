import { store } from '../store';
import { setSessionExpired } from '../store/authSlice';
import { apiUrl } from './api';

let interceptorInstalled = false;

export function setupFetchInterceptor() {
  if (interceptorInstalled || typeof window === 'undefined') return;
  interceptorInstalled = true;

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let resolvedInput = input;
    let urlString = '';

    if (typeof input === 'string') {
      if (input.startsWith('/api/')) {
        resolvedInput = apiUrl(input);
      }
      urlString = typeof resolvedInput === 'string' ? resolvedInput : input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else if (input instanceof Request) {
      urlString = input.url;
    }

    // Always include credentials (cookies) for /api requests
    const mergedInit: RequestInit = {
      credentials: 'include',
      ...init,
    };

    const response = await originalFetch(resolvedInput, mergedInit);

    // If any API request returns 401 Unauthorized (except login / auth availability checks)
    if (response.status === 401) {
      const isAuthEndpoint =
        urlString.includes('/api/auth/login') ||
        urlString.includes('/api/auth/available') ||
        urlString.includes('/api/auth/logout') ||
        urlString.includes('/api/auth/me');

      if (!isAuthEndpoint) {
        store.dispatch(setSessionExpired(true));
      }
    }

    return response;
  };
}
