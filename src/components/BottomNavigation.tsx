import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, ClipboardCheck, User } from 'lucide-react';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'nav-home',
      label: 'Кабинеты',
      icon: Home,
      path: '/workspace'
    },
    {
      id: 'nav-search',
      label: 'Найти',
      icon: Search,
      path: '/search'
    },
    {
      id: 'nav-events',
      label: 'Праздники',
      icon: Calendar,
      path: '/events'
    },
    {
      id: 'nav-bookings',
      label: 'Заказы',
      icon: ClipboardCheck,
      path: '/bookings'
    },
    {
      id: 'nav-profile',
      label: 'Профиль',
      icon: User,
      path: '/profile'
    }
  ];

  const isActive = (itemPath: string) => {
    if (itemPath === '/workspace') {
      return location.pathname === '/workspace' || location.pathname === '/';
    }
    if (itemPath === '/events') {
      return location.pathname.startsWith('/events') || location.pathname.startsWith('/project');
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--background-secondary)]/90 backdrop-blur-md border-t border-[var(--border-soft)] pb-[env(safe-area-inset-bottom)] shadow-xl">
      <div className="max-w-md mx-auto px-1 sm:px-4 h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const Active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={item.id}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center h-full min-w-0 py-1 transition-all relative cursor-pointer ${
                Active ? 'opacity-100 text-[var(--gold-primary)]' : 'opacity-60 hover:opacity-95 text-[var(--text-secondary)]'
              }`}
              style={{ flex: 1 }}
            >
              <div className="flex flex-col items-center justify-center relative w-full">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    Active ? 'text-[var(--gold-primary)] scale-110' : 'text-current'
                  }`}
                />
                <span
                  className={`text-xs min-[360px]:text-xs mt-1 font-bold font-sans tracking-tight text-center leading-none truncate w-full px-0.5 ${
                    Active ? 'text-[var(--gold-primary)] font-extrabold' : 'text-current'
                  }`}
                >
                  {item.label}
                </span>
                {Active && (
                  <div className="absolute -bottom-1.5 w-1.5 h-1.5 bg-[var(--gold-primary)] rounded-full"></div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
