const ACCESS_TOKEN_KEY = 'vibe.admin.accessToken';
const REFRESH_TOKEN_KEY = 'vibe.admin.refreshToken';
const USER_KEY = 'vibe.admin.user';

/**
 * Tokens live in localStorage because this panel is a separate origin from the
 * API and cannot rely on a same-site cookie. That trades CSRF resistance for
 * XSS exposure, which is the right way round here: the panel renders no
 * user-authored HTML, and every access token is short-lived and revocable
 * server-side.
 */
function read(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private browsing and blocked site data both throw here.
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Losing persistence degrades to a session that ends on reload.
  }
}

export const authStorage = {
  getAccessToken: () => read(ACCESS_TOKEN_KEY),
  getRefreshToken: () => read(REFRESH_TOKEN_KEY),

  getUser() {
    const raw = read(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession({ tokens, user }) {
    write(ACCESS_TOKEN_KEY, tokens?.accessToken ?? null);
    write(REFRESH_TOKEN_KEY, tokens?.refreshToken ?? null);
    write(USER_KEY, user ? JSON.stringify(user) : null);
  },

  setTokens(tokens) {
    write(ACCESS_TOKEN_KEY, tokens?.accessToken ?? null);
    write(REFRESH_TOKEN_KEY, tokens?.refreshToken ?? null);
  },

  clear() {
    write(ACCESS_TOKEN_KEY, null);
    write(REFRESH_TOKEN_KEY, null);
    write(USER_KEY, null);
  },
};
