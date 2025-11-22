export const POST_AUTH_REDIRECT_KEY = 'dfh_post_auth_redirect';
const DEFAULT_POST_AUTH_PATH = '/app';

const isBrowser = () => typeof window !== 'undefined';

const sanitizeRedirectPath = (path?: string | null): string => {
  if (!path) return DEFAULT_POST_AUTH_PATH;

  // Strip hash-only values like '/#' or '/#pricing'
  if (path === '/' || path === '/#' || path.startsWith('/#')) {
    return DEFAULT_POST_AUTH_PATH;
  }

  // Only allow access to authenticated app routes
  if (path.startsWith('/app')) {
    return path;
  }

  return DEFAULT_POST_AUTH_PATH;
};

export const storePostAuthRedirectPath = (path: string) => {
  if (!isBrowser()) return;
  const sanitized = sanitizeRedirectPath(path);
  window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, sanitized);
};

export const getPostAuthRedirectPath = (): string => {
  if (!isBrowser()) return DEFAULT_POST_AUTH_PATH;
  const stored = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  return sanitizeRedirectPath(stored);
};

export const clearPostAuthRedirectPath = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
};

export const popPostAuthRedirectPath = (): string => {
  const destination = getPostAuthRedirectPath();
  clearPostAuthRedirectPath();
  return destination;
};
