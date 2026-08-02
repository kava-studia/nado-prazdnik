import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Shield, LogOut, Key, Link2, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { getProjects, getBookings, getFavorites } from '../services/eventlyStorage';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, identities, unlinkProvider, logout, refreshSession, loginWithEmailStart, loginWithEmailVerify, loginWithPhoneStart, loginWithPhoneVerify, loginWithTelegram, loginWithMax, loginWithEsia } = useAuth();

  const [bookingsCount, setBookingsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  
  // Linking states
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [linkInputVal, setLinkInputVal] = useState('');
  const [linkCodeVal, setLinkCodeVal] = useState('');
  const [linkingStep, setLinkingStep] = useState<'input' | 'verify' | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkingLoading, setLinkingLoading] = useState(false);

  // Security audit states
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    // Counts
    setBookingsCount(getBookings().length);
    setFavoritesCount(getFavorites().length);

    // Fetch Security Audit Logs
    fetchAuditLogs();
  }, [user]);

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/auth/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
  };

  const handleUnlink = async (provider: string) => {
    if (identities.length <= 1) {
      alert('Вы не можете отключить единственный способ входа! Иначе вы потеряете доступ к аккаунту.');
      return;
    }
    if (confirm(`Вы уверены, что хотите отключить вход через ${getProviderLabel(provider)}?`)) {
      const res = await unlinkProvider(provider);
      if (res.success) {
        await fetchAuditLogs();
      } else {
        alert(res.error || 'Ошибка отключения');
      }
    }
  };

  // Linking flow
  const startLinkingFlow = (provider: string) => {
    setLinkingProvider(provider);
    setLinkingStep('input');
    setLinkInputVal('');
    setLinkCodeVal('');
    setLinkError(null);
  };

  const cancelLinkingFlow = () => {
    setLinkingProvider(null);
    setLinkingStep(null);
    setLinkInputVal('');
    setLinkCodeVal('');
    setLinkError(null);
  };

  const handleLinkStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInputVal || !linkingProvider) return;

    setLinkingLoading(true);
    setLinkError(null);

    let res;
    if (linkingProvider === 'email') {
      res = await loginWithEmailStart(linkInputVal);
    } else {
      res = await loginWithPhoneStart(linkInputVal);
    }

    setLinkingLoading(false);
    if (res.success) {
      setLinkingStep('verify');
    } else {
      setLinkError(res.error || 'Ошибка отправки кода привязки');
    }
  };

  const handleLinkVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCodeVal || !linkingProvider) return;

    setLinkingLoading(true);
    setLinkError(null);

    let res;
    if (linkingProvider === 'email') {
      res = await loginWithEmailVerify(linkInputVal, linkCodeVal);
    } else {
      res = await loginWithPhoneVerify(linkInputVal, linkCodeVal);
    }

    setLinkingLoading(false);
    if (res.success) {
      // Linked successfully!
      cancelLinkingFlow();
      await fetchAuditLogs();
    } else if (res.conflictUserId) {
      // Handled as conflict, but since we are linking, suggest to merge
      if (confirm('Этот способ входа привязан к другому аккаунту. Хотите объединить этот аккаунт с тем профилем?')) {
        navigate('/auth/account-conflict');
      } else {
        cancelLinkingFlow();
      }
    } else {
      setLinkError(res.error || 'Неверный код подтверждения');
    }
  };

  const handleDirectLinkSimulate = async (provider: 'telegram' | 'max' | 'esia') => {
    setLinkingLoading(true);
    setLinkError(null);
    
    let res;
    if (provider === 'telegram') {
      res = await loginWithTelegram({
        id: 'tg-link-' + Math.floor(Math.random() * 10000),
        username: 'linked_tg_username',
        first_name: user?.firstName || 'Linked'
      });
    } else if (provider === 'max') {
      res = await loginWithMax({ id: 'max-link-999', username: 'linked_max_user' }, false);
    } else {
      res = await loginWithEsia({ id: 'esia-link-999', firstName: 'LinkedESIA' }, false);
    }

    setLinkingLoading(false);
    if (res.success) {
      alert(`Успешно привязан способ входа через ${getProviderLabel(provider)}!`);
      await fetchAuditLogs();
    } else {
      alert(res.error || 'Ошибка привязки провайдера');
    }
  };

  const getProviderLabel = (prov: string) => {
    switch (prov) {
      case 'email': return 'Электронная почта';
      case 'phone': return 'Номер телефона';
      case 'telegram': return 'Telegram';
      case 'max': return 'MAX';
      case 'esia': return 'Госуслуги';
      default: return prov;
    }
  };

  const getProviderIconColor = (prov: string) => {
    switch (prov) {
      case 'telegram': return 'text-sky-500';
      case 'esia': return 'text-blue-600';
      case 'max': return 'text-[var(--gold-primary)]';
      default: return 'text-[var(--text-secondary)]';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client': return 'Заказчик праздника';
      case 'contractor': return 'Исполнитель/Подрядчик';
      case 'organizer': return 'Организатор';
      case 'venue_manager': return 'Управляющий площадки';
      case 'administrator': return 'Администратор системы';
      default: return role;
    }
  };

  if (!user) return null;

  const isProviderLinked = (prov: string) => identities.some(id => id.provider === prov);
  const canUnlink = identities.length > 1;

  return (
    <div className="min-h-screen pb-32 flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans" id="profile-view">
      <AppHeader title="Мой профиль" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Canonical Profile Card */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 relative overflow-hidden flex flex-col sm:flex-row gap-5 items-center shadow-lg">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold-primary)]/5 blur-2xl pointer-events-none rounded-bl-full" />
            
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#151D2D] to-[#263550] border border-[var(--gold-primary)]/35 flex items-center justify-center text-[var(--gold-primary)] font-black text-xl shadow-md shrink-0">
              {user.firstName ? user.firstName[0] : 'U'}
              {user.lastName ? user.lastName[0] : ''}
            </div>
            
            <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] truncate">
                {user.displayName || `${user.firstName} ${user.lastName}`}
              </h3>
              
              {/* User Roles */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {user.roles && user.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-block bg-[var(--surface-secondary)] text-[var(--gold-primary)] border border-[var(--gold-primary)]/20 text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  >
                    {getRoleLabel(role)}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--error)] hover:bg-[var(--error)]/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>

          {/* Contact Information */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4 shadow-md">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-soft)] pb-2">
              Данные профиля
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                <div>
                  <div className="text-xs text-[var(--text-secondary)] font-semibold uppercase">Фамилия Имя</div>
                  <div className="font-semibold">{user.firstName} {user.lastName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                <div>
                  <div className="text-xs text-[var(--text-secondary)] font-semibold uppercase">Телефон</div>
                  <div className="font-semibold">{user.primaryPhone || 'Не привязан'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                <div>
                  <div className="text-xs text-[var(--text-secondary)] font-semibold uppercase">Email</div>
                  <div className="font-semibold">{user.primaryEmail || 'Не привязан'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Connected login methods (Identities) */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4 shadow-md">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-soft)] pb-2">
              Способы входа (Объединенные аккаунты)
            </h4>

            {linkError && (
              <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/30 text-xs font-medium text-[var(--error)] rounded-xl">
                {linkError}
              </div>
            )}

            {/* Providers List */}
            <div className="space-y-3.5">
              {['email', 'phone', 'telegram', 'max', 'esia'].map((prov) => {
                const linked = isProviderLinked(prov);
                const identityObj = identities.find(id => id.provider === prov);

                return (
                  <div key={prov} className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)]">
                    <div className="flex items-center gap-3">
                      <Key className={`w-4 h-4 ${getProviderIconColor(prov)} shrink-0`} />
                      <div>
                        <div className="text-sm font-semibold">{getProviderLabel(prov)}</div>
                        <div className="text-xs text-[var(--text-muted)] font-mono">
                          {linked 
                            ? `Привязан (${identityObj?.providerUsername || identityObj?.providerSubject || 'активен'})` 
                            : 'Не привязан'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {linked ? (
                        <button
                          onClick={() => handleUnlink(prov)}
                          disabled={!canUnlink}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            canUnlink 
                              ? 'border-[var(--error)]/30 text-[var(--error)] hover:bg-[var(--error)]/5' 
                              : 'border-[var(--border-soft)] text-[var(--text-muted)] cursor-not-allowed'
                          } transition-all`}
                          title={!canUnlink ? 'Нельзя отключить единственный способ входа' : ''}
                        >
                          Отключить
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (prov === 'email' || prov === 'phone') {
                              startLinkingFlow(prov);
                            } else {
                              handleDirectLinkSimulate(prov as any);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--gold-primary)]/45 text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/5 transition-all"
                        >
                          Привязать
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Render Inline Verification Form during Linking */}
            {linkingProvider && linkingStep && (
              <div className="p-5 border border-dashed border-[var(--gold-primary)]/40 rounded-2xl bg-[var(--surface-secondary)]/50 mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-[var(--gold-primary)]">
                    Привязка {getProviderLabel(linkingProvider)}
                  </span>
                  <button onClick={cancelLinkingFlow} className="text-xs text-[var(--text-secondary)] hover:underline">
                    Отмена
                  </button>
                </div>

                {linkingStep === 'input' ? (
                  <form onSubmit={handleLinkStart} className="space-y-3">
                    <input
                      type={linkingProvider === 'email' ? 'email' : 'text'}
                      required
                      placeholder={linkingProvider === 'email' ? 'your-email@nado.ru' : '+7 (999) 000-00-00'}
                      value={linkInputVal}
                      onChange={(e) => setLinkInputVal(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-primary)] focus:border-[var(--gold-primary)] focus:outline-none text-xs"
                    />
                    <button
                      type="submit"
                      disabled={linkingLoading}
                      className="w-full py-2 bg-gradient-to-r from-[#151D2D] to-[#263550] text-xs font-bold text-white rounded-xl hover:brightness-110 transition-all"
                    >
                      {linkingLoading ? 'Отправка...' : 'Отправить код'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLinkVerify} className="space-y-3">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Введите код, полученный на {linkInputVal} (код логируется на сервере)
                    </p>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="000000"
                      value={linkCodeVal}
                      onChange={(e) => setLinkCodeVal(e.target.value)}
                      className="w-full text-center font-mono font-bold tracking-widest px-4 py-2.5 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-primary)] focus:border-[var(--gold-primary)] focus:outline-none text-sm"
                    />
                    <button
                      type="submit"
                      disabled={linkingLoading}
                      className="w-full py-2 bg-gradient-to-r from-[#151D2D] to-[#263550] text-xs font-bold text-white rounded-xl hover:brightness-110 transition-all"
                    >
                      {linkingLoading ? 'Проверка...' : 'Подтвердить код'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Document center and Consents link */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4 shadow-md">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-soft)] pb-2">
              Юридический Документ-Центр
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/legal"
                className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] text-sm hover:border-[var(--gold-primary)]/30 transition-all"
              >
                <span className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                  <span className="font-semibold">Правила и документы</span>
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">Перейти</span>
              </Link>

              <Link
                to="/profile/consents"
                className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] text-sm hover:border-[var(--gold-primary)]/30 transition-all"
              >
                <span className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                  <span className="font-semibold">Журнал согласий</span>
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">Перейти</span>
              </Link>
            </div>
          </div>

          {/* Security Audit Log */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Аудит безопасности (Входы и действия)
              </h4>
              <button
                onClick={fetchAuditLogs}
                disabled={auditLoading}
                className="p-1 rounded hover:bg-[var(--surface-secondary)] transition-colors text-[var(--gold-primary)]"
                title="Обновить журнал"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3.5 pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-4 font-mono">
                  История действий пуста.
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="text-xs p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--gold-primary)]">{log.action}</span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {new Date(log.timestamp).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    {log.details && (
                      <div className="text-xs text-[var(--text-secondary)]">
                        {log.details}
                      </div>
                    )}
                    <div className="text-xs text-[var(--text-muted)] font-mono flex flex-wrap gap-x-3">
                      <span>IP: {log.ip || '127.0.0.1'}</span>
                      <span className="truncate max-w-xs" title={log.userAgent}>
                        Agent: {log.userAgent ? log.userAgent.split(' ')[0] : 'Browser'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
