import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: 'local', public_settings: {} });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAuthError(null);
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      try {
        const u = await base44.auth.me();
        if (!cancelled) {
          setUser(u);
          setAppPublicSettings({ id: 'local', public_settings: {} });
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('[BailaFit] auth.me', e);
        }
        if (!cancelled) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPublicSettings(false);
          setIsLoadingAuth(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout();
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    console.info('[BailaFit] Login externo não usado no modo local.');
  };

  const checkAppState = async () => {
    /* compat: recarrega usuário mock */
    try {
      const u = await base44.auth.me();
      setUser(u);
      setAuthError(null);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[BailaFit] checkAppState', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
