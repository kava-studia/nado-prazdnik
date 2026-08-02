import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CanonicalUser, UserSession } from '../types';
import { useDemoMode } from './DemoModeContext';

export type AuthMode = 'unauthenticated' | 'real' | 'demo' | 'loading';

interface AuthContextType {
  user: CanonicalUser | null;
  identities: {
    provider: 'email' | 'phone' | 'telegram' | 'max' | 'esia';
    providerSubject: string;
    providerUsername?: string;
    linkedAt: string;
    verifiedAt: string;
  }[];
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  authMode: AuthMode;
  startDemoMode: (scenario?: any) => void;
  exitDemoMode: () => void;
  loginWithEmailStart: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  loginWithEmailVerify: (email: string, code: string) => Promise<{ success: boolean; user?: CanonicalUser; conflictUserId?: string; error?: string }>;
  loginWithPhoneStart: (phone: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  loginWithPhoneVerify: (phone: string, code: string) => Promise<{ success: boolean; user?: CanonicalUser; conflictUserId?: string; error?: string }>;
  loginWithTelegram: (userDetails: any) => Promise<{ success: boolean; user?: CanonicalUser; error?: string }>;
  loginWithMax: (userDetails: any, simulateNotConfigured?: boolean) => Promise<{ success: boolean; user?: CanonicalUser; error?: string }>;
  loginWithEsia: (userDetails: any, simulateNotConfigured?: boolean) => Promise<{ success: boolean; user?: CanonicalUser; error?: string }>;
  unlinkProvider: (provider: string) => Promise<{ success: boolean; error?: string }>;
  mergeAccount: (conflictUserId: string) => Promise<{ success: boolean; user?: CanonicalUser; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isDemoMode, demoUser, startDemoMode, exitDemoMode } = useDemoMode();

  const [realUser, setRealUser] = useState<CanonicalUser | null>(null);
  const [identities, setIdentities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('loading');

  // Computed values
  const user = isDemoMode ? demoUser : realUser;
  const isAuthenticated = !!user;

  const refreshSession = async () => {
    // If demo mode is active, do not query the real session endpoint
    if (isDemoMode) {
      setAuthMode('demo');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 3000);

    try {
      const res = await fetch('/api/auth/session', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setRealUser(data.user);
        setIdentities(data.identities || []);
        setAuthMode('real');
      } else {
        setRealUser(null);
        setIdentities([]);
        setAuthMode('unauthenticated');
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('Failed to load session / Timeout 3s:', e);
      setRealUser(null);
      setIdentities([]);
      setAuthMode('unauthenticated');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleDemoChange = () => {
      const active = typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('nado_prazdnik_demo_session');
      if (active) {
        setAuthMode('demo');
        setIsLoading(false);
      } else {
        setRealUser(null);
        setIdentities([]);
        setAuthMode('unauthenticated');
        setIsLoading(false);
      }
    };

    window.addEventListener('demo-state-changed', handleDemoChange);

    // Primary initialization check
    const active = typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('nado_prazdnik_demo_session');
    if (active) {
      setAuthMode('demo');
      setIsLoading(false);
    } else {
      refreshSession();
    }

    return () => {
      window.removeEventListener('demo-state-changed', handleDemoChange);
    };
  }, [isDemoMode]);

  const loginWithEmailStart = async (email: string) => {
    try {
      const res = await fetch('/api/auth/email/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Ошибка запроса кода' };
      return { success: true, message: data.message };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка сети' };
    }
  };

  const loginWithEmailVerify = async (email: string, code: string) => {
    try {
      const res = await fetch('/api/auth/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          return { success: false, conflictUserId: data.conflictUserId, error: data.message || 'conflict' };
        }
        return { success: false, error: data.error || 'Неверный код подтверждения' };
      }
      await refreshSession();
      return { success: true, user: data.user };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка сети' };
    }
  };

  const loginWithPhoneStart = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/phone/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Ошибка запроса SMS' };
      return { success: true, message: data.message };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка сети' };
    }
  };

  const loginWithPhoneVerify = async (phone: string, code: string) => {
    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          return { success: false, conflictUserId: data.conflictUserId, error: data.message || 'conflict' };
        }
        return { success: false, error: data.error || 'Неверный код SMS' };
      }
      await refreshSession();
      return { success: true, user: data.user };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка сети' };
    }
  };

  const loginWithTelegram = async (userDetails: any) => {
    try {
      const res = await fetch('/api/auth/telegram/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userDetails })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Не удалось войти через Telegram' };
      await refreshSession();
      return { success: true, user: data.user };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка сети' };
    }
  };

  const loginWithMax = async (userDetails: any, simulateNotConfigured = false) => {
    try {
      const res = await fetch('/api/auth/max/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userDetails, simulateNotConfigured })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Вход через MAX временно недоступен' };
      await refreshSession();
      return { success: true, user: data.user };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка сети' };
    }
  };

  const loginWithEsia = async (userDetails: any, simulateNotConfigured = false) => {
    try {
      const res = await fetch('/api/auth/esia/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userDetails, simulateNotConfigured })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Вход через Госуслуги временно недоступен' };
      await refreshSession();
      return { success: true, user: data.user };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка сети' };
    }
  };

  const unlinkProvider = async (provider: string) => {
    try {
      const res = await fetch('/api/auth/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Не удалось отключить способ входа' };
      await refreshSession();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка сети' };
    }
  };

  const mergeAccount = async (conflictUserId: string) => {
    try {
      const res = await fetch('/api/auth/merge/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflictUserId })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Не удалось объединить аккаунты' };
      await refreshSession();
      return { success: true, user: data.user };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка сети' };
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      exitDemoMode();
    } else {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        console.error('Logout request failed:', e);
      } finally {
        setRealUser(null);
        setIdentities([]);
        setAuthMode('unauthenticated');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        identities,
        isAuthenticated,
        isDemoMode,
        isLoading,
        authMode,
        startDemoMode,
        exitDemoMode,
        loginWithEmailStart,
        loginWithEmailVerify,
        loginWithPhoneStart,
        loginWithPhoneVerify,
        loginWithTelegram,
        loginWithMax,
        loginWithEsia,
        unlinkProvider,
        mergeAccount,
        logout,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ProtectedRoute Wrapper
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isDemoMode, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// PublicOnlyRoute Wrapper
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isDemoMode, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated || isDemoMode) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Full screen auth loader component
export function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-12 h-12 border-4 border-[var(--gold-primary)] border-t-transparent rounded-full animate-spin mb-4" />
      <div className="font-sans text-lg tracking-wide font-medium">NADO ПРАЗДНИК</div>
      <div className="text-xs text-[var(--text-muted)] mt-1 tracking-widest font-mono uppercase">Загрузка сессии...</div>
    </div>
  );
}
