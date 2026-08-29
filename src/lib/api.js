import axios from 'axios';

import { authStorage } from './auth-storage.js';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

export const api = axios.create({ baseURL: BASE_URL, timeout: 20_000 });

/**
 * Normalises everything the API can fail with into one shape, so screens never
 * have to guess whether they are holding an Axios error, a network failure or
 * the API's own error envelope.
 */
export class ApiError extends Error {
  constructor({ code, message, details, status }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function toApiError(error) {
  const payload = error.response?.data?.error;

  if (payload) {
    return new ApiError({
      code: payload.code,
      message: payload.message,
      details: payload.details,
      status: error.response.status,
    });
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError({ code: 'TIMEOUT', message: 'The server took too long to respond.' });
  }

  if (!error.response) {
    return new ApiError({ code: 'NETWORK_ERROR', message: 'Cannot reach the server.' });
  }

  return new ApiError({
    code: 'UNEXPECTED_ERROR',
    message: 'Something went wrong. Please try again.',
    status: error.response.status,
  });
}

api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Access tokens are deliberately short-lived, so an expiry mid-session is
 * normal rather than exceptional. One refresh is attempted per request; if that
 * fails the session is genuinely over and the app is sent back to sign-in.
 *
 * Concurrent 401s share a single refresh promise, so a screen firing five
 * queries at once does not burn five refresh tokens — and since refresh tokens
 * rotate on use, doing so would revoke the whole session as suspected theft.
 */
let refreshPromise = null;

let onSessionExpired = () => {};
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

async function refreshTokens() {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) throw new ApiError({ code: 'NO_REFRESH_TOKEN', message: 'Session expired' });

  // A bare axios call: the instance's interceptor would attach the dead token.
  const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  const tokens = response.data.data.tokens;
  authStorage.setTokens(tokens);
  return tokens.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;

    const isAuthProblem = status === 401 && code !== 'INVALID_CREDENTIALS';
    const canRetry = isAuthProblem && request && !request.__isRetry;

    if (canRetry) {
      request.__isRetry = true;

      try {
        refreshPromise = refreshPromise ?? refreshTokens().finally(() => {
          refreshPromise = null;
        });

        const accessToken = await refreshPromise;
        request.headers.Authorization = `Bearer ${accessToken}`;
        return api(request);
      } catch {
        authStorage.clear();
        onSessionExpired();
        return Promise.reject(
          new ApiError({ code: 'SESSION_EXPIRED', message: 'Your session expired. Please sign in again.', status: 401 }),
        );
      }
    }

    return Promise.reject(toApiError(error));
  },
);

/** Unwraps the API envelope so callers receive the payload directly. */
export async function request(config) {
  const response = await api.request(config);
  return response.data.data;
}

/** For list endpoints: keeps `meta` alongside the rows. */
export async function requestList(config) {
  const response = await api.request(config);
  return { items: response.data.data, meta: response.data.meta ?? null };
}
