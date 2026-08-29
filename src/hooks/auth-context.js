import { createContext, useContext } from 'react';

/**
 * Kept apart from the provider component so that file exports only a component.
 * React Fast Refresh can then hot-reload the provider without dropping the
 * signed-in session on every save.
 */
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
