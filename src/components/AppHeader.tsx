import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, CalendarRange, Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/useTheme';
import DemoControlPanel from './DemoControlPanel';

interface AppHeaderProps {
  title?: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, resolvedTheme } = useTheme();

  // Determine if we should show a back button
  const showBack = 
    location.pathname !== '/' && 
    location.pathname !== '/workspace' && 
    location.pathname !== '/home' && 
    location.pathname !== '/welcome' && 
    !location.pathname.startsWith('/auth');

  const handleBack = () => {
    const hasHistory = window.history.state && window.history.state.idx > 0;
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--surface-glass)] backdrop-blur-md border-b border-[var(--border-primary)] px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
        {showBack ? (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--surface-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--gold-primary)] cursor-pointer shrink-0"
            id="header-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}

        <div className="text-left cursor-pointer min-w-0" onClick={() => navigate('/')}>
          {title ? (
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] font-sans truncate" title={title}>
              {title}
            </h1>
          ) : (
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)] font-sans">NADO</span>
                <span className="text-xs sm:text-xs font-bold tracking-[0.15em] text-[var(--gold-primary)] uppercase font-sans shrink-0">ПРАЗДНИК</span>
              </div>
              <p className="text-xs sm:text-xs text-[var(--text-muted)] font-mono mt-0.5 hidden sm:block truncate">
                Праздник надо? Создай в NADO
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <DemoControlPanel />
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors cursor-pointer"
          id="header-theme-toggle"
          title={resolvedTheme === 'dark' ? 'Светлая тема' : 'Темная тема'}
        >
          {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 text-[var(--gold-light)]" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
        <button
          onClick={() => navigate('/bookings')}
          className="p-1.5 sm:p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors cursor-pointer"
          id="header-bookings-button"
          title="Мои бронирования"
        >
          <CalendarRange className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="p-1.5 sm:p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors cursor-pointer"
          id="header-profile-button"
          title="Профиль"
        >
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
