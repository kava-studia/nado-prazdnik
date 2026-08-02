import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useDemoMode, DemoScenario } from '../context/DemoModeContext';
import { UserRole } from '../types';
import AppHeader from './AppHeader';
import BottomNavigation from './BottomNavigation';
import {
  Sparkles,
  Shield,
  User,
  Wrench,
  Briefcase,
  Building,
  ChevronRight,
  Sliders
} from 'lucide-react';

const SCENARIOS: { value: DemoScenario; label: string; role: UserRole; desc: string }[] = [
  { value: 'empty_client', label: 'Клиент: Без проектов', role: 'client', desc: 'Пустой кабинет клиента, приглашение создать' },
  { value: 'event_created', label: 'Клиент: Создано событие', role: 'client', desc: 'Свадьба создана, шаги не выполнены' },
  { value: 'event_in_progress', label: 'Клиент: Подготовка', role: 'client', desc: 'Подобран диджей, расчет напитков' },
  { value: 'event_ready', label: 'Клиент: Готов к проведению', role: 'client', desc: 'Все брони оформлены, смета закрыта' },
  { value: 'order_dispute', label: 'Клиент: Конфликт / Спор', role: 'client', desc: 'Открыт спор в арбитраже по качеству' },
  { value: 'contractor', label: 'Исполнитель: Стандарт', role: 'contractor', desc: 'Прием заказов, скоринг 85' },
  { value: 'contractor_high_score', label: 'Исполнитель: Топ рейтинг', role: 'contractor', desc: 'Максимальный скоринг 100/100, x1.5 лиды' },
  { value: 'contractor_expired', label: 'Исполнитель: Просрочен SLA', role: 'contractor', desc: 'Лиды с нарушением 45 мин таймера' },
  { value: 'contractor_low_calendar', label: 'Исполнитель: Пустой календарь', role: 'contractor', desc: 'Оценка за актуальность снижена' },
  { value: 'contract_versions', label: 'Исполнитель: Версии договора', role: 'contractor', desc: 'История версий допсоглашений' },
  { value: 'organizer', label: 'Организатор: Канбан', role: 'organizer', desc: 'Управление пулом свадеб, реестр клиентов' },
  { value: 'venue', label: 'Площадка: Аренда залов', role: 'venue_manager', desc: 'Календарь бронирования ресурсов и залов' },
  { value: 'venue_conflict', label: 'Площадка: Наложение дат', role: 'venue_manager', desc: 'Двойная бронь на один день (предупреждение)' },
  { value: 'admin_scoring', label: 'Админ: Настройка скоринга', role: 'administrator', desc: 'Изменение весов правил с аудит-логом' },
  { value: 'admin_contracts', label: 'Админ: Юр. шаблоны', role: 'administrator', desc: 'Конструктор и апрув системных договоров' }
];

const ROLES: { value: UserRole; label: string; icon: any; path: string }[] = [
  { value: 'client', label: 'Клиент', icon: User, path: '/home' },
  { value: 'contractor', label: 'Исполнитель', icon: Wrench, path: '/workspace/contractor' },
  { value: 'organizer', label: 'Организатор', icon: Briefcase, path: '/workspace/organizer' },
  { value: 'venue_manager', label: 'Площадка', icon: Building, path: '/workspace/venue' },
  { value: 'administrator', label: 'Администратор', icon: Shield, path: '/workspace/admin' }
];

export default function WorkspaceLayout() {
  const { demoRole, demoScenario, setDemoScenario, setDemoRole, isDemoMode } = useDemoMode();
  const [showConfig, setShowConfig] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const activeRoleConfig = ROLES.find(r => location.pathname === r.path) || ROLES.find(r => r.value === demoRole);
  const currentRoleValue = activeRoleConfig ? activeRoleConfig.value : demoRole;

  const handleScenarioChange = (scenario: DemoScenario) => {
    setDemoScenario(scenario);
    // Find matching role for this scenario and navigate to its path
    const matchingSc = SCENARIOS.find(s => s.value === scenario);
    if (matchingSc) {
      const matchingRole = ROLES.find(r => r.value === matchingSc.role);
      if (matchingRole) {
        navigate(matchingRole.path);
      }
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setDemoRole(role);
    const matchingRole = ROLES.find(r => r.value === role);
    if (matchingRole) {
      navigate(matchingRole.path);
    }
  };

  return (
    <div className="min-h-screen pb-32 flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans" id="workspace-layout">
      <AppHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Simulator Selector Panel */}
        {isDemoMode && showConfig && (
          <aside className="w-full lg:w-80 shrink-0 space-y-6" id="simulator-panel">
            {/* Quick header */}
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-5 space-y-4 shadow-md text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--gold-primary)]" />
                <h3 className="text-sm font-black uppercase tracking-wider">Event OS Симулятор</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Переключайте роли и сценарии, чтобы мгновенно перестроить базу данных и проверить все сценарии без регистрации.
              </p>
            </div>

            {/* Role switchers */}
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-5 space-y-3.5 shadow-md text-left">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">Активная Роль</span>
              <div className="grid grid-cols-1 gap-2">
                {ROLES.map(role => {
                  const Icon = role.icon;
                  const isActive = currentRoleValue === role.value;

                  return (
                    <button
                      key={role.value}
                      onClick={() => handleRoleChange(role.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer ${isActive ? 'bg-[var(--gold-primary)] text-black border-[var(--gold-primary)]' : 'bg-[var(--surface-secondary)] text-[var(--text-primary)] border-[var(--border-soft)] hover:border-[var(--gold-primary)]'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{role.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scenario switchers */}
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-5 space-y-3 shadow-md text-left">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">15 Демо-сценариев</span>
              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                {SCENARIOS.map(sc => {
                  const isActive = demoScenario === sc.value;

                  return (
                    <button
                      key={sc.value}
                      onClick={() => handleScenarioChange(sc.value)}
                      title={sc.desc}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${isActive ? 'bg-[var(--surface-secondary)] border-[var(--gold-primary)] shadow-sm' : 'bg-transparent border-transparent hover:bg-black/10'}`}
                    >
                      <div className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
                        <span className={isActive ? 'text-[var(--gold-primary)]' : ''}>{sc.label}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)] animate-ping" />}
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] block mt-0.5 leading-relaxed line-clamp-1">{sc.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Right Side: Render Cabinet Dashboard */}
        <section className="flex-1 space-y-6">
          {/* Header toolbar */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-4 sm:px-6 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              {isDemoMode && (
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="p-2 bg-[var(--surface-secondary)] border border-[var(--border-soft)] hover:border-[var(--gold-primary)] rounded-xl text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
                  title="Переключить боковую панель"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              )}
              
              <div className="text-left">
                <span className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)] block">Раздел операционной системы</span>
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>Кабинет {ROLES.find(r => r.value === currentRoleValue)?.label}</span>
                </h2>
              </div>
            </div>

            {isDemoMode && (
              <div className="text-right text-xs font-mono text-[var(--text-secondary)] hidden sm:block">
                Сценарий: <span className="font-bold text-[var(--gold-primary)]">{demoScenario}</span>
              </div>
            )}
          </div>

          {/* Core Cabinet UI */}
          <div className="transition-all duration-300">
            <Outlet />
          </div>
        </section>

      </main>

      <BottomNavigation />
    </div>
  );
}
