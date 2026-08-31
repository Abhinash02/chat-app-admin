import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { AuthContext } from './auth-context.js';
import { request, setSessionExpiredHandler } from '../lib/api.js';
import { authStorage } from '../lib/auth-storage.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [isRestoring, setIsRestoring] = useState(() => Boolean(authStorage.getAccessToken()));

  const signOut = useCallback(async ({ silent = false } = {}) => {
    const refreshToken = authStorage.getRefreshToken();

    authStorage.clear();
    disconnectSocket();
    setUser(null);

    // Revoking server-side is best effort: the local session is already gone,
    // and a failed call must not trap the operator in a signed-in shell.
    if (refreshToken) {
      request({ method: 'POST', url: '/auth/logout', data: { refreshToken } }).catch(() => undefined);
    }

    if (!silent) toast.success('Signed out');
  }, []);

  /**
   * A stored token may have been revoked while the tab was closed, so the
   * session is re-validated against the server before the shell renders.
   * Trusting localStorage alone would flash the panel to someone whose access
   * was already withdrawn.
   */
  useEffect(() => {
    if (!authStorage.getAccessToken()) return;

    let cancelled = false;

    request({ method: 'GET', url: '/auth/me' })
      .then((freshUser) => {
        if (cancelled) return;
        setUser(freshUser);
        authStorage.setUser(freshUser);
        connectSocket();
      })
      .catch(() => {
        if (!cancelled) authStorage.clear();
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The API client cannot import this context, so it hands back control here.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      disconnectSocket();
      toast.error('Your session expired. Please sign in again.');
    });
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const result = await request({
      method: 'POST',
      url: '/admin/login',
      data: { email, password },
    });

    authStorage.setSession({ tokens: result.tokens, user: result.user });
    setUser(result.user);
    connectSocket();

    return result.user;
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isRestoring, signIn, signOut }),
    [user, isRestoring, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
