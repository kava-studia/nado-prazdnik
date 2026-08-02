import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CanonicalUser } from '../types';
import { useDemoMode } from './DemoModeContext';
import {
  consumeSupabaseAuthRedirect,
  getSupabaseUserSnapshot,
  requestEmailOtp,
  requestPhoneOtp,
  signOutFromSupabase,
  verifyEmailOtp,
  verifyPhoneOtp
} from '../services/supabaseClient';

export type AuthMode = 'unauthenticated' | 'real' | 'demo' | 'loading';

type IdentityView = {
  provider: 'email' | 'phone' | 'telegram' | 'max' | 'esia';
  providerSubject: string;
  providerUsername?: string;
  linkedAt: string;
  verifiedAt: string;
};

interface AuthContextType {
  user: CanonicalUser | null;
  identities: IdentityView[];
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
  const [identities, setIdentities] = useState<IdentityView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('loading');

  const user = isDemoMode ? demoUser : realUser;
  const isAuthenticated = Boolean(user);

  const refreshSession = async () => {
    if (isDemoMode) {
      setAuthMode('demo');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await consumeSupabaseAuthRedirect();
      const snapshot = await getSupabaseUserSnapshot();
      if (snapshot) {
        setRealUser(snapshot.user);
        setIdentities(snapshot.identities);
        setAuthMode('real');
      } else {
        setRealUser(null);
        setIdentities([]);
        setAuthMode('unauthenticated');
      }
    } catch (error) {
      console.error('Failed to restore Supabase session:', error);
      setRealUser(null);
      setIdentities([]);
      setAuthMode('unauthenticated');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleDemoChange = () => {
      const active = typeof sessionStorage !== 'undefined' && Boolean(sessionStorage.getItem('nado_prazdnik_demo_session'));
      if (active) {
        setAuthMode('demo');
        setIsLoading(false);
      } else {
        void refreshSession();
      }
    };

    window.addEventListener('demo-state-changed', handleDemoChange);
    if (isDemoMode) {
      setAuthMode('demo');
      setIsLoading(false);
    } else {
      void refreshSession();
    }

    return () => window.removeEventListener('demo-state-changed', handleDemoChange);
  }, [isDemoMode]);

  const linkingUnavailable = () => ({
    success: false as const,
    error: 'Безопасная привязка второго способа входа будет включена после настройки провайдеров. Текущая сессия не изменена.'
  });

  const loginWithEmailStart = async (email: string) => {
    if (realUser) return linkingUnavailable();
    try {
      await requestEmailOtp(email);
      return {
        success: true,
        message: 'Письмо отправлено. Откройте ссылку из письма или введите шестизначный код, если он указан.'
      };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Не удалось отправить письмо' };
    }
  };

  const loginWithEmailVerify = async (email: string, code: string) => {
    if (realUser) return linkingUnavailable();
    try {
      const snapshot = await verifyEmailOtp(email, code);
      setRealUser(snapshot.user);
      setIdentities(snapshot.identities);
      setAuthMode('real');
      return { success: true, user: snapshot.user };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Неверный код подтверждения' };
    }
  };

  const loginWithPhoneStart = async (phone: string) => {
    if (realUser) return linkingUnavailable();
    try {
      await requestPhoneOtp(phone);
      return { success: true, message: 'SMS с кодом отправлено' };
    } catch (error: any) {
      return { success: false, error: error?.message || 'SMS-вход пока не настроен' };
    }
  };

  const loginWithPhoneVerify = async (phone: string, code: string) => {
    if (realUser) return linkingUnavailable();
    try {
      const snapshot = await verifyPhoneOtp(phone, code);
      setRealUser(snapshot.user);
      setIdentities(snapshot.identities);
      setAuthMode('real');
      return { success: true, user: snapshot.user };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Неверный SMS-код' };
    }
  };

  const loginWithTelegram = async () => ({
    success: false,
    error: 'Telegram-вход появится после подключения бота и серверной проверки подписанного initData. Демо-режим уже доступен.'
  });

  const loginWithMax = async () => ({
    success: false,
    error: 'MAX-вход пока не подключён к реальному OAuth-провайдеру.'
  });

  const loginWithEsia = async () => ({
    success: false,
    error: 'Вход через Госуслуги будет включён после регистрации системы в ЕСИА.'
  });

  const unlinkProvider = async () => ({
    success: false,
    error: 'Отключение способов входа временно закрыто до запуска защищённого объединения аккаунтов.'
  });

  const mergeAccount = async () => ({
    success: false,
    error: 'Автоматическое объединение аккаунтов отключено: сначала нужен повторный контроль обоих способов входа.'
  });

  const logout = async () => {
    if (isDemoMode) {
      exitDemoMode();
      return;
    }
    await signOutFromSupabase();
    setRealUser(null);
    setIdentities([]);
    setAuthMode('unauthenticated');
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isDemoMode, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isDemoMode, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingScreen />;
  if (isAuthenticated || isDemoMode) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-12 h-12 border-4 border-[var(--gold-primary)] border-t-transparent rounded-full animate-spin mb-4" />
      <div className="font-sans text-lg tracking-wide font-medium">NADO ПРАЗДНИК</div>
      <div className="text-xs text-[var(--text-muted)] mt-1 tracking-widest font-mono uppercase">Загрузка сессии...</div>
    </div>
  );
}
