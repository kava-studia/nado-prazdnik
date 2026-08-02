import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode, DemoScenario } from '../context/DemoModeContext';
import { Sliders, RefreshCw, LogOut, Check, Eye, HelpCircle, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

export default function DemoControlPanel() {
  const navigate = useNavigate();
  const {
    isDemoMode,
    demoScenario,
    demoRole,
    demoPartyId,
    setDemoScenario,
    setDemoRole,
    setDemoPartyId,
    resetDemoData,
    exitDemoMode
  } = useDemoMode();

  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isDemoMode) return null;

  const scenarios: { id: DemoScenario; label: string; desc: string }[] = [
    { id: 'empty_client', label: 'Новый пользователь', desc: 'Пустой профиль клиента, нет мероприятий' },
    { id: 'event_created', label: 'Мероприятие создано', desc: 'Создана свадьба/ДР без подрядчиков' },
    { id: 'event_in_progress', label: 'Подготовка в процессе', desc: 'Площадка выбрана, ведущий на рассмотрении' },
    { id: 'event_ready', label: 'Мероприятие готово', desc: 'Подтверждена команда, рассчитаны напитки' },
    { id: 'contractor', label: 'Кабинет исполнителя', desc: 'Панель подрядчика, входящие заявки' },
    { id: 'venue', label: 'Кабинет площадки', desc: 'Панель площадки, свободные даты' }
  ];

  const handleExit = () => {
    exitDemoMode();
    setIsOpen(false);
    navigate('/welcome');
  };

  const handleReset = () => {
    resetDemoData();
    setToastMessage('Данные демо-режима успешно сброшены');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="relative font-sans shrink-0">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Glow button indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/35 text-xs sm:text-xs font-bold text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/20 transition-all cursor-pointer animate-pulse"
        title="Панель управления демо-режимом"
      >
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--gold-primary)] shrink-0" />
        <span>Демо<span className="hidden min-[440px]:inline">-режим</span></span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={() => setIsOpen(false)} />

          {/* Floating Card */}
          <div className="fixed sm:absolute top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-200 text-[var(--text-primary)] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--gold-primary)]" />
                <h3 className="font-bold text-sm tracking-tight">Управление демо-режимом</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-[var(--text-secondary)] hover:underline cursor-pointer"
              >
                Закрыть
              </button>
            </div>

            {/* Warning caption */}
            <div className="p-3 bg-[var(--gold-primary)]/5 border border-[var(--gold-primary)]/20 rounded-2xl flex gap-3 text-xs text-[var(--text-secondary)]">
              <HelpCircle className="w-4 h-4 text-[var(--gold-primary)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Вы просматриваете интерактивную модель приложения. Все изменения сохраняются только в вашей временной сессии.
              </p>
            </div>

            {/* Party selection switcher (DemoPartySwitcher) */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                Демо-личность (Авторизация стороны):
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'demo-client-user', label: 'Заказчик', desc: 'Демонстрационный клиент' },
                  { id: 'demo-contractor-host', label: 'Исполнитель (Ведущий)', desc: 'Ведущий Алексей' },
                  { id: 'demo-contractor-dj', label: 'Исполнитель (DJ)', desc: 'DJ Сергей' },
                  { id: 'demo-venue-user', label: 'Площадка', desc: 'Loft Hall' },
                  { id: 'demo-organizer-user', label: 'Организатор', desc: 'Демонстрационный организатор' }
                ].map((party) => {
                  const isSelected = demoPartyId === party.id;
                  return (
                    <button
                      key={party.id}
                      onClick={() => setDemoPartyId(party.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#151D2D] to-[#263550] border-[var(--gold-primary)] text-white shadow-xs'
                          : 'bg-[var(--surface-secondary)] border-[var(--border-soft)] text-[var(--text-secondary)] hover:border-[var(--border-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Eye className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />}
                        <span className="font-bold">{party.label}</span>
                      </div>
                      <span className="text-[11px] opacity-70 font-normal">{party.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scenario selector */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                Выберите демо-сценарий:
              </span>
              <div className="space-y-2">
                {scenarios.map((s) => {
                  const isActive = demoScenario === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setDemoScenario(s.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isActive
                          ? 'bg-[var(--surface-secondary)] border-[var(--gold-primary)]/60 shadow-inner'
                          : 'bg-[var(--surface-primary)] border-[var(--border-soft)] hover:border-[var(--border-primary)]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 text-[var(--gold-primary)]' : 'border-[var(--border-soft)]'
                      }`}>
                        {isActive && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">{s.label}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{s.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-[var(--border-soft)] grid grid-cols-2 gap-3.5">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-secondary)] hover:bg-[var(--border-soft)]/5 text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
                title="Сбросить все временные данные к начальным"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                <span>Сбросить данные</span>
              </button>

              <button
                onClick={handleExit}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border-strong)] bg-red-500/10 hover:bg-red-500/15 text-xs font-semibold text-red-600 transition-all cursor-pointer"
                title="Выйти в меню входа"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>Выйти из демо</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
