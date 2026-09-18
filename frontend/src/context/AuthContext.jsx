import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { login as loginApi, register as registerApi, getProfile } from '@/api/auth.api';
import i18n from '@/i18n';

const AuthContext = createContext(null);

const TOKEN_KEY = 'insightgov_token';
const USER_KEY  = 'insightgov_user';

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Hydrate from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        setToken(savedToken); // Set immediately so API interceptor has it
        try {
          const validUser = await getProfile();
          setUser(validUser);
          localStorage.setItem(USER_KEY, JSON.stringify(validUser));
          if (validUser.preferences) {
            if (validUser.preferences.language) i18n.changeLanguage(validUser.preferences.language);
            if (validUser.preferences.high_contrast) document.documentElement.classList.add('high-contrast');
            else document.documentElement.classList.remove('high-contrast');
      if (validUser.preferences.font_size === 'large') document.documentElement.classList.add('font-large');
      else document.documentElement.classList.remove('font-large');
          }
        } catch (_err) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const persist = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken(token);
    setUser(user);
    if (user.preferences) {
      if (user.preferences.language) i18n.changeLanguage(user.preferences.language);
      if (user.preferences.high_contrast) document.documentElement.classList.add('high-contrast');
      else document.documentElement.classList.remove('high-contrast');
      if (user.preferences.font_size === 'large') document.documentElement.classList.add('font-large');
      else document.documentElement.classList.remove('font-large');
    }
  };

  const login = useCallback(async (credentials) => {
    const data = await loginApi(credentials);
    persist(data.access_token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await registerApi(formData);
    persist(data.access_token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;
