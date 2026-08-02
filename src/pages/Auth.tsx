import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type AuthStep =
  | 'sign-in'
  | 'sign-up'
  | 'email'
  | 'phone'
  | 'verify-email'
  | 'verify-phone'
  | 'conflict'
  | 'success';

export default function Auth() {
  const {
    user,
    loginWithEmailStart,
    loginWithEmailVerify,
    loginWithPhoneStart,
    loginWithPhoneVerify,
    loginWithTelegram,
    loginWithMax,
    loginWithEsia,
    mergeAccount
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Determine current step based on route
  const path = location.pathname;
  let initialStep: AuthStep = 'sign-in';
  if (path.includes('sign-up')) initialStep = 'sign-up';
  else if (path.includes('email')) initialStep = 'email';
  else if (path.includes('phone')) initialStep = 'phone';
  else if (path.includes('verify-email')) initialStep = 'verify-email';
  else if (path.includes('verify-phone')) initialStep = 'verify-phone';
  else if (path.includes('account-conflict')) initialStep = 'conflict';

  const [step, setStep] = useState<AuthStep>(initialStep);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [conflictUserId, setConflictUserId] = useState<string | null>(null);

  // Sync state with path changes
  useEffect(() => {
    setStep(initialStep);
    setError(null);
  }, [location.pathname]);

  // Timer for OTP code resending
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Handle start email
  const handleEmailStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const res = await loginWithEmailStart(email);
    setLoading(false);
    if (res.success) {
      setTimer(300); // 5 mins
      navigate('/auth/verify-email');
    } else {
      setError(res.error || 'Не удалось отправить код');
    }
  };

  // Handle verify email
  const handleEmailVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError(null);
    const res = await loginWithEmailVerify(email, code);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else if (res.conflictUserId) {
      setConflictUserId(res.conflictUserId);
      navigate('/auth/account-conflict');
    } else {
      setError(res.error || 'Код введён неверно или истёк');
    }
  };

  // Handle start phone
  const handlePhoneStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError(null);
    const res = await loginWithPhoneStart(phone);
    setLoading(false);
    if (res.success) {
      setTimer(300);
      navigate('/auth/verify-phone');
    } else {
      setError(res.error || 'Не удалось отправить SMS-код');
    }
  };

  // Handle verify phone
  const handlePhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError(null);
    const res = await loginWithPhoneVerify(phone, code);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else if (res.conflictUserId) {
      setConflictUserId(res.conflictUserId);
      navigate('/auth/account-conflict');
    } else {
      setError(res.error || 'Код SMS введён неверно или истёк');
    }
  };

  // Merge conflict profiles
  const handleMerge = async () => {
    if (!conflictUserId) return;
    setLoading(true);
    setError(null);
    const res = await mergeAccount(conflictUserId);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Не удалось объединить профили');
    }
  };

  // OAuth Simulation handlers
  const handleTelegramClick = async () => {
    setLoading(true);
    setError(null);
    const mockTgPayload = {
      id: 'tg-' + Math.floor(100000 + Math.random() * 900000),
      username: 'tg_demo_client',
      first_name: 'Тестовый',
      last_name: 'Пользователь Telegram'
    };
    const res = await loginWithTelegram(mockTgPayload);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Ошибка входа через Telegram');
    }
  };

  const handleMaxClick = async () => {
    setLoading(true);
    setError(null);
    // Simulate MAX provider check:
    const simulateUnconfigured = !(import.meta as any).env.DEV; // only configured in dev mode
    const res = await loginWithMax(
      { id: 'max-888', username: 'max_user_demo', name: 'Макс' },
      simulateUnconfigured
    );
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError('Вход через MAX временно недоступен');
    }
  };

  const handleEsiaClick = async () => {
    setLoading(true);
    setError(null);
    // Simulate ESIA provider check:
    const simulateUnconfigured = !(import.meta as any).env.DEV;
    const res = await loginWithEsia(
      { id: 'esia-777', firstName: 'Госуслуга', lastName: 'Тест' },
      simulateUnconfigured
    );
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError('Вход через Госуслуги временно недоступен');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] px-6 py-12 font-sans selection:bg-[var(--gold-light)]">
      <div className="w-full max-w-md bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--gold-light)] to-transparent opacity-10 pointer-events-none rounded-bl-full" />

        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/welcome"
            className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Вернуться к экрану приветствия
          </Link>
        </div>

        {/* Logo block */}
        <div className="mb-8 text-center">
          <div className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] leading-none select-none">
            NADO
          </div>
          <div className="text-xs font-semibold tracking-[0.25em] text-[var(--gold-primary)] uppercase mt-0.5 select-none">
            ПРАЗДНИК
          </div>
        </div>

        {/* Error block */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30 text-sm text-[var(--error)] text-center font-medium">
            {error}
          </div>
        )}

        {/* Rendering current step */}
        {step === 'sign-in' && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Войти в NADO</h2>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-8">
              Все способы входа можно привязать к одному профилю
            </p>

            <div className="space-y-3">
              <button
                onClick={handleTelegramClick}
                id="btn-auth-tg"
                className="w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all flex items-center justify-center gap-3"
              >
                Войти через Telegram
              </button>
              <button
                onClick={handleMaxClick}
                id="btn-auth-max"
                className="w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all flex items-center justify-center gap-3"
              >
                Войти через MAX
              </button>
              <button
                onClick={handleEsiaClick}
                id="btn-auth-esia"
                className="w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all flex items-center justify-center gap-3"
              >
                Войти через Госуслуги
              </button>
              <Link
                to="/auth/phone"
                id="btn-auth-phone"
                className="block text-center w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all"
              >
                Войти по номеру телефона
              </Link>
              <Link
                to="/auth/email"
                id="btn-auth-email"
                className="block text-center w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all"
              >
                Войти по электронной почте
              </Link>
            </div>

            <p className="text-xs text-[var(--text-muted)] text-center mt-6">
              Нет аккаунта?{' '}
              <Link to="/auth/sign-up" className="text-[var(--gold-primary)] font-semibold hover:underline">
                Создать
              </Link>
            </p>
          </div>
        )}

        {step === 'sign-up' && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Создать аккаунт</h2>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-8">
              Выберите удобный способ. Позже можно добавить остальные
            </p>

            <div className="space-y-3">
              <button
                onClick={handleTelegramClick}
                className="w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all flex items-center justify-center gap-3"
              >
                Зарегистрироваться через Telegram
              </button>
              <button
                onClick={handleMaxClick}
                className="w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all flex items-center justify-center gap-3"
              >
                Зарегистрироваться через MAX
              </button>
              <button
                onClick={handleEsiaClick}
                className="w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all flex items-center justify-center gap-3"
              >
                Зарегистрироваться через Госуслуги
              </button>
              <Link
                to="/auth/phone"
                className="block text-center w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all"
              >
                Зарегистрироваться по телефону
              </Link>
              <Link
                to="/auth/email"
                className="block text-center w-full py-3 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-sm font-medium hover:bg-[var(--surface-primary)] transition-all"
              >
                Зарегистрироваться по почте
              </Link>
            </div>

            <p className="text-xs text-[var(--text-muted)] text-center mt-6">
              Уже есть аккаунт?{' '}
              <Link to="/auth/sign-in" className="text-[var(--gold-primary)] font-semibold hover:underline">
                Войти
              </Link>
            </p>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailStart}>
            <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Электронная почта</h2>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
              Мы отправим одноразовый код на вашу почту для входа
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Адрес почты
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@nado.ru"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-primary)] focus:border-[var(--gold-primary)] focus:outline-none transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-white transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #151D2D, #263550)' }}
            >
              {loading ? 'Отправка...' : 'Отправить код'}
            </button>
          </form>
        )}

        {step === 'phone' && (
          <form onSubmit={handlePhoneStart}>
            <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Номер телефона</h2>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
              Мы отправим SMS с проверочным кодом на ваш телефон
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Номер телефона
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-primary)] focus:border-[var(--gold-primary)] focus:outline-none transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-white transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #151D2D, #263550)' }}
            >
              {loading ? 'Отправка...' : 'Отправить SMS'}
            </button>
          </form>
        )}

        {step === 'verify-email' && (
          <form onSubmit={handleEmailVerify}>
            <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Введите код</h2>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
              Код отправлен на <strong>{email}</strong>. Код логируется на сервере.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                6-значный код
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg px-4 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-primary)] focus:border-[var(--gold-primary)] focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-white transition-all duration-300 mb-4"
              style={{ background: 'linear-gradient(135deg, #151D2D, #263550)' }}
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>

            {timer > 0 ? (
              <p className="text-xs text-center text-[var(--text-muted)] font-mono">
                Повторный запрос кода через {timer} сек.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleEmailStart}
                className="w-full text-xs text-center text-[var(--gold-primary)] hover:underline font-medium"
              >
                Отправить код повторно
              </button>
            )}
          </form>
        )}

        {step === 'verify-phone' && (
          <form onSubmit={handlePhoneVerify}>
            <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Введите SMS-код</h2>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
              Код отправлен на <strong>{phone}</strong>. Код логируется на сервере.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Код из SMS
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg px-4 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-primary)] focus:border-[var(--gold-primary)] focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-white transition-all duration-300 mb-4"
              style={{ background: 'linear-gradient(135deg, #151D2D, #263550)' }}
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>

            {timer > 0 ? (
              <p className="text-xs text-center text-[var(--text-muted)] font-mono">
                Повторный запрос кода через {timer} сек.
              </p>
            ) : (
              <button
                type="button"
                onClick={handlePhoneStart}
                className="w-full text-xs text-center text-[var(--gold-primary)] hover:underline font-medium"
              >
                Отправить SMS повторно
              </button>
            )}
          </form>
        )}

        {step === 'conflict' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Похоже, у вас уже есть аккаунт</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Подтвердите вход одним из привязанных способов, чтобы объединить данные и сохранить ваши проекты и бронирования.
            </p>

            <div className="p-4 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-xl text-left mb-6 space-y-2">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Существующий аккаунт</div>
              <div className="text-sm font-semibold">{email || phone || 'Пользователь NADO'}</div>
            </div>

            <button
              onClick={handleMerge}
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-white transition-all duration-300 mb-3"
              style={{ background: 'linear-gradient(135deg, #151D2D, #263550)' }}
            >
              {loading ? 'Объединение...' : 'Объединить аккаунты'}
            </button>

            <button
              onClick={() => {
                setError(null);
                navigate('/welcome');
              }}
              className="w-full py-2.5 rounded-xl border border-[var(--border-strong)] bg-transparent text-sm font-medium hover:bg-[var(--surface-secondary)] transition-all"
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
