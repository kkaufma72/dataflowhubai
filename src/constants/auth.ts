export const POST_AUTH_REDIRECT_KEY = 'dfh_post_auth_redirect';

const isBrowser = () => typeof window !== 'undefined';

export const storePostAuthRedirectPath = (path: string) => {
  if (!isBrowser() || !path) return;
  window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
};

export const getPostAuthRedirectPath = (): string | null => {
  if (!isBrowser()) return null;
  return window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
};

export const clearPostAuthRedirectPath = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
};

export const popPostAuthRedirectPath = (): string => {
  const stored = getPostAuthRedirectPath();
  if (stored && stored.startsWith('/')) {
    clearPostAuthRedirectPath();
    return stored;
  }
  return '/app';
};
