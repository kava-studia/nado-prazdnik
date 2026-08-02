import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjects, saveProject, getProjectById } from '../services/eventlyStorage';
import { EventProject, EventPlanItem } from '../types';
import { STATUS_TRANSLATIONS, CATEGORY_TRANSLATIONS } from '../data/eventPlanTemplates';
import { 
  ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Play, AlertCircle, 
  MapPin, Calendar, Users, HelpCircle, FileCheck, Landmark, ShieldCheck 
} from 'lucide-react';

export default function EventPlan() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<EventProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setErrorText('');

    try {
      const foundProject = getProjectById(eventId);

      // Development Mode Diagnostics
      if ((import.meta as any).env?.DEV) {
        console.log('[Dev Diagnostics - EventPlan]', {
          eventId,
          projectsInStorage: getProjects().length,
          projectFound: !!foundProject,
          activeProjectId: localStorage.getItem('evently_active_project_id'),
          schemaVersion: localStorage.getItem('evently_schema_version')
        });
      }

      if (cancelled) return;

      if (foundProject) {
        setProject(foundProject);
        
        // Expand uncompleted steps by default
        const initialExpanded: Record<string, boolean> = {};
        foundProject.planItems.forEach(item => {
          if (item.status !== 'completed' && item.status !== 'skipped') {
            initialExpanded[item.id] = true;
          }
        });
        setExpandedItems(initialExpanded);
      } else {
        setProject(null);
        setErrorText('Мероприятие не найдено. Проверьте правильность ссылки.');
      }
    } catch (error) {
      if (!cancelled) {
        setProject(null);
        setErrorText('Не удалось открыть мероприятие. Ошибка чтения из хранилища.');
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-12 h-12 border-4 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-[var(--color-text-secondary)] font-medium">Синхронизируем панель подготовки...</p>
      </div>
    );
  }

  if (errorText || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full premium-glass-card p-8 text-center shadow-xl">
          <AlertCircle className="w-16 h-16 text-[var(--color-error)] mx-auto mb-6" />
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-text)] mb-2">Не удалось открыть мероприятие</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            {errorText || 'Запрошенный проект не может быть загружен.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/create-event')}
              className="w-full py-3 px-4 premium-gold-button"
            >
              Создать новое мероприятие
            </button>
            <button
              onClick={() => {
                const projects = getProjects();
                if (projects.length > 0) {
                  navigate(`/events/${projects[0].id}`);
                } else {
                  navigate('/');
                }
              }}
              className="w-full py-3 px-4 bg-[var(--color-surface-raised)] hover:bg-[var(--color-background-soft)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-xl transition-all cursor-pointer"
            >
              Выбрать из списка проектов
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = project.planItems.filter(item => item.status === 'completed' || item.status === 'skipped').length;
  const totalCount = project.planItems.length;

  // Determine "What to do right now" (Hero Block)
  const activeStep = project.planItems.find(item => item.status !== 'completed' && item.status !== 'skipped');

  const getStepHeroTitle = (category: string) => {
    switch (category) {
      case 'organizer': return 'Уточните концепцию вашего праздника';
      case 'venue': return 'Выберите площадку проведения';
      case 'catering': return 'Определитесь с кейтерингом и питанием';
      case 'host': return 'Выберите ведущего события';
      case 'dj': return 'Определите звуковое оформление и диджея';
      case 'photographer': return 'Подберите профессионального фотографа';
      case 'videographer': return 'Подберите видеооператора для фильма';
      case 'decorator': return 'Определите декор и флористику';
      case 'equipment': return 'Проверьте технический звук и свет';
      case 'artists': return 'Добавьте выступление артистов';
      case 'transport': return 'Согласуйте логистику и транспорт';
      case 'guests': return 'Составьте точный список гостей';
      case 'seating': return 'Разработайте план рассадки';
      case 'menu': return 'Утвердите и распределите меню';
      case 'drinks': return 'Рассчитайте напитки и алкоголь';
      case 'timeline': return 'Детализируйте тайминг-план дня';
      case 'documents': return 'Проверьте договоры и смету';
      case 'coordinator': return 'Закрепите координатора дня';
      default: return 'Продолжите по шагам';
    }
  };

  const getStepHeroDesc = (category: string) => {
    switch (category) {
      case 'venue': return 'От площадки зависят меню, декор, рассадка, оборудование и пробковый сбор';
      case 'host': return 'Хороший ведущий задает темп празднику, координирует гостей и обеспечивает атмосферу';
      case 'dj': return 'Музыкальное сопровождение, качественная дискотека и фоновые акценты важны для всех';
      case 'drinks': return 'Калькулятор NADO ПРАЗДНИК поможет рассчитать оптимальный объем алкоголя и соков без переплат';
      case 'timeline': return 'Распределите тайминг поминутно, чтобы избежать накладок при подаче блюд и выходе артистов';
      case 'documents': return 'Подпишите OrderTermsSnapshot и подтвердите условия, чтобы заморозить цены исполнителей';
      case 'guests': return 'Заполнение списка гостей поможет рассчитать точное количество посадочных мест и порций';
      default: return 'Этот этап поможет структурировать подготовку и избежать лишних трат в бюджете';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSkipStep = (item: EventPlanItem) => {
    if (item.required) {
      alert('Обязательные этапы нельзя пропускать.');
      return;
    }
    const updatedItems = project.planItems.map(p => {
      if (p.id === item.id) {
        return { ...p, status: 'skipped' as const, skippedAt: new Date().toISOString() };
      }
      return p;
    });

    const updatedProj = { ...project, planItems: updatedItems };
    saveProject(updatedProj);
    setProject(updatedProj);
  };

  const handleMarkHave = (item: EventPlanItem) => {
    const updatedItems = project.planItems.map(p => {
      if (p.id === item.id) {
        return { ...p, status: 'completed' as const, completedAt: new Date().toISOString() };
      }
      return p;
    });

    const updatedProj = { ...project, planItems: updatedItems };
    saveProject(updatedProj);
    setProject(updatedProj);
  };

  const isDatePast = () => {
    if (!project.date || project.date === 'Дата обсуждается') return false;
    const projectDate = new Date(project.date);
    if (isNaN(projectDate.getTime())) return false;
    return projectDate.getTime() < new Date().getTime();
  };

  // Safe color styling mapping for Status Badge (Task 22)
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
      case 'booked':
      case 'confirmed':
        return 'bg-[#EAF5EE] text-[#3E8B65]'; // Quiet Green
      case 'in_progress':
      case 'options_selected':
        return 'bg-[#E3EFFB] text-[#557AA7]'; // Quiet Blue
      case 'awaiting_confirmation':
      case 'request_sent':
        return 'bg-[#FCF4E7] text-[#694619]'; // Quiet Champagne / Bronze
      case 'skipped':
        return 'bg-[#F4F2EE] text-[#978D82]'; // Light Gray / Muted
      case 'rejected':
        return 'bg-[#FDF0F0] text-[#B94D4D]'; // Quiet Red
      default:
        return 'bg-[#F8F5EF] text-[#71685F]'; // Warm neutral
    }
  };

  return (
    <div className="min-h-screen pb-32 font-sans text-[var(--color-text)]">
      {/* Premium Light Header (Task 16) */}
      <header className="sticky top-0 z-30 bg-[#FAF7F1]/82 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate(`/events/${project.id}`)} 
            className="p-2.5 bg-white hover:bg-[var(--color-background-soft)] border border-[var(--color-border)] rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-gold)]" />
          </button>
          <div className="flex-1 min-w-0 text-left">
            <h1 className="text-base font-bold text-[var(--color-text)] truncate">{project.name}</h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)] mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--color-gold)]" /> {project.city}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-gold)]" /> 
                {project.date === 'Дата обсуждается' 
                  ? 'Дата ещё не выбрана' 
                  : isDatePast() 
                    ? 'Мероприятие состоялось' 
                    : new Date(project.date).toLocaleDateString('ru-RU')
                }
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        {/* Progress Block */}
        <section className="premium-glass-card p-5">
          <div className="flex justify-between items-center mb-2 text-left">
            <div>
              <span className="text-xs text-[var(--color-text-secondary)] font-medium">Прогресс подготовки</span>
              <h2 className="text-2xl font-black mt-0.5 text-[var(--color-text)]">{project.progressPercent}%</h2>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] font-mono bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 py-1 rounded-xl">
              Выполнено {completedCount} из {totalCount}
            </span>
          </div>
          <div className="w-full bg-[var(--color-background-soft)] h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-[var(--color-gold)] h-full rounded-full transition-all duration-500" 
              style={{ width: `${project.progressPercent}%` }}
            ></div>
          </div>
        </section>

        {/* Hero Step "What to do right now" (Task 20) */}
        {activeStep && (
          <section className="premium-glass-card p-6 shadow-xl relative overflow-hidden text-left border-[var(--color-gold)]/30">
            <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-[var(--color-gold-light)]/5 blur-3xl rounded-full"></div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold-deep)] bg-[var(--color-champagne)] px-2 py-0.5 rounded">
                Рекомендуемое действие сейчас
              </span>
            </div>

            <h3 className="text-lg font-bold text-[var(--color-text)] mb-1.5">
              {getStepHeroTitle(activeStep.category)}
            </h3>
            
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
              {getStepHeroDesc(activeStep.category)}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(`/events/${project.id}/plan/${activeStep.category}`)}
                className="flex-1 py-3 px-4 premium-gold-button text-xs gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Перейти к выбору
              </button>
              
              <button
                onClick={() => handleMarkHave(activeStep)}
                className="flex-1 py-3 px-4 bg-white hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                У меня уже есть {CATEGORY_TRANSLATIONS[activeStep.category] || 'это'}
              </button>
            </div>
          </section>
        )}

        {/* Steps List */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 pl-1 text-left">
            Карта подготовки по этапам
          </h3>

          <div className="space-y-3 text-left">
            {project.planItems.map((item, index) => {
              const isItemExpanded = !!expandedItems[item.id];
              const isCompleted = item.status === 'completed';
              const isSkipped = item.status === 'skipped';
              const isCurrent = activeStep?.id === item.id;

              return (
                <div 
                  key={item.id}
                  className={`border rounded-[20px] transition-all overflow-hidden ${
                    isCurrent 
                      ? 'border-[var(--color-gold)] bg-white shadow-md' 
                      : isCompleted || isSkipped
                        ? 'border-[var(--color-border)] bg-white/40 opacity-80'
                        : 'border-[var(--color-border)] bg-white/70'
                  }`}
                >
                  {/* Collapsed Header Bar */}
                  <div 
                    onClick={() => toggleExpand(item.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Metallic Gold index circle (Task 20) */}
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted
                          ? 'bg-[#EAF5EE] border border-[#3E8B65]/30 text-[#3E8B65]'
                          : isSkipped
                            ? 'bg-[var(--color-background-soft)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
                            : isCurrent
                              ? 'premium-gold-button w-8 h-8 font-extrabold text-white text-xs'
                              : 'bg-white border border-[var(--color-border)] text-[var(--color-text)]'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[var(--color-text)] truncate">
                            {CATEGORY_TRANSLATIONS[item.category] || item.title}
                          </h4>
                          {item.required && (
                            <span className="text-xs uppercase tracking-widest text-[var(--color-error)] font-bold">
                              Обязательно
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-[280px]">
                          {item.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${getStatusBadgeStyle(item.status)}`}>
                        {STATUS_TRANSLATIONS[item.status] || item.status}
                      </span>
                      {isItemExpanded ? <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" />}
                    </div>
                  </div>

                  {/* Expanded Body Panel */}
                  {isItemExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[var(--color-border)] bg-[var(--color-pearl)] text-xs sm:text-sm space-y-3.5">
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap gap-2.5 pt-2">
                        <button
                          onClick={() => navigate(`/events/${project.id}/plan/${item.category}`)}
                          className="px-4 py-2 premium-gold-button text-xs font-bold"
                        >
                          Перейти к этапу
                        </button>

                        {!isCompleted && !isSkipped && (
                          <button
                            onClick={() => handleMarkHave(item)}
                            className="px-3 py-2 bg-white hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-bold rounded-xl cursor-pointer transition-all"
                          >
                            У меня уже есть
                          </button>
                        )}

                        {!item.required && !isSkipped && !isCompleted && (
                          <button
                            onClick={() => handleSkipStep(item)}
                            className="px-3 py-2 bg-transparent hover:bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs font-semibold rounded-xl cursor-pointer transition-all"
                          >
                            Пропустить
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
