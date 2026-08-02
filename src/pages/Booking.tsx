import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  CheckCircle,
  Building2, 
  User, 
  Music, 
  Camera, 
  Video, 
  Flower2, 
  Utensils, 
  Volume2, 
  Car, 
  CalendarCheck
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import PriceBreakdown from '../components/PriceBreakdown';
import { 
  FormField, 
  PrimaryButton, 
  SecondaryButton, 
  SectionCard 
} from '../components/UI';
import { allContractorFixtures } from '../demo/fixtures/contractors';
import { Contractor, Booking as BookingType, EventProject } from '../types';
import { getProjectById, saveProject, getActiveProject } from '../services/eventlyStorage';

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

export default function Booking() {
  const { contractorId } = useParams<{ contractorId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryDate = searchParams.get('date') || '';
  const queryEventId = searchParams.get('eventId') || '';

  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [targetProject, setTargetProject] = useState<EventProject | null>(null);

  // Form States
  const [date, setDate] = useState('2026-08-15');
  const [startTime, setStartTime] = useState('16:00');
  const [duration, setDuration] = useState(6);
  const [address, setAddress] = useState('г. Москва, ул. Космонавтов, д. 12, к. 2');
  const [eventType, setEventType] = useState('Свадьба');
  const [selectedService, setSelectedService] = useState('Основная программа событий NADO');
  const [comment, setComment] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Upgrades
  const [extraHeavySmoke, setExtraHeavySmoke] = useState(false);
  const [extraLightUp, setExtraLightUp] = useState(false);

  // Success Flow states
  const [isBooked, setIsBooked] = useState(false);
  const [savedBooking, setSavedBooking] = useState<BookingType | null>(null);

  useEffect(() => {
    const found = allContractorFixtures.find((item) => item.id === contractorId);
    if (found) {
      setContractor(found);
    }
    
    // Resolve which project we are booking for
    let proj = getProjectById(queryEventId) || getActiveProject();
    if (proj) {
      setTargetProject(proj);
      setEventType(proj.eventType || 'Свадьба');
      if (proj.address && proj.address !== 'Адрес обсуждается') {
        setAddress(proj.address);
      }
      if (proj.date && proj.date !== 'Дата обсуждается') {
        setDate(proj.date);
      } else if (queryDate) {
        setDate(queryDate);
      }
    } else if (queryDate) {
      setDate(queryDate);
    }
  }, [contractorId, queryDate, queryEventId]);

  if (!contractor) {
    return (
      <div className="min-h-screen text-[var(--color-text)] flex flex-col justify-between">
        <AppHeader title="Оформление брони" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--color-gold)] border-t-transparent animate-spin" />
          <p className="text-[var(--color-text-secondary)] text-sm font-bold">Загружаем форму бронирования...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Cost calculations
  const basePrice = contractor.price;
  const mandatoryCosts = 5000; // Logistics & Administration

  // Surcharge beyond 5 hours (5 000 per extra hour)
  const durationExtraHours = Math.max(0, duration - 5);
  const durationSurcharge = durationExtraHours * 5000;

  const extraServicesPrice =
    durationSurcharge +
    (extraHeavySmoke ? 12000 : 0) +
    (extraLightUp ? 8000 : 0);

  const totalPrice = basePrice + mandatoryCosts + extraServicesPrice;
  const prepaymentAmount = Math.round(totalPrice * 0.3); // 30% prepayment

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) return;

    const newBooking: BookingType = {
      id: `booking-${Date.now()}`,
      contractorId: contractor.id,
      contractorName: contractor.name,
      contractorImage: contractor.image,
      date,
      startTime,
      duration,
      address,
      eventType,
      selectedService,
      price: totalPrice,
      prepayment: prepaymentAmount,
      extraCosts: mandatoryCosts,
      comment,
      clientStatus: 'confirmed',
      contractorStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    // Save globally to legacy kava_bookings for compatibility
    const existingBookings = JSON.parse(localStorage.getItem('kava_bookings') || '[]');
    localStorage.setItem('kava_bookings', JSON.stringify([newBooking, ...existingBookings]));

    // Also write directly into evently_projects inside the correct targetProject context
    if (targetProject) {
      const updatedBookings = [...(targetProject.bookings || []), newBooking];
      
      // Update budgets
      const updatedPaid = (targetProject.budgetPaid || 0) + prepaymentAmount;
      const updatedTotal = (targetProject.budgetTotal || 0) + totalPrice;

      // Update related plan items status to 'request_sent'
      const rawCategory = contractor.category; // e.g. 'djs', 'venues', 'hosts'
      const singularMap: Record<string, string> = {
        venues: 'venue',
        hosts: 'host',
        djs: 'dj',
        photographers: 'photographer',
        videographers: 'videographer',
        decorators: 'decorator',
        artists: 'artists',
        catering: 'catering',
        equipment: 'equipment',
        transport: 'transport',
        coordinators: 'coordinator'
      };
      const planCategory = singularMap[rawCategory] || rawCategory;

      const updatedPlanItems = (targetProject.planItems || []).map(item => {
        if (item.category === planCategory) {
          return { ...item, status: 'request_sent' as const, bookingId: newBooking.id };
        }
        return item;
      });

      // Update budget item spent
      const matchedTranslationMap: Record<string, string> = {
        venue: 'площад',
        host: 'ведущ',
        dj: 'диджей',
        photographer: 'фотограф',
        videographer: 'видеограф',
        decorator: 'декор',
        artists: 'артист',
        catering: 'кейтеринг',
        equipment: 'звук',
        transport: 'транспорт',
        coordinator: 'координатор'
      };
      const matchWord = matchedTranslationMap[planCategory] || 'специалист';
      const updatedBudgetItems = (targetProject.budgetItems || []).map(item => {
        if (item.name.toLowerCase().includes(matchWord)) {
          return { ...item, spent: totalPrice, isPaid: true };
        }
        return item;
      });

      const updatedProject: EventProject = {
        ...targetProject,
        bookings: updatedBookings,
        budgetPaid: updatedPaid,
        budgetTotal: updatedTotal,
        planItems: updatedPlanItems,
        budgetItems: updatedBudgetItems
      };

      saveProject(updatedProject);
      setTargetProject(updatedProject);
    }

    setSavedBooking(newBooking);
    setIsBooked(true);
  };

  const IconComponent = categoryIconMap[contractor.category] || Sparkles;
  const hasImage = contractor.image && !contractor.image.includes('unsplash.com');

  return (
    <div className="min-h-screen pb-32 flex flex-col justify-between font-sans text-[var(--color-text)] animate-fade-in" id="booking-view">
      <AppHeader title="Оформление брони" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 text-left">
        {!isBooked ? (
          <form onSubmit={handleConfirmBooking} className="space-y-8 max-w-2xl mx-auto" id="booking-form">
            
            {/* Contractor Micro Summary Card */}
            <div className="premium-glass-card rounded-[20px] p-5 flex items-center gap-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[var(--color-background-soft)] overflow-hidden flex items-center justify-center shrink-0 border border-[var(--color-border)] shadow-sm">
                {hasImage ? (
                  <img
                    src={contractor.image}
                    alt={contractor.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <IconComponent className="w-6 h-6 text-[var(--color-gold-deep)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-[var(--color-gold-deep)] font-bold uppercase tracking-wider">Вы бронируете</span>
                <h3 className="text-base font-black text-[var(--color-text)] leading-tight mt-0.5 truncate">{contractor.name}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                  {categoryNameMap[contractor.category]} • Опыт {contractor.experience} лет • {contractor.city}
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] pl-1">
                Детали проведения события
              </h3>

              <div className="space-y-4 font-sans">
                {/* Event Type & Packages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Тип события"
                    as="select"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    id="booking-event-type-select"
                  >
                    <option value="Свадьба">Свадьба</option>
                    <option value="День рождения">День рождения</option>
                    <option value="Корпоратив">Корпоратив</option>
                    <option value="Выпускной">Выпускной</option>
                    <option value="Детский праздник">Детский праздник</option>
                    <option value="Другое">Другое</option>
                  </FormField>

                  <FormField
                    label="Пакет услуг"
                    as="select"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    id="booking-service-select"
                  >
                    <option value="Основная программа событий KAVA">Основная программа KAVA</option>
                    <option value="Welcome-зона лайт">Welcome-зона лайт</option>
                    <option value="Пакет ULTRA (Всё включено + спецэффекты)">Пакет ULTRA</option>
                  </FormField>
                </div>

                {/* Date & Time parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    label="Дата события"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    id="booking-date-input"
                    required
                  />

                  <FormField
                    label="Начало программы"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    id="booking-time-input"
                    required
                  />

                  <FormField
                    label="Длительность (часов)"
                    type="number"
                    min="2"
                    max="16"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(2, Number(e.target.value)))}
                    id="booking-duration-input"
                    required
                  />
                </div>

                {/* Address Input */}
                <div className="flex flex-col gap-1.5 w-full text-left">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] pl-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[var(--color-gold)]" /> Адрес площадки проведения
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Укажите точный адрес площадки"
                    className="w-full min-h-[48px] bg-white border border-[var(--color-border)] focus:border-[var(--color-gold)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-black/30 focus:outline-none transition-colors"
                    id="booking-address-input"
                    required
                  />
                </div>

                {/* Addons upgrades checkboxes */}
                <div className="space-y-3 mt-3 text-left">
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block pl-1">
                    Дополнительные опции
                  </label>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {/* Upgrade 1 */}
                    <label className="flex items-center justify-between p-4 rounded-xl bg-white border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-gold)]/40 transition-all select-none shadow-sm">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={extraHeavySmoke}
                          onChange={(e) => setExtraHeavySmoke(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-gold-deep)] focus:ring-[var(--color-gold)] accent-[var(--color-gold-deep)] cursor-pointer"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-[var(--color-text)] leading-tight">Тяжелый дым на свадебный танец</p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Генератор дыма на сухом льду (плотное низкое облако)</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-gold-deep)] shrink-0 ml-4 font-mono">+12 000 ₽</span>
                    </label>

                    {/* Upgrade 2 */}
                    <label className="flex items-center justify-between p-4 rounded-xl bg-white border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-gold)]/40 transition-all select-none shadow-sm">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={extraLightUp}
                          onChange={(e) => setExtraLightUp(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-gold-deep)] focus:ring-[var(--color-gold)] accent-[var(--color-gold-deep)] cursor-pointer"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-[var(--color-text)] leading-tight">Дополнительные световые приборы</p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Установка 4 дополнительных вращающихся диско-голов</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-gold-deep)] shrink-0 ml-4 font-mono">+8 000 ₽</span>
                    </label>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="flex flex-col gap-1.5 w-full text-left">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] pl-1">
                    Комментарий для подрядчика (необязательно)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Пожелания по музыке, дресскоду, особенности монтажа..."
                    className="w-full h-24 bg-white border border-[var(--color-border)] focus:border-[var(--color-gold)] focus:outline-none rounded-xl p-3 text-sm text-[var(--color-text)] resize-none"
                    id="booking-comment-textarea"
                  />
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <PriceBreakdown
              basePrice={basePrice}
              mandatoryCosts={mandatoryCosts}
              extraServicesPrice={extraServicesPrice}
            />

            {/* Terms and Deposit Agreement */}
            <div className="space-y-4 pt-4 border-t border-[var(--color-border)] text-left">
              <div className="flex gap-3 items-start p-4 bg-[var(--color-champagne)] border border-[var(--color-gold)]/20 rounded-xl text-left shadow-sm">
                <ShieldCheck className="w-5 h-5 text-[var(--color-gold-deep)] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[var(--color-text)]">Размер предоплаты: 30%</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-semibold">
                    Подтверждение бронирования и фиксация даты происходит по авансовому платежу в размере{' '}
                    <span className="text-[var(--color-gold-deep)] font-bold font-mono">
                      {prepaymentAmount.toLocaleString('ru-RU')} ₽
                    </span>
                    . Официальный договор оферты формируется автоматически.
                  </p>
                </div>
              </div>

              {/* Accept terms checkbox */}
              <label className="flex gap-3 items-start cursor-pointer select-none text-left">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-gold-deep)] focus:ring-[var(--color-gold)] accent-[var(--color-gold-deep)] shrink-0 mt-1 cursor-pointer"
                  id="booking-accept-checkbox"
                  required
                />
                <span className="text-xs font-bold text-[var(--color-text-secondary)] leading-relaxed">
                  Я подтверждаю корректность всех введенных данных, соглашаюсь на обработку персональных данных, принимаю условия оферты и правила бронирования услуг NADO ПРАЗДНИК.
                </span>
              </label>
            </div>

            {/* Submit Booking */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!acceptTerms}
                className="w-full py-4 premium-gold-button font-black text-xs uppercase tracking-wider disabled:opacity-40"
                id="booking-submit-button"
              >
                Подтвердить условия бронирования
              </button>
            </div>
          </form>
        ) : (
          /* SUCCESS STATE */
          <div className="max-w-md mx-auto space-y-8 text-center py-10 animate-fade-in" id="booking-success-view">
            <div className="w-16 h-16 rounded-full bg-[#EAF5EE] border border-[#3E8B65]/20 flex items-center justify-center text-[#3E8B65] mx-auto shadow-sm">
              <CheckCircle className="w-9 h-9 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">Бронирование оформлено</h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Ваш запрос успешно сохранен в базе NADO ПРАЗДНИК и направлен специалисту.
              </p>
            </div>

            {/* Status indicators */}
            <div className="premium-glass-card rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)] font-bold">Статус клиента:</span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#3E8B65] bg-[#EAF5EE] px-2.5 py-1 rounded-full border border-[#3E8B65]/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> Подтверждено
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--color-text-secondary)] font-bold">Статус подрядчика:</span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#B94D4D] bg-[#FDF0F0] px-2.5 py-1 rounded-full border border-[#B94D4D]/25 animate-pulse">
                  <Clock className="w-3.5 h-3.5" /> Ожидает подтверждения
                </span>
              </div>
            </div>

            {/* Summary card */}
            {savedBooking && (
              <div className="premium-glass-card rounded-2xl p-5 text-xs space-y-3 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)] font-bold">Подрядчик:</span>
                  <span className="font-bold text-[var(--color-text)]">{savedBooking.contractorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)] font-bold">Дата проведения:</span>
                  <span className="font-bold text-[var(--color-text)] font-mono">{new Date(savedBooking.date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)] font-bold">Итоговая сумма:</span>
                  <span className="font-bold text-[var(--color-gold-deep)] font-mono">{savedBooking.price.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)] font-bold">Внесено предоплаты:</span>
                  <span className="font-bold text-[#3E8B65] font-mono">{savedBooking.prepayment.toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3.5 pt-4">
              <button
                onClick={() => navigate('/bookings')}
                className="flex-1 py-3 bg-white hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors"
                id="booking-success-to-bookings-list"
              >
                Мои бронирования
              </button>
              
              <button
                onClick={() => {
                  if (targetProject) {
                    navigate(`/events/${targetProject.id}`);
                  } else {
                    navigate('/project');
                  }
                }}
                className="flex-1 py-3 premium-gold-button font-bold text-xs"
                id="booking-success-to-project"
              >
                Панель проекта
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
