import { CanonicalUser } from '../types';

const DEFAULT_SUPABASE_URL = 'https://vucmteoammbosixqwyme.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_462HIezfoaK5Ke1li4QdZA_ueOnerL1';
const SESSION_STORAGE_KEY = 'nado_prazdnik_supabase_session_v1';

const env = (import.meta as any).env || {};
export const SUPABASE_URL = String(env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
export const SUPABASE_PUBLISHABLE_KEY = String(
  env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY
);

interface SupabaseAuthUser {
  id: string;
  email?: string;
  phone?: string;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  user?: SupabaseAuthUser;
}

export interface SupabaseIdentityView {
  provider: 'email' | 'phone' | 'telegram' | 'max' | 'esia';
  providerSubject: string;
  providerUsername?: string;
  linkedAt: string;
  verifiedAt: string;
}

export interface SupabaseUserSnapshot {
  user: CanonicalUser;
  identities: SupabaseIdentityView[];
}

export interface AuthAuditView {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}

function authHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json'
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data?.msg || data?.message || data?.error_description || data?.error || fallback;
  } catch {
    return fallback;
  }
}

function normalizeSession(raw: any): SupabaseSession {
  const expiresIn = Number(raw?.expires_in || 3600);
  return {
    access_token: String(raw?.access_token || ''),
    refresh_token: String(raw?.refresh_token || ''),
    token_type: String(raw?.token_type || 'bearer'),
    expires_in: expiresIn,
    expires_at: Number(raw?.expires_at || Math.floor(Date.now() / 1000) + expiresIn),
    user: raw?.user
  };
}

function saveSession(session: SupabaseSession | null) {
  if (typeof localStorage === 'undefined') return;
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function loadSession(): SupabaseSession | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.refresh_token) return null;
    return normalizeSession(parsed);
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearSupabaseSession() {
  saveSession(null);
}

export async function consumeSupabaseAuthRedirect(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.includes('access_token=')) return false;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return false;

  const expiresIn = Number(params.get('expires_in') || 3600);
  saveSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: params.get('token_type') || 'bearer',
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn
  });

  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}#/`);
  return true;
}

export async function requestEmailOtp(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'x-supabase-redirect-to': typeof window !== 'undefined' ? window.location.origin : ''
    },
    body: JSON.stringify({ email: normalizedEmail, create_user: true })
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'Не удалось отправить письмо для входа'));
  }
}

export async function verifyEmailOtp(email: string, token: string): Promise<SupabaseUserSnapshot> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ type: 'email', email: email.trim().toLowerCase(), token: token.trim() })
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'Неверный или просроченный код'));
  }

  const session = normalizeSession(await response.json());
  saveSession(session);
  await recordAuthenticatedLogin(session).catch(() => undefined);
  return loadUserSnapshot(session);
}

export async function requestPhoneOtp(phone: string): Promise<void> {
  const normalizedPhone = phone.replace(/[^+\d]/g, '');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ phone: normalizedPhone, create_user: true })
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'SMS-вход пока не настроен в Supabase'));
  }
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<SupabaseUserSnapshot> {
  const normalizedPhone = phone.replace(/[^+\d]/g, '');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ type: 'sms', phone: normalizedPhone, token: token.trim() })
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'Неверный или просроченный SMS-код'));
  }

  const session = normalizeSession(await response.json());
  saveSession(session);
  await recordAuthenticatedLogin(session).catch(() => undefined);
  return loadUserSnapshot(session);
}

async function refreshStoredSession(session: SupabaseSession): Promise<SupabaseSession> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });

  if (!response.ok) {
    clearSupabaseSession();
    throw new Error(await readError(response, 'Сессия завершена'));
  }

  const refreshed = normalizeSession(await response.json());
  saveSession(refreshed);
  return refreshed;
}

async function getValidSession(): Promise<SupabaseSession | null> {
  const session = loadSession();
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at <= now + 60) {
    return refreshStoredSession(session);
  }
  return session;
}

async function getAuthUser(session: SupabaseSession): Promise<SupabaseAuthUser> {
  if (session.user?.id) return session.user;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: authHeaders(session.access_token)
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Не удалось получить пользователя'));
  }
  return response.json();
}

function fallbackCanonicalUser(authUser: SupabaseAuthUser): CanonicalUser {
  const metadata = authUser.user_metadata || {};
  const email = authUser.email || '';
  const phone = authUser.phone || '';
  const displayName = metadata.full_name || metadata.name || email || phone || 'Пользователь NADO';
  const now = new Date().toISOString();
  return {
    id: authUser.id,
    displayName,
    firstName: metadata.first_name || '',
    lastName: metadata.last_name || '',
    avatarUrl: metadata.avatar_url || '',
    primaryEmail: email,
    primaryPhone: phone,
    emailVerified: Boolean(authUser.email_confirmed_at),
    phoneVerified: Boolean(authUser.phone_confirmed_at),
    status: 'active',
    roles: ['client'],
    permissions: [],
    createdAt: authUser.created_at || now,
    updatedAt: authUser.updated_at || now,
    lastLoginAt: authUser.last_sign_in_at || now
  };
}

function mapProfile(row: any, authUser: SupabaseAuthUser): CanonicalUser {
  return {
    id: row.id,
    displayName: row.display_name || 'Пользователь NADO',
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    avatarUrl: row.avatar_url || '',
    primaryEmail: row.primary_email || authUser.email || '',
    primaryPhone: row.primary_phone || authUser.phone || '',
    emailVerified: Boolean(row.email_verified),
    phoneVerified: Boolean(row.phone_verified),
    status: row.status === 'suspended' ? 'suspended' : 'active',
    roles: Array.isArray(row.roles) && row.roles.length ? row.roles : ['client'],
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at
  };
}

async function loadUserSnapshot(session: SupabaseSession): Promise<SupabaseUserSnapshot> {
  const authUser = await getAuthUser(session);
  const profileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(authUser.id)}&select=*`,
    { headers: authHeaders(session.access_token) }
  );

  if (!profileResponse.ok) {
    throw new Error(await readError(profileResponse, 'Не удалось загрузить профиль'));
  }

  const profileRows = await profileResponse.json();
  const user = profileRows?.[0] ? mapProfile(profileRows[0], authUser) : fallbackCanonicalUser(authUser);

  const identitiesResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/auth_identities?user_id=eq.${encodeURIComponent(authUser.id)}&status=eq.active&select=provider,provider_subject,provider_username,linked_at,verified_at`,
    { headers: authHeaders(session.access_token) }
  );

  const identityRows = identitiesResponse.ok ? await identitiesResponse.json() : [];
  const identities: SupabaseIdentityView[] = identityRows.map((row: any) => ({
    provider: row.provider,
    providerSubject: row.provider_subject,
    providerUsername: row.provider_username || undefined,
    linkedAt: row.linked_at,
    verifiedAt: row.verified_at
  }));

  return { user, identities };
}

export async function getSupabaseUserSnapshot(): Promise<SupabaseUserSnapshot | null> {
  const session = await getValidSession();
  if (!session) return null;
  try {
    return await loadUserSnapshot(session);
  } catch (error) {
    if (error instanceof Error && /сессия|jwt|token|unauthorized/i.test(error.message)) {
      clearSupabaseSession();
      return null;
    }
    throw error;
  }
}

export async function recordAuthenticatedLogin(sessionOverride?: SupabaseSession): Promise<void> {
  const session = sessionOverride || (await getValidSession());
  if (!session) return;
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_authenticated_login`, {
    method: 'POST',
    headers: authHeaders(session.access_token),
    body: '{}'
  });
}

export async function getAuthAuditLogs(): Promise<AuthAuditView[]> {
  const session = await getValidSession();
  if (!session) return [];
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/auth_audit_log?select=id,user_id,action,ip,user_agent,details,created_at&order=created_at.desc&limit=25`,
    { headers: authHeaders(session.access_token) }
  );
  if (!response.ok) return [];
  const rows = await response.json();
  return rows.map((row: any) => ({
    id: row.id,
    timestamp: row.created_at,
    userId: row.user_id,
    action: row.action,
    ip: row.ip || undefined,
    userAgent: row.user_agent || undefined,
    details: row.details ? JSON.stringify(row.details) : undefined
  }));
}

export async function signOutFromSupabase(): Promise<void> {
  const session = loadSession();
  if (session) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: authHeaders(session.access_token)
    }).catch(() => undefined);
  }
  clearSupabaseSession();
}
