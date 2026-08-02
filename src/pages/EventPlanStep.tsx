import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjects, saveProject } from '../services/eventlyStorage';
import { EventProject, EventPlanItem, Booking, CustomGuest } from '../types';
import { CATEGORY_TRANSLATIONS, STATUS_TRANSLATIONS } from '../data/eventPlanTemplates';
import { 
  ArrowLeft, Users, UserPlus, Search, ShieldCheck, FileText, 
  Plus, Trash2, Check, AlertTriangle, HelpCircle, Beer, Sparkles, Building2 
} from 'lucide-react';
import { FormField, PrimaryButton, SecondaryButton } from '../components/UI';

export default function EventPlanStep() {
  const { eventId, category } = useParams<{ eventId: string; category: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<EventProject | null>(null);
  const [stepItem, setStepItem] = useState<EventPlanItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Form for custom contractor
  const [contractorName, setContractorName] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [contractorPrice, setContractorPrice] = useState('');
  const [contractorSuccess, setContractorSuccess] = useState(false);

  // Form for new guest
  const [guestName, setGuestName] = useState('');
  const [guestStatus, setGuestStatus] = useState<'invited' | 'confirmed' | 'declined'>('invited');
  const [guestAge, setGuestAge] = useState<'adult' | 'child'>('adult');
  const [guestDiet, setGuestDiet] = useState('');

  useEffect(() => {
    const projects = getProjects();
    const found = projects.find(p => p.id === eventId);
    if (found) {
      setProject(found);
      const step = found.planItems.find(p => p.category === category);
      if (step) {
        setStepItem(step);
      }
    }
    setLoading(false);
  }, [eventId, category]);

  if (loading) {
    return (
      <div className="min-h-screen text-[var(--color-text)] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project || !stepItem) {
    return (
      <div className="min-h-screen text-[var(--color-text)] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-[var(--color-error)] mb-4 mx-auto" />
        <h2 className="text-lg font-bold">Шаг подготовки не найден</h2>
        <button 
          onClick={() => navigate(`/events/${eventId}/plan`)}
          className="mt-4 px-5 py-2.5 premium-gold-button font-bold text-sm"
        >
          Вернуться к плану
        </button>
      </div>
    );
  }

  // Update status helper
  const updateStepStatus = (newStatus: any) => {
    const updatedItems = project.planItems.map(item => {
      if (item.category === category) {
        return { ...item, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined };
      }
      return item;
    });

    const updatedProject = { ...project, planItems: updatedItems };
    saveProject(updatedProject);
    setProject(updatedProject);
    setStepItem(updatedItems.find(i => i.category === category) || null);
  };

  // Submit custom contractor (Section 7)
  const handleSaveCustomContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorName || !contractorPrice) return;

    // Create a virtual booking representing this custom offline contractor
    const customBooking: Booking = {
      id: `custom-booking-${Date.now()}`,
      contractorId: `custom-offline-${Date.now()}`,
      contractorName,
      contractorImage: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=150',
      date: project.date || 'Дата согласована',
      startTime: '18:00',
      duration: 6,
      address: project.address || 'Ваша площадка',
      eventType: project.eventType,
      selectedService: CATEGORY_TRANSLATIONS[category || ''] || 'Внешний подрядчик',
      price: Number(contractorPrice) || 0,
      prepayment: 0,
      extraCosts: 0,
      comment: `Собственный подрядчик. Телефон: ${contractorPhone}`,
      clientStatus: 'confirmed',
      contractorStatus: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const updatedBookings = [...(project.bookings || []), customBooking];
    
    // Add to budget spent
    const updatedBudgetItems = project.budgetItems.map(item => {
      if (item.name.toLowerCase().includes((CATEGORY_TRANSLATIONS[category || ''] || '').toLowerCase())) {
        return { ...item, spent: Number(contractorPrice) || 0, isPaid: true };
      }
      return item;
    });

    const updatedItems = project.planItems.map(item => {
      if (item.category === category) {
        return { ...item, status: 'completed' as const, completedAt: new Date().toISOString() };
      }
      return item;
    });

    const updatedProject = {
      ...project,
      bookings: updatedBookings,
      budgetItems: updatedBudgetItems,
      planItems: updatedItems
    };

    saveProject(updatedProject);
    setProject(updatedProject);
    setStepItem(updatedItems.find(i => i.category === category) || null);
    
    setContractorName('');
    setContractorPhone('');
    setContractorPrice('');
    setContractorSuccess(true);
    setTimeout(() => setContractorSuccess(false), 3000);
  };

  // Guests list actions
  const guestsList: CustomGuest[] = (project as any).guestsList || [];

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName) return;

    const newGuest: CustomGuest = {
      id: `guest-${Date.now()}`,
      name: guestName,
      status: guestStatus,
      ageGroup: guestAge,
      diet: guestDiet
    };

    const updatedList = [...guestsList, newGuest];
    const updatedProject = {
      ...project,
      guestsList: updatedList,
      guestsCount: updatedList.filter(g => g.status === 'confirmed').length || project.guestsCount
    };

    saveProject(updatedProject);
    setProject(updatedProject as any);
    
    // Reset guest inputs
    setGuestName('');
    setGuestDiet('');
  };

  const handleDeleteGuest = (guestId: string) => {
    const updatedList = guestsList.filter(g => g.id !== guestId);
    const updatedProject = {
      ...project,
      guestsList: updatedList
    };
    saveProject(updatedProject);
    setProject(updatedProject as any);
  };

  // Render Category Specific screen
  const renderContent = () => {
    switch (category) {
      case 'venue':
        return (
          <div className="space-y-6">
            <div className="p-6 premium-glass-card text-center space-y-4 shadow-sm">
              <Building2 className="w-12 h-12 text-[var(--color-gold-deep)] mx-auto" />
              <div>
                <h4 className="font-bold text-[var(--color-text)] text-base">Подбор идеальной локации</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto leading-relaxed">
                  Банкетные залы, загородные виллы, лофты или шатры у воды. Выберите формат проведения.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={() => navigate(`/catalog/venue`)}
                  className="flex-1 py-3 premium-gold-button text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Search className="w-4 h-4" />
                  Найти зал в каталоге
                </button>
                <button 
                  onClick={() => navigate('/drinks-calculator')}
                  className="flex-1 py-3 bg-white hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Beer className="w-4 h-4" />
                  Открыть калькулятор напитков
                </button>
              </div>
            </div>
            
            {/* Custom offline venue */}
            {renderCustomContractorForm('Внесите адрес и стоимость вашей площадки')}
          </div>
        );

      case 'drinks':
        return (
          <div className="p-6 premium-glass-card text-center space-y-4 shadow-sm">
            <Beer className="w-12 h-12 text-[var(--color-gold-deep)] mx-auto animate-pulse" />
            <div>
              <h4 className="font-bold text-[var(--color-text)] text-base">Калькулятор алкоголя и напитков</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto leading-relaxed">
                Введите точные данные гостей и сезон проведения, чтобы алгоритм рассчитал оптимальное количество крепкого алкоголя, вина, пива и соков.
              </p>
            </div>
            <button
              onClick={() => navigate('/drinks-calculator')}
              className="w-full py-3 premium-gold-button text-xs font-bold shadow-md"
            >
              Перейти к расчету напитков
            </button>
          </div>
        );

      case 'guests':
        return (
          <div className="space-y-6 text-left">
            {/* Add Guest Form */}
            <form onSubmit={handleAddGuest} className="p-5 premium-glass-card space-y-4 shadow-sm">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-gold-deep)] mb-2 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                Добавить гостя в список
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase pl-1 block mb-1">ФИО гостя *</label>
                  <input
                    required
                    type="text"
                    placeholder="Например: Иванов Иван"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold-light)]/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase pl-1 block mb-1">Статус приглашения</label>
                  <select
                    value={guestStatus}
                    onChange={e => setGuestStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="invited">Приглашён (Ожидание)</option>
                    <option value="confirmed">Подтвердил участие</option>
                    <option value="declined">Отказался</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase pl-1 block mb-1">Возрастная группа</label>
                  <select
                    value={guestAge}
                    onChange={e => setGuestAge(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="adult">Взрослый</option>
                    <option value="child">Ребёнок / Дети</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase pl-1 block mb-1">Особое меню, диета</label>
                  <input
                    type="text"
                    placeholder="Например: аллергия на орехи"
                    value={guestDiet}
                    onChange={e => setGuestDiet(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold-light)]/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[var(--color-champagne)] hover:bg-[var(--color-gold-light)] border border-[var(--color-gold)]/20 text-[var(--color-gold-deep)] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                Сохранить в список гостей
              </button>
            </form>

            {/* Guest List Output */}
            <div className="p-5 premium-glass-card shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-[var(--color-border)] pb-2.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text)]">Список гостей ({guestsList.length})</h4>
                <div className="flex gap-3 text-xs text-[var(--color-text-secondary)] font-mono">
                  <span className="font-bold text-[#3E8B65]">Да: {guestsList.filter(g => g.status === 'confirmed').length}</span>
                  <span className="font-bold text-[#B94D4D]">Нет: {guestsList.filter(g => g.status === 'declined').length}</span>
                </div>
              </div>

              {guestsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--color-text-secondary)]">
                  Список пуст. Добавьте первого гостя выше.
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {guestsList.map((guest) => (
                    <div key={guest.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--color-text)] truncate">{guest.name}</p>
                        <div className="flex gap-2 text-xs text-[var(--color-text-secondary)] mt-0.5">
                          <span>{guest.ageGroup === 'adult' ? 'Взрослый' : 'Ребёнок'}</span>
                          {guest.diet && <span>• {guest.diet}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          guest.status === 'confirmed'
                            ? 'bg-[#EAF5EE] text-[#3E8B65]'
                            : guest.status === 'declined'
                              ? 'bg-[#FDF0F0] text-[#B94D4D]'
                              : 'bg-[var(--color-background-soft)] text-[var(--color-text-secondary)]'
                        }`}>
                          {guest.status === 'confirmed' ? 'Подтвердил' : guest.status === 'declined' ? 'Отказался' : 'Приглашён'}
                        </span>
                        <button
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="p-1 bg-[#FDF0F0] hover:bg-[#FDF0F0]/80 text-[#B94D4D] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => updateStepStatus('completed')}
                className="px-6 py-3 premium-gold-button font-bold text-xs shadow-md"
              >
                Завершить этап списка гостей
              </button>
            </div>
          </div>
        );

      case 'documents':
        const bookings = project.bookings || [];
        return (
          <div className="space-y-6 text-left">
            <div className="p-5 premium-glass-card shadow-sm">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-gold-deep)] mb-2 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Юридическая верификация сделок
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                Все договоры и условия бронирования хранятся в зашифрованных цифровых версиях на платформе NADO ПРАЗДНИК. Это защищает вас от внезапного поднятия цен и отмены услуг.
              </p>
              
              <div className="p-3 bg-[#FDF0F0] border border-[#B94D4D]/25 rounded-xl flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-[#B94D4D] shrink-0 mt-0.5" />
                <p className="text-[var(--color-text-secondary)]">
                  <span className="font-bold text-[#B94D4D]">Внимание!</span> Оплата напрямую без подтверждения Условий заказа лишает вас юридической поддержки арбитража NADO ПРАЗДНИК при срыве заказа.
                </p>
              </div>
            </div>

            {/* List of active order agreements */}
            <div className="p-5 premium-glass-card space-y-4 shadow-sm">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text)]">Список договоров и спецификаций</h4>
              
              {bookings.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)] text-center py-6">
                  У вас пока нет оформленных заказов. Чтобы составить первый договор, отправьте запрос подрядчику в каталоге.
                </p>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {bookings.map((b) => (
                    <div key={b.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <h5 className="font-bold text-xs text-[var(--color-text)]">{b.contractorName}</h5>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{b.selectedService}</p>
                        <p className="text-xs text-[var(--color-gold-deep)] mt-1 font-mono font-bold">Стоимость: {b.price.toLocaleString('ru-RU')} ₽</p>
                      </div>
                      <button
                        onClick={() => navigate(`/orders/${b.id}/terms`)}
                        className="px-3 py-1.5 bg-white hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs text-[var(--color-text)] font-semibold rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Договор
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => updateStepStatus('completed')}
                className="px-6 py-3 premium-gold-button font-bold text-xs shadow-md"
              >
                Отметить шаг проверенным
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6 text-left">
            <div className="p-6 premium-glass-card text-center space-y-4 shadow-sm">
              <Sparkles className="w-12 h-12 text-[var(--color-gold-deep)] mx-auto" />
              <div>
                <h4 className="font-bold text-[var(--color-text)] text-base">Подбор специалиста: {CATEGORY_TRANSLATIONS[category || ''] || category}</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto leading-relaxed">
                  Проверенные специалисты с реальным портфолио, отзывами и прозрачными фиксированными ценами.
                </p>
              </div>
              <button
                onClick={() => navigate(`/catalog/${category}`)}
                className="w-full py-3 premium-gold-button text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Search className="w-4 h-4" />
                Найти в каталоге NADO ПРАЗДНИК
              </button>
            </div>

            {/* Custom offline contractor registration (Section 7) */}
            {renderCustomContractorForm()}
          </div>
        );
    }
  };

  const renderCustomContractorForm = (customHeading?: string) => {
    return (
      <form onSubmit={handleSaveCustomContractor} className="p-5 premium-glass-card space-y-4 shadow-sm text-left">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-gold-deep)] flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          {customHeading || `У меня уже есть свой ${CATEGORY_TRANSLATIONS[category || ''] || 'исполнитель'}`}
        </h4>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Если вы наняли специалиста вне платформы, внесите его данные. Мы добавим его в вашу интерактивную смету и календарь.
        </p>

        {contractorSuccess && (
          <div className="p-2.5 bg-[#EAF5EE] border border-[#3E8B65]/25 text-[#3E8B65] text-xs rounded-xl flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            Подрядчик успешно зафиксирован в смете и сделках!
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] font-bold uppercase block mb-1">Имя / Название компании *</label>
            <input
              required
              type="text"
              placeholder="Например: Шоу-группа Юность"
              value={contractorName}
              onChange={e => setContractorName(e.target.value)}
              className="w-full p-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold-light)]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] font-bold uppercase block mb-1">Номер телефона</label>
              <input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={contractorPhone}
                onChange={e => setContractorPhone(e.target.value)}
                className="w-full p-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold-light)]/20"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] font-bold uppercase block mb-1">Стоимость услуг *</label>
              <input
                required
                type="number"
                placeholder="В рублях"
                value={contractorPrice}
                onChange={e => setContractorPrice(e.target.value)}
                className="w-full p-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold-light)]/20"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-[var(--color-champagne)] hover:bg-[var(--color-gold-light)] border border-[var(--color-gold)]/20 text-[var(--color-gold-deep)] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors"
        >
          Зарегистрировать в мероприятии
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen pb-24 font-sans text-[var(--color-text)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF7F1]/92 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/events/${eventId}/plan`)} 
              className="p-2 bg-white hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>
            <div className="text-left">
              <h1 className="text-sm font-black text-[var(--color-text)]">{CATEGORY_TRANSLATIONS[category || ''] || category}</h1>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Шаг планирования праздника</p>
            </div>
          </div>

          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
            stepItem.status === 'completed' ? 'bg-[#EAF5EE] text-[#3E8B65]' : 'bg-[#FCF4E7] text-[#694619] border border-[var(--color-gold)]/15'
          }`}>
            {STATUS_TRANSLATIONS[stepItem.status] || stepItem.status}
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        {/* Step description */}
        <section className="p-5 premium-glass-card shadow-sm text-left">
          <h2 className="text-sm font-bold text-[var(--color-text)] mb-1.5">{stepItem.title}</h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{stepItem.description}</p>
        </section>

        {/* Content Section */}
        <section className="space-y-4">
          {renderContent()}
        </section>
      </main>
    </div>
  );
}
