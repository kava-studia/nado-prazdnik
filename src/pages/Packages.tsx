import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Check, Layers, Star, ArrowLeft } from 'lucide-react';
import { getProjects, saveProject } from '../services/eventlyStorage';
import { EventProject, BudgetCategory } from '../types';

export default function Packages() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<EventProject | null>(null);

  useEffect(() => {
    const projects = getProjects();
    const found = projects.find(p => p.id === eventId);
    if (found) {
      setProject(found);
    } else {
      navigate('/');
    }
  }, [eventId, navigate]);

  if (!project) {
    return (
      <div className="min-h-screen text-[var(--color-text)] flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--color-gold)]" />
      </div>
    );
  }

  const packages = [
    {
      id: 'budget_save' as const,
      name: 'Базовый',
      badge: 'Минимальный контроль',
      description: 'Идеально для камерных событий с небольшим числом гостей. Фокус на ключевых подрядчиках.',
      icon: Layers,
      multiplier: 0.7,
      explanation: 'Только самые важные позиции — площадка, ведущий, диджей и фотограф. Декор базовый, без сложных световых инсталляций.',
      categories: ['venue', 'host', 'dj', 'photographer', 'drinks'],
      budgetDistribution: {
        'Аренда площадки': 0.45,
        'Ведущий события': 0.20,
        'Диджей и звук': 0.15,
        'Фотограф': 0.12,
        'Напитки и закупка': 0.08
      },
      obligatory: ['Аренда зала', 'Звуковое оборудование', 'Работа ведущего (4 ч)', 'Репортажная съемка (5 ч)'],
      additional: ['Координатор на день', 'Дополнительный свет', 'Печать пригласительных'],
    },
    {
      id: 'balance' as const,
      name: 'Оптимальный',
      badge: 'Популярный выбор',
      description: 'Оптимальное соотношение цены и наполнения. Полная команда для полноценного торжества.',
      icon: Sparkles,
      multiplier: 1.0,
      explanation: 'Полный пакет услуг. Включает декор, кейтеринг, видеосъемку, диджея со звуковым и световым оборудованием.',
      categories: ['venue', 'catering', 'host', 'dj', 'photographer', 'videographer', 'decorator', 'equipment', 'drinks'],
      budgetDistribution: {
        'Аренда площадки': 0.35,
        'Кейтеринг и питание': 0.20,
        'Ведущий и шоу': 0.12,
        'Диджей, звук и свет': 0.08,
        'Декор и флористика': 0.10,
        'Фотограф': 0.06,
        'Видеограф': 0.05,
        'Закупка напитков': 0.04,
        'Организационные расходы': 0.0
      },
      obligatory: ['Площадка с банкетным меню', 'Ведущий и сценарий (5 ч)', 'DJ с полным комплектом звука и света', 'Фото и видео съемка (8 ч)', 'Оформление президиума и столов'],
      additional: ['Кавер-группа или артисты', 'Профессиональный тяжелый дым', 'Трансфер гостей'],
    },
    {
      id: 'accent' as const,
      name: 'Максимальный',
      badge: 'Всё включено',
      description: 'Премиальное наполнение без компромиссов. Сложная концепция, топ-команда и координация под ключ.',
      icon: Star,
      multiplier: 1.6,
      explanation: 'Событие «под ключ». Топовые специалисты, расширенная развлекательная программа, флористика премиум-класса и полноценный координационный контроль.',
      categories: ['venue', 'catering', 'host', 'dj', 'photographer', 'videographer', 'decorator', 'florist', 'equipment', 'artists', 'coordinator', 'drinks', 'organizer'],
      budgetDistribution: {
        'Площадка и банкет': 0.30,
        'Премиум кейтеринг': 0.18,
        'Ведущий премиум класса': 0.15,
        'Шоу программа / Кавер-группа': 0.12,
        'Профессиональный DJ, звук, свет, экраны': 0.10,
        'Дизайнерский декор и живая флористика': 0.15,
        'Фотограф & Видеограф топ-уровня': 0.10,
        'Координатор + Организатор 24/7': 0.08,
        'Элитная карта напитков': 0.05,
        'Резерв': 0.02
      },
      obligatory: ['Аренда премиум-локации', 'Гастрономическое меню', 'Режиссерский сценарий', 'Топ-ведущий', 'Концертный звук и световой дизайн', 'Сложный декор масштабных зон', 'Фото/видео команда (10-12 ч)'],
      additional: ['Живой вокал на welcome', 'Подарки гостям', 'Салют / Огненное шоу'],
    }
  ];

  const handleSelectPackage = (pkg: typeof packages[0]) => {
    const customBudgetTotal = Math.round(project.budgetTotal * pkg.multiplier);
    const newBudgetItems: BudgetCategory[] = [];

    Object.entries(pkg.budgetDistribution).forEach(([name, proportion], idx) => {
      newBudgetItems.push({
        id: `budget-${pkg.id}-${idx}`,
        name,
        allocated: Math.round(customBudgetTotal * proportion),
        spent: 0,
        isPaid: false
      });
    });

    const updatedPlanItems = (project.planItems || []).map(item => {
      const isRequiredInPkg = pkg.categories.includes(item.category);
      return {
        ...item,
        required: isRequiredInPkg,
        status: isRequiredInPkg ? item.status : ('skipped' as const)
      };
    });

    const updatedProject: EventProject = {
      ...project,
      selectedPackage: pkg.id,
      budgetTotal: customBudgetTotal,
      budgetItems: newBudgetItems,
      planItems: updatedPlanItems
    };

    saveProject(updatedProject);
    navigate(`/events/${eventId}/plan`);
  };

  return (
    <div className="min-h-screen pb-24 font-sans text-[var(--color-text)] animate-fade-in" id="packages-view">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center gap-4 text-left">
          <button 
            onClick={() => navigate(`/events/${eventId}/plan`)} 
            className="p-2 bg-[var(--color-background-soft)] hover:bg-[var(--color-border)]/20 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[var(--color-text)]">Варианты сборки</h1>
            <p className="text-xs text-[var(--color-text-secondary)]">Готовые сценарии распределения бюджета</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8 text-left">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-text)]">Выбор концепции бюджета</h1>
          <p className="text-sm text-[var(--color-text-secondary)] font-semibold leading-relaxed max-w-xl">
            Выберите готовую модель распределения бюджета и состава команды. Вы сможете скорректировать её в любой момент.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const IconComponent = pkg.icon;
            const packagePrice = Math.round(project.budgetTotal * pkg.multiplier);
            const isSelected = project.selectedPackage === pkg.id;

            return (
              <div 
                key={pkg.id}
                className={`premium-glass-card rounded-[24px] p-6 flex flex-col justify-between relative overflow-hidden transition-all shadow-sm ${
                  isSelected 
                    ? 'border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]/40' 
                    : 'border-[var(--color-border)] hover:border-[var(--color-gold)]/20'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-[var(--color-gold)] text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Выбран
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-champagne)] border border-[var(--color-gold)]/10 flex items-center justify-center text-[var(--color-gold-deep)]">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-[var(--color-text)] leading-tight">{pkg.name}</h3>
                      <p className="text-xs font-bold text-[var(--color-gold-deep)] uppercase tracking-wider mt-0.5">{pkg.badge}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-semibold">{pkg.description}</p>

                  <div className="bg-white/50 rounded-xl p-3.5 border border-[var(--color-border)] text-xs text-left shadow-xs">
                    <p className="font-bold text-[var(--color-text)] mb-1">Особенности:</p>
                    <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed font-semibold">{pkg.explanation}</p>
                  </div>

                  {/* Obligatory Services */}
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-[var(--color-text)] text-xs uppercase tracking-wider text-xs">Основные услуги:</p>
                    <ul className="space-y-1.5 pl-0.5">
                      {pkg.obligatory.map((srv, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)] font-semibold leading-tight">
                          <Check className="w-3.5 h-3.5 text-[#3E8B65] shrink-0 mt-0.5" />
                          <span>{srv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-2 text-xs pt-1">
                    <p className="font-bold text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Дополнительно:</p>
                    <ul className="space-y-1.5 pl-0.5">
                      {pkg.additional.map((srv, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)]/70 font-semibold leading-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-deep)]/40 shrink-0 mt-1.5" />
                          <span>{srv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[var(--color-border)] space-y-4">
                  <div>
                    <span className="text-xs text-[var(--color-text-secondary)] uppercase font-black tracking-wider">Ориентировочный бюджет:</span>
                    <p className="text-xl font-black text-[var(--color-text)] font-mono mt-0.5">
                      {packagePrice.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectPackage(pkg)}
                    className="w-full py-3 rounded-xl font-bold text-xs cursor-pointer text-center bg-white border border-[var(--color-border)] hover:border-[var(--color-gold)] text-[var(--color-text)] transition-all shadow-xs"
                  >
                    Выбрать этот вариант
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back option */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate(`/events/${eventId}/plan`)}
            className="text-xs font-black text-[var(--color-gold-deep)] hover:underline cursor-pointer uppercase tracking-wider"
          >
            Вернуться к плану мероприятия
          </button>
        </div>
      </main>
    </div>
  );
}
