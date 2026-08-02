import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  const handleOpenMyEvents = () => {
    const activeId = localStorage.getItem('evently_active_project_id');
    if (activeId) {
      navigate(`/events/${activeId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen text-[var(--color-text)] flex flex-col items-center justify-center p-6 font-sans animate-fade-in" id="notfound-view">
      <div className="max-w-md w-full premium-glass-card rounded-[24px] p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-[var(--color-champagne)] border border-[var(--color-gold)]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-xs">
          🔍
        </div>
        
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)] mb-3">
          Такой страницы нет
        </h1>
        
        <p className="text-sm text-[var(--color-text-secondary)] font-semibold mb-8 leading-relaxed">
          Возможно, вы перешли по неверной ссылке или страница была перемещена.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 px-4 premium-gold-button font-black text-xs uppercase tracking-wider"
          >
            На главную
          </button>
          
          <button
            onClick={handleOpenMyEvents}
            className="w-full py-3 px-4 bg-white hover:bg-[var(--color-background-soft)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Открыть мое мероприятие
          </button>
        </div>
      </div>
    </div>
  );
}
