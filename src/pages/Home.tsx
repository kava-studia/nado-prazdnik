import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Search, Wallet, Wine, ArrowRight, Calendar, Users, Percent } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { getActiveProject, getProjects } from '../services/eventlyStorage';
import { EventProject } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeProject, setActiveProject] = useState<EventProject | null>(null);
  const [hasMultipleProjects, setHasMultipleProjects] = useState(false);

  useEffect(() => {
    const active = getActiveProject();
    setActiveProject(active);

    const all = getProjects();
    setHasMultipleProjects(all.length > 1);
  }, []);

  const name = user ? (user.firstName || user.displayName) : '';
  const greeting = name ? `Здравствуйте, ${name}` : 'Здравствуйте';

  // Determine next suggested action for active project
  const getNextAction = (project: EventProject) => {
    if (!project) return '';
    const planItems = project.planItems || [];
    const pendingItem = planItems.find(item => item.status === 'not_started' || item.status === 'in_progress');
    
    if (pendingItem) {
      return `Следующий шаг: подобрать ${pendingItem.title.toLowerCase()} в NADO`;
    }
    return 'Все основные этапы запланированы. Проверьте смету и договоры!';
  };

  return (
    <div className="min-h-screen pb-32 flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans" id="home-view">
      <AppHeader />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* Profile Greeting Section */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--text-secondary)] tracking-wide">
            {greeting}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Праздник надо? <span className="text-[var(--gold-primary)]">Создай в NADO</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl">
            Соберите мероприятие целиком или найдите нужных специалистов
          </p>
        </div>

        {/* Active Project Card (Prodlzhit Podgotovku) */}
        {activeProject && (
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[var(--gold-primary)]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-[var(--gold-primary)] uppercase tracking-widest font-semibold block mb-1">
                  Продолжить подготовку
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {activeProject.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                  {activeProject.eventType === 'Wedding' ? 'Свадьба' : activeProject.eventType === 'Birthday' ? 'День рождения' : activeProject.eventType === 'Corporate' ? 'Корпоратив' : activeProject.eventType || 'Праздник'}
                </p>
              </div>

              {/* Progress visual */}
              <div className="flex items-center gap-3 bg-[var(--surface-secondary)] border border-[var(--border-soft)] px-4 py-2.5 rounded-2xl">
                <Percent className="w-4 h-4 text-[var(--gold-primary)]" />
                <div>
                  <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Готовность</div>
                  <div className="text-sm font-bold font-mono">{activeProject.progressPercent || 0}%</div>
                </div>
              </div>
            </div>

            {/* Event Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[var(--border-soft)] pt-6">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Calendar className="w-4 h-4 shrink-0 text-[var(--gold-primary)]" />
                <span>
                  {activeProject.date ? new Date(activeProject.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Дата не выбрана'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Users className="w-4 h-4 shrink-0 text-[var(--gold-primary)]" />
                <span>{activeProject.guestsCount || 0} гостей</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] col-span-2 sm:col-span-1">
                <Wallet className="w-4 h-4 shrink-0 text-[var(--gold-primary)]" />
                <span className="font-semibold font-mono text-[var(--text-primary)]">
                  {(activeProject.budgetTotal || 0).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>

            {/* Next Step / Action bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-secondary)] p-4 rounded-2xl border border-[var(--border-soft)]">
              <div className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                {getNextAction(activeProject)}
              </div>
              <button
                onClick={() => navigate(`/events/${activeProject.id}`)}
                className="self-end sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#151D2D] to-[#263550] border border-[var(--border-strong)] rounded-xl text-xs font-semibold text-white hover:brightness-115 active:scale-95 transition-all"
              >
                <span>Продолжить</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {hasMultipleProjects && (
              <div className="text-left">
                <Link to="/events" className="text-xs text-[var(--gold-primary)] font-semibold hover:underline">
                  Все мои мероприятия →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Two Main Large CTA Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Собрать праздник */}
          <button
            onClick={() => navigate('/create-event')}
            className="text-left flex flex-col justify-between p-8 rounded-3xl border border-[var(--border-primary)] shadow-md min-h-[220px] transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #151D2D, #263550)',
              border: '1px solid rgba(210, 183, 117, 0.45)'
            }}
            id="act-assemble"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[var(--gold-primary)] mb-6">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Собрать праздник
                </h3>
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-gray-300 font-medium mt-2 leading-relaxed">
                Расскажите о событии. NADO предложит формат, бюджет, площадку и план подготовки
              </p>
            </div>
          </button>

          {/* Card 2: Найти специалистов */}
          <button
            onClick={() => navigate('/search')}
            className="group text-left flex flex-col justify-between p-8 bg-[var(--surface-primary)] border border-[var(--border-primary)] hover:border-[var(--gold-primary)]/40 rounded-3xl shadow-md min-h-[220px] relative overflow-hidden transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            id="act-find"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] flex items-center justify-center text-[var(--gold-primary)] mb-6">
              <Search className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                  Найти специалистов
                </h3>
                <ArrowRight className="w-5 h-5 text-[var(--text-primary)] group-hover:translate-x-1 transition-transform group-hover:text-[var(--gold-primary)]" />
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                Площадки, ведущие, диджеи, фотографы, декораторы и другие услуги
              </p>
            </div>
          </button>
        </div>

        {/* Compact Useful Tools Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-muted)] text-left uppercase tracking-wider pl-1 font-mono">
            Полезные инструменты NADO
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Рассчитать бюджет */}
            <button
              onClick={() => {
                if (activeProject) {
                  navigate(`/events/${activeProject.id}?tab=budget`);
                } else {
                  navigate('/create-event');
                }
              }}
              className="group text-left flex items-center justify-between p-5 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl hover:border-[var(--gold-primary)]/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] flex items-center justify-center text-[var(--gold-primary)]">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Рассчитать бюджет
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Распределение расходов и контроль оплат
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-1 group-hover:text-[var(--gold-primary)] transition-all" />
            </button>

            {/* Рассчитать напитки */}
            <button
              onClick={() => navigate('/drinks-calculator')}
              className="group text-left flex items-center justify-between p-5 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl hover:border-[var(--gold-primary)]/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] flex items-center justify-center text-[var(--gold-primary)]">
                  <Wine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Рассчитать напитки
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Калькулятор закупки алкоголя и соков
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-1 group-hover:text-[var(--gold-primary)] transition-all" />
            </button>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
