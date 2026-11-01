import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  // Ask the server who we are (the server, not the browser, is the source of truth for roles).
  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me()
      .then(setUser)
      .catch((err) => { if (err.status === 401) tokenStore.clear(); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { tokenStore.clear(); setUser(null); });
    return () => setUnauthorizedHandler(null);
  }, []);

  const finishLogin = useCallback((response) => {
    tokenStore.set(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const login = useCallback(async (email, password) => finishLogin(await api.login({ email, password })), [finishLogin]);
  const register = useCallback(async (payload) => finishLogin(await api.register(payload)), [finishLogin]);
  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* the token is discarded locally either way */ }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user, loading, login, register, logout, isAdmin: user?.role === 'ADMIN',
  }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
