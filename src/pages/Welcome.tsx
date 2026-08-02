import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Welcome() {
  const { startDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleStartDemo = () => {
    startDemoMode('event_created');
    navigate('/home');
  };

  const isDemoEnabled = (import.meta as any).env?.VITE_ENABLE_DEMO_MODE !== 'false';

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[var(--bg-primary)] text-[var(--text-primary)] px-6 py-12 font-sans selection:bg-[var(--gold-light)] selection:text-[var(--navy-primary)]">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col items-center justify-center text-center">
        {/* Logo block */}
        <div className="mb-12 flex flex-col items-center">
          <div className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] leading-none select-none">
            NADO
          </div>
          <div className="text-xs font-semibold tracking-[0.25em] text-[var(--gold-primary)] uppercase mt-1 select-none">
            ПРАЗДНИК
          </div>
        </div>

        {/* Content block */}
        <div className="space-y-6 mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
            «Праздник надо? <br />
            <span className="text-[var(--gold-primary)]">Создай в NADO»</span>
          </h1>
          <p className="text-base text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
            Расскажите, что хотите организовать. NADO поможет собрать площадку, команду, бюджет и план подготовки
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4 max-w-sm">
          <Link
            to="/auth/sign-in"
            id="btn-welcome-signin"
            className="block w-full py-3.5 px-6 rounded-xl font-medium text-white transition-all duration-300 transform active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #151D2D, #263550)',
              border: '1px solid rgba(210, 183, 117, 0.65)',
              boxShadow: '0 12px 30px rgba(13, 20, 33, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.13)'
            }}
          >
            Войти
          </Link>

          <Link
            to="/auth/sign-up"
            id="btn-welcome-signup"
            className="block w-full py-3.5 px-6 rounded-xl font-medium transition-all duration-300 border border-[var(--border-strong)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:scale-[0.98]"
          >
            Создать аккаунт
          </Link>

          {isDemoEnabled && (
            <button
              onClick={handleStartDemo}
              id="btn-welcome-demo"
              className="w-full py-3.5 px-6 rounded-xl font-medium transition-all duration-300 border border-[var(--gold-primary)]/45 bg-[var(--gold-primary)]/5 text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/10 hover:border-[var(--gold-primary)]/70 active:scale-[0.98] cursor-pointer"
            >
              Посмотреть демо
            </button>
          )}
        </div>
      </div>

      {/* Footer agreements */}
      <div className="w-full max-w-xs mx-auto text-center mt-8">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Продолжая, вы принимаете{' '}
          <Link to="/legal/user-agreement" className="underline hover:text-[var(--text-secondary)] transition-colors">
            правила сервиса
          </Link>{' '}
          и{' '}
          <Link to="/legal/privacy-policy" className="underline hover:text-[var(--text-secondary)] transition-colors">
            политику конфиденциальности
          </Link>
        </p>
      </div>
    </div>
  );
}
