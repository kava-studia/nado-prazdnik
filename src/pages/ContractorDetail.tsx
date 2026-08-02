import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Award, 
  ShieldCheck, 
  Calendar, 
  Heart, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Building2, 
  User, 
  Music, 
  Camera, 
  Video, 
  Flower2, 
  Utensils, 
  Volume2, 
  Car, 
  CalendarCheck,
  CalendarDays,
  Check
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { 
  PrimaryButton, 
  SecondaryButton, 
  BottomSheet, 
  FormField 
} from '../components/UI';
import { allContractorFixtures } from '../demo/fixtures/contractors';
import { Contractor } from '../types';

const categoryIconMap: Record<string, any> = {
  venues: Building2,
  hosts: User,
  djs: Music,
  photographers: Camera,
  videographers: Video,
  decorators: Flower2,
  artists: Sparkles,
  catering: Utensils,
  equipment: Volume2,
  transport: Car,
  coordinators: CalendarCheck,
};

const categoryNameMap: Record<string, string> = {
  venues: 'Площадка',
  hosts: 'Ведущий',
  djs: 'Диджей',
  photographers: 'Фотограф',
  videographers: 'Видеограф',
  decorators: 'Декоратор',
  artists: 'Артист',
  catering: 'Кейтеринг',
  equipment: 'Звук и свет',
  transport: 'Транспорт',
  coordinators: 'Координатор',
};

export default function ContractorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  
  // App / Project Context
  const [hasProject, setHasProject] = useState(false);
  const [projectDate, setProjectDate] = useState('');

  // Bottom Sheets / Dialogs
  const [isNoProjectOpen, setIsNoProjectOpen] = useState(false);
  const [isDiscussOpen, setIsDiscussOpen] = useState(false);
  const [discussName, setDiscussName] = useState('');
  const [discussPhone, setDiscussPhone] = useState('');
  const [discussSuccess, setDiscussSuccess] = useState(false);

  useEffect(() => {
    const found = allContractorFixtures.find((item) => item.id === id);
    if (found) {
      setContractor(found);
      
      // Load favorite status
      const favorites = JSON.parse(localStorage.getItem('nado_favorites') || '[]');
      setIsFavorite(favorites.includes(found.id));
    }

    // Check project status in localStorage
    try {
      const savedActiveId = localStorage.getItem('nado_holiday_active_project_id');
      const savedProjectsStr = localStorage.getItem('nado_holiday_projects');
      if (savedProjectsStr) {
        const parsedProjects = JSON.parse(savedProjectsStr) as any[];
        const activeProject = parsedProjects.find(p => p.id === savedActiveId) || parsedProjects[0];
        if (activeProject) {
          setHasProject(true);
          if (activeProject.date && activeProject.date !== 'Дата обсуждается') {
            setProjectDate(activeProject.date);
            setSelectedDate(activeProject.date); // Default selected date to project date
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  if (!contractor) {
    return (
      <div className="min-h-screen text-[var(--color-text)] flex flex-col justify-between">
        <AppHeader title="Специалист" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--color-gold)] border-t-transparent animate-spin" />
          <p className="text-[var(--color-text-secondary)] text-sm font-bold">Загружаем профиль специалиста...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('nado_favorites') || '[]');
    let updated: string[];

    if (isFavorite) {
      updated = favorites.filter((favId: string) => favId !== contractor.id);
    } else {
      updated = [...favorites, contractor.id];
    }

    localStorage.setItem('nado_favorites', JSON.stringify(updated));
    setIsFavorite(!isFavorite);
  };

  // Check if available on chosen date
  const isAvailableOnDate = selectedDate ? contractor.freeDates.includes(selectedDate) : true;

  const handleBookingClick = () => {
    if (!hasProject) {
      // Prompt user to create event first
      setIsNoProjectOpen(true);
      return;
    }
    
    // Find active project id to route correctly
    let activeProjId = '';
    try {
      activeProjId = localStorage.getItem('nado_holiday_active_project_id') || '';
      if (!activeProjId) {
        const savedProjectsStr = localStorage.getItem('nado_holiday_projects');
        if (savedProjectsStr) {
          const parsed = JSON.parse(savedProjectsStr);
          if (parsed && parsed.length > 0) {
            activeProjId = parsed[0].id;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (activeProjId) {
      navigate(`/booking/${contractor.id}?date=${selectedDate}&eventId=${activeProjId}`);
    } else {
      setIsNoProjectOpen(true);
    }
  };

  const handleDiscussSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussName || !discussPhone) return;

    // Save request to localStorage requests
    const discussReq = {
      id: 'disc-' + Date.now(),
      category: contractor.category,
      categoryLabel: categoryNameMap[contractor.category] || contractor.category,
      name: discussName,
      phone: discussPhone,
      eventType: 'Обсуждение деталей',
      date: selectedDate || 'Обсуждается',
      comment: `Запрос на обсуждение деталей с ${contractor.name}`,
      status: 'pending',
      createdAt: new Date().toLocaleDateString('ru-RU')
    };

    const prevRequests = JSON.parse(localStorage.getItem('nado_holiday_requests') || '[]');
    localStorage.setItem('nado_holiday_requests', JSON.stringify([...prevRequests, discussReq]));

    setDiscussSuccess(true);
    setTimeout(() => {
      setDiscussSuccess(false);
      setIsDiscussOpen(false);
      setDiscussName('');
      setDiscussPhone('');
    }, 2000);
  };

  const IconComponent = categoryIconMap[contractor.category] || Sparkles;
  const hasImage = contractor.image && !contractor.image.includes('unsplash.com');
  const isMcKava = contractor.id === 'mc-kava';

  return (
    <div className="min-h-screen pb-32 flex flex-col justify-between font-sans text-[var(--text-primary)] bg-[var(--background-primary)] animate-fade-in" id="contractor-detail-view">
      <AppHeader title={contractor.name} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 text-left">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          
          {/* LEFT COLUMN: Media & Photo */}
          <div className="md:col-span-5 space-y-6">
            <div className="relative aspect-[4/3] md:aspect-square w-full rounded-[24px] overflow-hidden border border-[var(--border-soft)] bg-[var(--background-secondary)] flex items-center justify-center shadow-md">
              {hasImage ? (
                <img
                  src={contractor.image}
                  alt={contractor.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 text-[var(--text-secondary)]">
                  <div className="w-20 h-20 rounded-full bg-[var(--gold-highlight)] flex items-center justify-center text-[var(--gold-deep)] mb-4 shadow-sm">
                    <IconComponent className="w-10 h-10" />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                    {categoryNameMap[contractor.category]}
                  </span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Favorite Button */}
              <button
                onClick={toggleFavorite}
                className="absolute top-4 right-4 w-11 h-11 rounded-full bg-[var(--background-elevated)]/90 backdrop-blur-md text-[var(--text-primary)] hover:text-red-500 hover:scale-110 active:scale-95 flex items-center justify-center border border-[var(--border-soft)] transition-all z-10 cursor-pointer shadow-md"
                id="detail-favorite-button"
                aria-label="В избранное"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-[var(--text-primary)]'}`} />
              </button>
            </div>

            {/* Price & Availability Card */}
            <div className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-5 shadow-sm">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Стоимость услуг</span>
                <span className="text-xl font-black text-[var(--text-primary)] font-mono">
                  от {contractor.price.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              {/* Date Availability Checker */}
              <div className="space-y-3 pt-3 border-t border-[var(--border-soft)]">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Проверить занятость специалиста
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-[var(--background-secondary)] border border-[var(--border-strong)] hover:border-[var(--gold-primary)]/50 focus:border-[var(--gold-primary)] focus:outline-none rounded-xl p-3 text-[var(--text-primary)] text-xs font-bold cursor-pointer"
                  min={new Date().toISOString().split('T')[0]}
                />

                {selectedDate ? (
                  isAvailableOnDate ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#3E8B65] bg-[#EAF5EE] border border-[#3E8B65]/20 px-3.5 py-2.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Свободен на выбранную дату!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#B94D4D] bg-[#FDF0F0] border border-[#B94D4D]/25 px-3.5 py-2.5 rounded-xl">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Занят в этот день
                    </div>
                  )
                ) : (
                  <p className="text-xs text-[var(--color-text-secondary)]">Выберите дату, чтобы проверить свободность специалиста.</p>
                )}
              </div>

              {/* Action Booking Row */}
              <div className="pt-2">
                {isMcKava ? (
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleBookingClick}
                      className="w-full py-3 premium-gold-button font-bold text-xs"
                    >
                      Пригласить DJ NADO
                    </button>
                    <button 
                      onClick={() => setIsDiscussOpen(true)}
                      className="w-full py-3 bg-[var(--background-secondary)] hover:bg-[var(--background-elevated)] border border-[var(--border-soft)] text-[var(--text-primary)] text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Обсудить мероприятие
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleBookingClick}
                    disabled={selectedDate ? !isAvailableOnDate : false}
                    className="w-full py-3 premium-gold-button font-bold text-xs disabled:opacity-40 disabled:pointer-events-none"
                    id="cta-book-contractor"
                  >
                    {selectedDate && !isAvailableOnDate ? 'Занят на выбранную дату' : 'Забронировать специалиста'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Bio, Specs & Details (Takes 7 cols on md) */}
          <div className="md:col-span-7 space-y-8">
            {/* Header Bio */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-[var(--color-champagne)] border border-[var(--color-gold)]/20 text-[var(--color-gold-deep)] text-xs font-bold tracking-wider px-3 py-1 rounded-full uppercase">
                  {categoryNameMap[contractor.category]}
                </span>
                
                {/* Do not show ratings or reviews if MC KAVA */}
                {!isMcKava && contractor.reviewsCount > 0 && (
                  <span className="flex items-center gap-1 bg-white border border-[var(--color-border)] text-[var(--color-text)] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    <Star className="w-3.5 h-3.5 text-[var(--color-gold-deep)] fill-[var(--color-gold-deep)]" />
                    {contractor.rating.toFixed(1)} ({contractor.reviewsCount} отзывов)
                  </span>
                )}

                <span className="flex items-center gap-1.5 bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Опыт {contractor.experience} лет
                </span>
                
                <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider pl-1">
                  {contractor.city}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight leading-tight">
                {contractor.name}
              </h2>
            </div>

            {/* Founder's Choice Block */}
            {contractor.isFounderChoice && (
              <div className="bg-[var(--color-champagne)]/60 rounded-[20px] p-5 border border-[var(--color-gold)]/20 relative overflow-hidden space-y-2 text-left shadow-sm">
                <div className="absolute top-0 right-0 p-3 bg-[var(--color-champagne)] border-l border-b border-[var(--color-gold)]/10 rounded-bl-2xl">
                  <Sparkles className="w-4 h-4 text-[var(--color-gold-deep)]" />
                </div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-gold-deep)]">
                  Выбор основателя NADO ПРАЗДНИК
                </h3>
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] font-medium">
                  «Я лично работал с {contractor.name} на десятках крупнейших премиальных ивентов. Главная его суперсила — это умение заставить танцевать и чувствовать себя комфортно абсолютно всех присутствующих. Вся техническая составляющая райдера всегда безупречна. Рекомендую без сомнений!»
                </p>
              </div>
            )}

            {/* About Section */}
            <div className="space-y-3 text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">О подрядчике</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] font-medium">
                {contractor.description}
              </p>
            </div>

            {/* Service Inclusions */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Что входит в стоимость</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contractor.serviceIncludes.map((inc, i) => (
                  <div key={i} className="flex gap-2.5 items-start text-xs bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-xl p-3.5 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-[var(--gold-primary)] shrink-0 mt-0.5" />
                    <span className="text-[var(--text-primary)] leading-tight font-bold">{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            {contractor.equipment && contractor.equipment.length > 0 && (
              <div className="space-y-4 text-left">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Оборудование</h3>
                <div className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[20px] p-5 space-y-3 shadow-sm">
                  {contractor.equipment.map((eq, i) => (
                    <div key={i} className="flex gap-3 items-start text-xs text-[var(--text-primary)] font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)] shrink-0 mt-1.5" />
                      <span>{eq}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Free Dates Grid */}
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Свободные даты</h3>
                <span className="text-xs text-[#3E8B65] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3E8B65]" /> Свободен в эти дни
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {contractor.freeDates.map((date, i) => {
                  const formattedDate = new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                  const isChosen = date === selectedDate;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isChosen
                          ? 'bg-[var(--gold-primary)] border-[var(--gold-primary)] text-white shadow-md'
                          : 'bg-[var(--background-elevated)] border border-[var(--border-soft)] hover:border-[var(--gold-primary)]/40 text-[var(--text-secondary)] shadow-sm'
                      }`}
                    >
                      {formattedDate}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work Terms */}
            <div className="space-y-5 border-t border-[var(--border-soft)] pt-6 text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Условия работы и оплаты</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[var(--background-elevated)] border border-[var(--border-soft)] p-5 rounded-[20px] space-y-2 shadow-sm">
                  <p className="font-bold text-[var(--gold-primary)] uppercase text-xs tracking-wider">Расчет и оплата</p>
                  <p className="text-[var(--text-secondary)] leading-relaxed font-semibold">{contractor.paymentTerms}</p>
                </div>

                <div className="bg-[var(--background-elevated)] border border-[var(--border-soft)] p-5 rounded-[20px] space-y-2 shadow-sm">
                  <p className="font-bold text-[var(--gold-primary)] uppercase text-xs tracking-wider">Дополнительные расходы</p>
                  <p className="text-[var(--text-secondary)] leading-relaxed font-semibold">{contractor.extraCosts}</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      <BottomNavigation />

      {/* NO PROJECT ALERT */}
      <BottomSheet 
        isOpen={isNoProjectOpen} 
        onClose={() => setIsNoProjectOpen(false)}
        title="Сначала создайте мероприятие"
      >
        <div className="p-1 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-[var(--color-champagne)] flex items-center justify-center text-[var(--color-gold-deep)] mx-auto shadow-sm">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-lg font-black text-[var(--color-text)]">Для бронирования нужно мероприятие</h4>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto leading-relaxed">
              Создайте мероприятие в несколько шагов, чтобы мы могли составить смету, проверить график специалистов и синхронизировать ваши задачи.
            </p>
          </div>
          <div className="pt-2 flex gap-3">
            <SecondaryButton onClick={() => setIsNoProjectOpen(false)} className="flex-1">
              Отмена
            </SecondaryButton>
            <button 
              onClick={() => navigate('/create-event')} 
              className="flex-1 py-3 premium-gold-button font-bold text-xs"
            >
              Создать мероприятие
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* DISCUSSION FORM */}
      <BottomSheet 
        isOpen={isDiscussOpen} 
        onClose={() => setIsDiscussOpen(false)}
        title="Обсудить мероприятие с DJ NADO"
      >
        <div className="p-1 text-left space-y-5">
          {discussSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EAF5EE] flex items-center justify-center text-[#3E8B65] shadow-sm">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-lg font-bold text-[var(--text-primary)]">Заявка отправлена!</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                DJ NADO свяжется с вами для обсуждения деталей вашего события.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDiscussSubmit} className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Оставьте контактные данные, и команда NADO свяжется с вами в течение рабочего дня.
              </p>
              <FormField
                label="Ваше имя"
                placeholder="Алексей"
                value={discussName}
                onChange={(e) => setDiscussName(e.target.value)}
                required
              />
              <FormField
                label="Телефон"
                placeholder="+7 (999) 123-45-67"
                value={discussPhone}
                onChange={(e) => setDiscussPhone(e.target.value)}
                required
              />
              <div className="pt-2 flex gap-3">
                <SecondaryButton type="button" onClick={() => setIsDiscussOpen(false)} className="flex-1">
                  Отмена
                </SecondaryButton>
                <button type="submit" className="flex-1 py-3 premium-gold-button font-bold text-xs">
                  Жду звонка
                </button>
              </div>
            </form>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
