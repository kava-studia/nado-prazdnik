import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Check, 
  HelpCircle,
  Building2, 
  User, 
  Music, 
  Camera, 
  Video, 
  Flower2, 
  Utensils, 
  Volume2, 
  GlassWater, 
  CalendarRange,
  X,
  AlertCircle
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { 
  PrimaryButton, 
  SecondaryButton, 
  PageTitle, 
  SectionCard, 
  FormField, 
  NumberStepper, 
  ProgressSteps 
} from '../components/UI';
import { ProjectState, Task } from '../types';
import { generateEventPlan } from '../services/eventPlanGenerator';
import { saveProject, setActiveProjectId, getProjectById } from '../services/eventlyStorage';
import { BOOKABLE_SERVICE_OPTIONS } from '../data/eventPlanTemplates';

type ServiceChoice = 'need' | 'have';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Form State
  const [eventType, setEventType] = useState('');
  const [city, setCity] = useState('Москва');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [dateUnknown, setDateUnknown] = useState(false);
  const [guestsCount, setGuestsCount] = useState(30);
  const [budgetRange, setBudgetRange] = useState('');
  const [serviceChoices, setServiceChoices] = useState<Record<string, ServiceChoice>>({});
  const [preferredStyles, setPreferredStyles] = useState<string[]>([]);

  // Validation & Save Error States
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState(false);

  // Initialize from search query parameters if available (e.g. from Home page quick actions)
  useEffect(() => {
    const typeQuery = searchParams.get('type');
    if (typeQuery) {
      if (typeQuery === 'Wedding') setEventType('Свадьба');
      else if (typeQuery === 'Birthday') setEventType('День рождения');
      else if (typeQuery === 'Corporate') setEventType('Корпоратив');
      else setEventType(typeQuery);
    }
  }, [searchParams]);

  // Dropdown options
  const eventTypes = [
    'Свадьба',
    'День рождения',
    'Корпоратив',
    'Выпускной',
    'Детский праздник',
    'Концерт',
    'Фестиваль',
    'Другое'
  ];

  const budgetRanges = [
    { label: 'До 300 000 ₽', value: '300000' },
    { label: '300 000 — 500 000 ₽', value: '500000' },
    { label: '500 000 — 1 000 000 ₽', value: '1000000' },
    { label: '1 000 000 — 2 000 000 ₽', value: '2000000' },
    { label: 'Более 2 000 000 ₽', value: '5000000' },
    { label: 'Пока не знаю', value: 'unknown' }
  ];

  const styleOptions = [
    'Современно',
    'Камерно',
    'Яркая вечеринка',
    'За городом',
    'Классика',
    'Необычный формат',
    'Пока не знаю'
  ];

  const handleNext = () => {
    setError('');

    // Step validations
    if (step === 1 && !eventType) {
      setError('Выберите тип праздника');
      return;
    }
    if (step === 2 && !city.trim()) {
      setError('Укажите город проведения праздника');
      return;
    }
    if (step === 3 && !dateUnknown && !date) {
      setError('Укажите точную дату или выберите «Точная дата пока неизвестна»');
      return;
    }
    if (step === 5 && !budgetRange) {
      setError('Выберите диапазон общего бюджета');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      saveEvent();
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const handleSkip = () => {
    setError('');
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      saveEvent();
    }
  };

  const setServiceChoice = (category: string, choice?: ServiceChoice) => {
    setServiceChoices((current) => {
      const next = { ...current };
      if (!choice || current[category] === choice) {
        delete next[category];
      } else {
        next[category] = choice;
      }
      return next;
    });
  };

  const togglePreferredStyle = (val: string) => {
    if (val === 'Пока не знаю') {
      setPreferredStyles(['Пока не знаю']);
      return;
    }
    const filtered = preferredStyles.filter(item => item !== 'Пока не знаю');
    if (filtered.includes(val)) {
      setPreferredStyles(filtered.filter(item => item !== val));
    } else {
      setPreferredStyles([...filtered, val]);
    }
  };

  const saveEvent = () => {
    let budgetTotal = 0;
    if (budgetRange === '300000') budgetTotal = 250000;
    else if (budgetRange === '500000') budgetTotal = 400000;
    else if (budgetRange === '1000000') budgetTotal = 750000;
    else if (budgetRange === '2000000') budgetTotal = 1500000;
    else if (budgetRange === '5000000') budgetTotal = 3500000;
    else budgetTotal = 0;

    const alreadyHave = Object.entries(serviceChoices)
      .filter(([, choice]) => choice === 'have')
      .map(([category]) => category);
    const requestedServices = Object.entries(serviceChoices)
      .filter(([, choice]) => choice === 'need')
      .map(([category]) => category);

    const newProject = generateEventPlan({
      eventType,
      city,
      address,
      date: dateUnknown ? 'Дата обсуждается' : date,
      time,
      dateUnknown,
      guestsCount,
      budgetRange,
      budgetTotal,
      style: preferredStyles.join(', '),
      alreadyHave,
      requestedServices
    });

    const saveResult = saveProject(newProject);
    
    if (saveResult.success && saveResult.project) {
      setActiveProjectId(saveResult.project.id);
      setSaveError(false);
      navigate(`/events/${saveResult.project.id}/plan-created`);
    } else {
      setSaveError(true);
    }
  };

  if (saveError) {
    return (
      <div className="min-h-screen pb-10 flex flex-col justify-center items-center font-sans text-center px-4" id="save-error-state">
        <div className="max-w-md w-full bg-[var(--background-elevated)] border border-[var(--border-strong)] rounded-[24px] p-8 shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto border border-red-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">Не удалось сохранить проект NADO</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
              Пожалуйста, проверьте дисковое пространство или настройки cookies вашего веб-браузера и повторите попытку.
            </p>
          </div>
          <PrimaryButton
            onClick={() => {
              setSaveError(false);
              saveEvent();
            }}
            className="w-full"
          >
            Попробовать снова
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text-primary)] pb-12 flex flex-col justify-between font-sans" id="create-event-view">
      <AppHeader title="Конструктор праздника NADO" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-between min-h-[72vh]">
        
        {step <= totalSteps ? (
          <div className="space-y-8 flex-1 flex flex-col justify-between">
            {/* Progress Header */}
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-[var(--text-secondary)]">
                <span>Шаг {step} из {totalSteps}</span>
                <span className="text-[var(--gold-primary)] font-mono">{Math.round((step / totalSteps) * 100)}% заполнено</span>
              </div>
              <ProgressSteps totalSteps={totalSteps} currentStep={step} />
            </div>

            {/* Step Body */}
            <div className="flex-1 py-4 flex flex-col justify-center">
              
              {/* STEP 1: Event Type */}
              {step === 1 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <PageTitle 
                    title="Что вы планируете устроить?" 
                    subtitle="Выберите правильный формат. Мы автоматически оптимизируем чек-лист и приоритеты расходов NADO" 
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {eventTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setEventType(type)}
                        className={`p-4 rounded-[18px] border text-left text-sm sm:text-base font-extrabold transition-all cursor-pointer shadow-sm ${
                          eventType === type
                            ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] text-[var(--gold-deep)] font-black shadow-inner scale-[1.02]'
                            : 'bg-[var(--background-elevated)] border-[var(--border-soft)] hover:border-[var(--gold-primary)]/40 text-[var(--text-secondary)]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Location */}
              {step === 2 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <PageTitle 
                    title="Где будет проходить событие?" 
                    subtitle="Укажите город проведения и ориентиры по площадке" 
                  />
                  <div className="space-y-4">
                    <FormField 
                      label="Город события" 
                      placeholder="Например, Москва" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                    />
                    <FormField 
                      label="Точный адрес или название площадки (если известно)" 
                      placeholder="Например, загородный клуб, Вилла Роден, Офис компании" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                    />
                    
                    <div className="space-y-2 mt-4">
                      <label className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] pl-1">Что делаем с площадкой?</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => setServiceChoice('venue', 'have')}
                          aria-pressed={serviceChoices.venue === 'have'}
                          className={`p-3.5 rounded-[14px] border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm ${
                            serviceChoices.venue === 'have'
                              ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] text-[var(--gold-deep)] font-black'
                              : 'bg-[var(--background-elevated)] border-[var(--border-soft)] text-[var(--text-secondary)]'
                          }`}
                        >
                          Уже выбрана
                        </button>
                        <button
                          onClick={() => setServiceChoice('venue', 'need')}
                          aria-pressed={serviceChoices.venue === 'need'}
                          className={`p-3.5 rounded-[14px] border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm ${
                            serviceChoices.venue === 'need'
                              ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] text-[var(--gold-deep)] font-black'
                              : 'bg-[var(--background-elevated)] border-[var(--border-soft)] text-[var(--text-secondary)]'
                          }`}
                        >
                          Нужно найти
                        </button>
                        <button
                          onClick={() => setServiceChoice('venue')}
                          aria-pressed={!serviceChoices.venue}
                          className={`p-3.5 rounded-[14px] border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm ${
                            !serviceChoices.venue
                              ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] text-[var(--gold-deep)] font-black'
                              : 'bg-[var(--background-elevated)] border-[var(--border-soft)] text-[var(--text-secondary)]'
                          }`}
                        >
                          Пока не нужна
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Date */}
              {step === 3 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <PageTitle 
                    title="Когда намечается торжество?" 
                    subtitle="Выберите точный день или укажите, что дата на согласовании" 
                  />
                  <div className="space-y-4">
                    {!dateUnknown && (
                      <div className="space-y-4">
                        <FormField 
                          label="Дата события" 
                          type="date" 
                          value={date} 
                          onChange={(e) => setDate(e.target.value)} 
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <FormField 
                          label="Ориентировочное время начала" 
                          type="time" 
                          value={time} 
                          onChange={(e) => setTime(e.target.value)} 
                        />
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setDateUnknown(!dateUnknown);
                        setDate('');
                      }}
                      className={`w-full p-4 rounded-[14px] border flex items-center justify-between text-left transition-all cursor-pointer shadow-sm ${
                        dateUnknown
                          ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] text-[var(--gold-deep)] font-black'
                          : 'bg-[var(--background-elevated)] border-[var(--border-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <span className="font-bold text-sm sm:text-base">Дата пока не согласована (в обсуждении)</span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ml-2 ${dateUnknown ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]' : 'border-[var(--border-soft)]'}`}>
                        {dateUnknown && <Check className="w-3.5 h-3.5 text-[#171A20] stroke-[3]" />}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Guests */}
              {step === 4 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <PageTitle 
                    title="Сколько приглашенных гостей?" 
                    subtitle="Это поможет рассчитать банкетный зал, рассадку, закупку напитков и декорации" 
                  />
                  <div className="py-6">
                    <NumberStepper 
                      label="Количество человек" 
                      value={guestsCount} 
                      onChange={(val) => setGuestsCount(Math.max(1, val))} 
                      min={1}
                      max={2000}
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: Budget */}
              {step === 5 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <PageTitle 
                    title="Каков примерный бюджет?" 
                    subtitle="Распределим средства по ключевым сегментам по уникальной методологии NADO" 
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {budgetRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setBudgetRange(range.value)}
                        className={`p-4 rounded-[18px] border text-left text-sm sm:text-base font-extrabold transition-all cursor-pointer shadow-sm ${
                          budgetRange === range.value
                            ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] text-[var(--gold-deep)] font-black shadow-inner scale-[1.01]'
                            : 'bg-[var(--background-elevated)] border-[var(--border-soft)] hover:border-[var(--gold-primary)]/40 text-[var(--text-secondary)]'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 6: Event composition */}
              {step === 6 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <PageTitle 
                    title="Что включаем в ваш праздник?"
                    subtitle="Ничего обязательного. Отметьте, что нужно найти через NADO и что у вас уже есть. Остальное не попадёт в прогресс"
                  />
                  <div className="rounded-[16px] border border-[var(--gold-primary)]/20 bg-[var(--gold-highlight)]/45 p-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Хотите камерный ужин без ведущего, домашнюю вечеринку без площадки или событие без организатора - всё нормально. План подстраивается под вас, а не наоборот.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BOOKABLE_SERVICE_OPTIONS.map((opt) => {
                      const choice = serviceChoices[opt.category];
                      return (
                        <div
                          key={opt.category}
                          className={`p-4 rounded-[18px] border text-left transition-all shadow-sm ${
                            choice
                              ? 'bg-[var(--gold-highlight)]/55 border-[var(--gold-primary)]/60'
                              : 'bg-[var(--background-elevated)] border-[var(--border-soft)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-extrabold text-sm text-[var(--text-primary)]">{opt.label}</p>
                              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">{opt.description}</p>
                            </div>
                            {choice && (
                              <div className="w-5 h-5 rounded-full bg-[var(--gold-primary)] flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-[#171A20] stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => setServiceChoice(opt.category, 'need')}
                              aria-pressed={choice === 'need'}
                              className={`px-2 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${choice === 'need' ? 'bg-[var(--gold-primary)] border-[var(--gold-primary)] text-[#171A20]' : 'bg-white/70 border-[var(--border-soft)] text-[var(--text-secondary)]'}`}
                            >
                              Нужно найти
                            </button>
                            <button
                              type="button"
                              onClick={() => setServiceChoice(opt.category, 'have')}
                              aria-pressed={choice === 'have'}
                              className={`px-2 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${choice === 'have' ? 'bg-[#EAF5EE] border-[#3E8B65]/40 text-[#3E8B65]' : 'bg-white/70 border-[var(--border-soft)] text-[var(--text-secondary)]'}`}
                            >
                              Уже есть
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 7: Aesthetic Preferences */}
              {step === 7 && (
                <div className="space-y-5 animate-fade-in text-left">
                  <PageTitle 
                    title="Какой визуальный стиль вам ближе?" 
                    subtitle="Какая концепция, атмосфера или эстетика вам наиболее симпатична?" 
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {styleOptions.map((style) => {
                      const isSelected = preferredStyles.includes(style);
                      return (
                        <button
                          key={style}
                          onClick={() => togglePreferredStyle(style)}
                          className={`p-4 rounded-[18px] border text-left transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                            isSelected
                              ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] text-[var(--gold-deep)] font-black'
                              : 'bg-[var(--background-elevated)] border-[var(--border-soft)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <span className="font-extrabold text-xs sm:text-sm">{style}</span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ml-2 ${isSelected ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]' : 'border-[var(--border-soft)]'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#171A20] stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Validation Feedback */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-3 text-xs sm:text-sm text-red-500 font-bold text-left flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Navigation Buttons footer */}
            <div className="flex gap-4 pt-4 border-t border-[var(--border-soft)] flex-wrap">
              <SecondaryButton onClick={handleBack} className="flex-1 cursor-pointer">
                Назад
              </SecondaryButton>
              
              <button 
                onClick={handleNext} 
                className="flex-1 premium-gold-button h-[52px] font-bold shadow-md cursor-pointer"
              >
                {step === totalSteps ? 'Создать праздник' : 'Дальше'}
              </button>

              {step !== 1 && step !== 4 && (
                <button 
                  onClick={handleSkip} 
                  className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors cursor-pointer px-3 self-center"
                >
                  Пропустить
                </button>
              )}
            </div>

          </div>
        ) : (
          /* STEP 8: Success State fallback */
          <div className="flex-1 flex flex-col justify-center items-center text-center max-w-md mx-auto space-y-6 py-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[var(--gold-highlight)] flex items-center justify-center text-[var(--gold-deep)] border border-[var(--gold-primary)]/20 shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">Всё готово!</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
                Мы создали основу вашего праздника NADO. Все ключевые задачи, подбор подрядчиков и калькуляторы ждут вас.
              </p>
            </div>

            <div className="w-full pt-4">
              <PrimaryButton onClick={() => navigate('/events')}>
                Открыть мои праздники
              </PrimaryButton>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
