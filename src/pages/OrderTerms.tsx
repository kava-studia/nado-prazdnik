import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjects, saveProject } from '../services/eventlyStorage';
import { recordConsent } from '../services/legalStorage';
import { OrderTermsSnapshot, Booking } from '../types';
import { ArrowLeft, Check, AlertCircle, ShieldCheck, CheckCircle2, Lock, Landmark } from 'lucide-react';

export default function OrderTerms() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<OrderTermsSnapshot | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  // Consent states for client confirmation
  const [consentAgreement, setConsentAgreement] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentPersonal, setConsentPersonal] = useState(false);
  const [consentBooking, setConsentBooking] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [promoConsent, setPromoConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = () => {
    const projects = getProjects();
    let foundBooking: Booking | null = null;
    let foundProject: any = null;

    for (const proj of projects) {
      const b = (proj.bookings || []).find((x: Booking) => x.id === orderId);
      if (b) {
        foundBooking = b;
        foundProject = proj;
        break;
      }
    }

    if (!foundBooking) {
      // Look in independent bookings key
      try {
        const savedBookings = JSON.parse(localStorage.getItem('nado_holiday_bookings') || '[]');
        foundBooking = savedBookings.find((x: any) => x.id === orderId);
      } catch (e) {
        console.error(e);
      }
    }

    if (foundBooking) {
      setBooking(foundBooking);

      // Fetch or initialize terms version snapshot
      try {
        const savedSnapshots: OrderTermsSnapshot[] = JSON.parse(localStorage.getItem('nado_holiday_order_snapshots') || '[]');
        let snap = savedSnapshots.find(s => s.orderId === orderId);
        
        if (!snap) {
          // Compute platform fees & transparent costs
          const basePrice = foundBooking.price;
          const platformFee = Math.round(basePrice * 0.05); // Transparent 5% platform fee
          const protectedFee = Math.round(basePrice * 0.02); // 2% secure payment fee
          const finalPrice = basePrice + platformFee + protectedFee;
          const prepayment = foundBooking.prepayment || Math.round(finalPrice * 0.3);

          snap = {
            id: `snap-${Date.now()}`,
            orderId: foundBooking.id,
            version: 1,
            clientId: 'current_user',
            contractorId: foundBooking.contractorId,
            contractorName: foundBooking.contractorName,
            serviceCategory: foundBooking.selectedService || 'Свадебный подрядчик',
            serviceDescription: foundBooking.comment || 'Оказание профессиональных услуг на мероприятии.',
            eventId: foundProject?.id || 'event-unknown',
            eventDate: foundBooking.date || foundProject?.date || 'Дата обсуждается',
            eventTime: foundBooking.startTime || foundProject?.time || '18:00',
            eventLocation: foundBooking.address || foundProject?.address || 'Локация согласовывается',
            serviceComposition: [
              'Консультация и составление индивидуального тайминга работы',
              'Доставка, монтаж и демонтаж необходимого оборудования',
              'Оказание услуг в течение согласованного времени',
              'Предоставление готовых материалов (для фотографов/видеографов)'
            ],
            basePrice,
            namedAdditionalServices: [],
            platformServiceFee: platformFee,
            protectedPaymentFee: protectedFee,
            discount: 0,
            finalPrice,
            prepayment,
            paymentSchedule: `Предоплата ${prepayment.toLocaleString('ru-RU')} ₽ при подтверждении заказа, остаток ${(finalPrice - prepayment).toLocaleString('ru-RU')} ₽ за 3 дня до даты мероприятия.`,
            cancellationPolicy: 'Бесплатная отмена за 30 дней до даты проведения. При отмене менее чем за 14 дней удерживается фактически понесенный расход исполнителя в размере 10% от суммы заказа. При отмене менее чем за 3 дня аванс не возвращается.',
            refundPolicy: 'В случае неявки исполнителя производится полный возврат аванса платформой в течение 3 рабочих дней.',
            responsibilities: 'Исполнитель несет ответственность за качество услуг и своевременное прибытие. Клиент несет ответственность за обеспечение доступа на площадку и технические требования (бытовой райдер).',
            additionalTerms: foundBooking.comment || 'Дополнительных условий не заявлено.',
            createdAt: new Date().toISOString(),
            status: 'sent'
          };
          savedSnapshots.push(snap);
          localStorage.setItem('nado_holiday_order_snapshots', JSON.stringify(savedSnapshots));
        }
        setSnapshot(snap);
      } catch (e) {
        console.error('Failed to parse snapshots', e);
      }
    }
  };

  const handleConfirmTerms = () => {
    if (!consentAgreement || !consentPrivacy || !consentPersonal || !consentBooking || !consentTerms) {
      setErrorMessage('Пожалуйста, подтвердите все обязательные соглашения перед продолжением');
      return;
    }
    setErrorMessage('');

    if (!snapshot) return;

    try {
      const savedSnapshots: OrderTermsSnapshot[] = JSON.parse(localStorage.getItem('nado_holiday_order_snapshots') || '[]');
      const index = savedSnapshots.findIndex(s => s.id === snapshot.id);
      
      if (index >= 0) {
        // Confirm client side
        const updatedSnap: OrderTermsSnapshot = {
          ...savedSnapshots[index],
          clientConfirmedAt: new Date().toISOString(),
          contractorConfirmedAt: new Date().toISOString(),
          status: 'confirmed'
        };

        savedSnapshots[index] = updatedSnap;
        localStorage.setItem('nado_holiday_order_snapshots', JSON.stringify(savedSnapshots));
        setSnapshot(updatedSnap);

        // Record official consents in the storage database
        recordConsent('user-agreement', 'checkbox_click');
        recordConsent('privacy-policy', 'checkbox_click');
        recordConsent('personal-data-consent', 'checkbox_click');
        recordConsent('booking-rules', 'checkbox_click');
        if (promoConsent) {
          recordConsent('advertising', 'checkbox_click');
        }

        // Sync back status to booking if attached to a project
        const projects = getProjects();
        
        for (const proj of projects) {
          const bIdx = proj.bookings?.findIndex((b: Booking) => b.id === orderId);
          if (bIdx !== undefined && bIdx >= 0) {
            proj.bookings[bIdx].clientStatus = 'confirmed';
            proj.bookings[bIdx].contractorStatus = 'confirmed';
            
            // Update plan status
            const cat = proj.bookings[bIdx].selectedService.toLowerCase().includes('dj') ? 'dj' : 'venue';
            const planItem = proj.planItems?.find(p => p.category === cat);
            if (planItem) {
              planItem.status = 'booked';
            }
            
            saveProject(proj);
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!snapshot) {
    return (
      <div className="min-h-screen text-[var(--text-primary)] bg-[var(--background-primary)] flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-[var(--gold-primary)] mx-auto" />
          <h1 className="text-lg font-black">Заказ не найден</h1>
          <p className="text-xs text-[var(--text-secondary)]">Спецификация условий по данному заказу отсутствует.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2.5 premium-gold-button font-bold text-xs uppercase tracking-wider"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const isConfirmed = snapshot.status === 'confirmed';

  return (
    <div className="min-h-screen pb-24 font-sans text-[var(--text-primary)] bg-[var(--background-primary)] animate-fade-in" id="order-terms-view">
      <header className="sticky top-0 z-30 bg-[var(--background-elevated)]/85 backdrop-blur-md border-b border-[var(--border-soft)] px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left min-w-0">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-[var(--background-secondary)] hover:bg-[var(--border-soft)]/40 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm font-black tracking-tight text-[var(--text-primary)]">Спецификация</h1>
                <span className="text-xs bg-[var(--gold-highlight)] px-1.5 py-0.5 rounded border border-[var(--gold-primary)]/10 text-[var(--gold-deep)] font-mono font-bold font-semibold">v{snapshot.version}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-bold uppercase truncate">Согласование условий</p>
            </div>
          </div>

          <div className="shrink-0">
            {isConfirmed ? (
              <span className="text-xs font-black text-[#3E8B65] bg-[#EAF5EE] border border-[#3E8B65]/20 px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Согласовано
              </span>
            ) : (
              <span className="text-xs font-black text-[var(--gold-deep)] bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/20 px-2.5 py-1 rounded-full uppercase">
                Черновик
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-8 space-y-6 text-left">
        {/* Role of Platform Explanation Box */}
        <div className="p-5 bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/20 rounded-[24px] shadow-sm">
          <h3 className="text-xs font-bold text-[var(--gold-deep)] uppercase tracking-wider mb-2 flex items-center gap-1">
            <Landmark className="w-4 h-4" />
            Как работает NADO ПРАЗДНИК
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 font-semibold">
            NADO ПРАЗДНИК помогает клиенту и исполнителю найти друг друга, согласовать условия и сохранить договорённости. Услугу оказывает выбранный исполнитель. Договор оказания услуги заключается напрямую между клиентом и исполнителем.
          </p>
          <p className="text-xs text-[var(--text-secondary)]/80 leading-relaxed border-t border-[var(--gold-primary)]/10 pt-2 font-bold uppercase">
            Ответственность сторон определяется договором, правилами сервиса и законодательством РФ.
          </p>
        </div>

        {/* Parties Box */}
        <section className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-[var(--gold-primary)]">
            Стороны договора
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[var(--background-secondary)] border border-[var(--border-soft)] rounded-xl shadow-sm text-left">
              <span className="text-[var(--text-secondary)] uppercase text-xs font-bold block mb-1">Исполнитель</span>
              <p className="font-black text-[var(--text-primary)]">{snapshot.contractorName}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold">Категория: {snapshot.serviceCategory}</p>
              <p className="text-xs text-[var(--text-secondary)] font-semibold">Статус: Самозанятый / ИП</p>
            </div>
            <div className="p-3 bg-[var(--background-secondary)] border border-[var(--border-soft)] rounded-xl shadow-sm text-left">
              <span className="text-[var(--text-secondary)] uppercase text-xs font-bold block mb-1">Заказчик</span>
              <p className="font-black text-[var(--text-primary)]">Вы (Клиент платформы)</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold">Город: {snapshot.eventLocation.split(',')[0]}</p>
              <p className="text-xs text-[var(--text-secondary)] font-semibold">Телефон: Из профиля</p>
            </div>
          </div>
        </section>

        {/* Subject & Timing */}
        <section className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-[var(--gold-primary)]">
            Предмет соглашения и сроки
          </h2>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-2 border-b border-[var(--border-soft)]">
              <span className="text-[var(--text-secondary)] font-semibold">Дата проведения:</span>
              <span className="font-black text-[var(--text-primary)]">{snapshot.eventDate}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-soft)]">
              <span className="text-[var(--text-secondary)] font-semibold">Время работы:</span>
              <span className="font-black text-[var(--text-primary)]">{snapshot.eventTime}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-soft)]">
              <span className="text-[var(--text-secondary)] font-semibold">Место проведения:</span>
              <span className="font-black text-[var(--text-primary)] text-right max-w-[200px] truncate">{snapshot.eventLocation}</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-[var(--text-secondary)] font-bold uppercase block mb-1.5">Состав оказываемой услуги</span>
            <ul className="list-disc list-inside text-xs text-[var(--text-secondary)] space-y-1 pl-1">
              {snapshot.serviceComposition.map((item, idx) => (
                <li key={idx} className="leading-relaxed font-semibold">{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing Transparency */}
        <section className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-[var(--gold-primary)]">
            Прозрачный расчет стоимости
          </h2>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[var(--border-soft)]">
              <span className="text-[var(--text-secondary)] font-semibold">Стоимость услуги исполнителя:</span>
              <span className="font-mono text-[var(--text-primary)] font-bold">{snapshot.basePrice.toLocaleString('ru-RU')} ₽</span>
            </div>
            
            {snapshot.namedAdditionalServices.map((srv, idx) => (
              <div key={idx} className="flex justify-between py-1 border-b border-[var(--border-soft)]">
                <span className="text-[var(--text-secondary)] font-semibold">{srv.name}:</span>
                <span className="font-mono text-[var(--text-primary)] font-bold">{srv.price.toLocaleString('ru-RU')} ₽</span>
              </div>
            ))}

            <div className="flex justify-between py-1 border-b border-[var(--border-soft)]">
              <span className="text-[var(--text-secondary)] font-semibold">Сервисный сбор NADO ПРАЗДНИК (5%):</span>
              <span className="font-mono text-[var(--text-primary)] font-bold">{snapshot.platformServiceFee.toLocaleString('ru-RU')} ₽</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[var(--border-soft)]">
              <span className="text-[var(--text-secondary)] font-semibold">Стоимость безопасного платежа (2%):</span>
              <span className="font-mono text-[var(--text-primary)] font-bold">{snapshot.protectedPaymentFee.toLocaleString('ru-RU')} ₽</span>
            </div>

            {snapshot.discount > 0 && (
              <div className="flex justify-between py-1 border-b border-[var(--border-soft)] text-[#3E8B65]">
                <span className="font-semibold">Промокод / Скидка:</span>
                <span className="font-mono font-bold">-{snapshot.discount.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}

            <div className="flex justify-between pt-2 text-sm font-black text-[var(--gold-primary)]">
              <span>ИТОГО К ОПЛАТЕ:</span>
              <span className="font-mono">{snapshot.finalPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--background-secondary)] border border-[var(--border-soft)] rounded-xl text-xs space-y-2 shadow-sm">
            <div className="flex justify-between text-[var(--text-secondary)] font-semibold">
              <span>Вносимая предоплата:</span>
              <span className="font-bold text-[var(--text-primary)] font-mono">{snapshot.prepayment.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)] font-semibold">
              <span>Остаток при исполнении:</span>
              <span className="font-bold text-[var(--text-primary)] font-mono">{(snapshot.finalPrice - snapshot.prepayment).toLocaleString('ru-RU')} ₽</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-2 leading-relaxed">
              * {snapshot.paymentSchedule}
            </p>
          </div>
        </section>

        {/* Policies & Responsibilities */}
        <section className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-[var(--gold-primary)]">
            Условия отмены и ответственности
          </h2>
          
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-black text-[var(--text-primary)] block mb-1">Порядок отмены:</span>
              <p className="text-[var(--text-secondary)] leading-relaxed font-semibold">{snapshot.cancellationPolicy}</p>
            </div>
            <div>
              <span className="font-black text-[var(--text-primary)] block mb-1">Порядок возврата:</span>
              <p className="text-[var(--text-secondary)] leading-relaxed font-semibold">{snapshot.refundPolicy}</p>
            </div>
            <div>
              <span className="font-black text-[var(--text-primary)] block mb-1">Ответственность сторон:</span>
              <p className="text-[var(--text-secondary)] leading-relaxed font-semibold">{snapshot.responsibilities}</p>
            </div>
          </div>
        </section>

        {/* Confirmation State */}
        <section className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-[var(--gold-primary)]">
            Подписи и согласование
          </h2>
          
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-xl border border-[var(--border-soft)] shadow-sm">
              <span className="text-[var(--text-secondary)] font-semibold">Заказчик (Вы)</span>
              {snapshot.clientConfirmedAt ? (
                <span className="text-[#3E8B65] font-bold flex items-center gap-1 font-mono">
                  <Check className="w-4 h-4" />
                  ПОДТВЕРЖДЕНО ({new Date(snapshot.clientConfirmedAt).toLocaleDateString('ru-RU')})
                </span>
              ) : (
                <span className="text-[var(--gold-primary)] font-black uppercase text-xs">Ожидает подписи</span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-xl border border-[var(--border-soft)] shadow-sm">
              <span className="text-[var(--text-secondary)] font-semibold">Подрядчик ({snapshot.contractorName})</span>
              {snapshot.contractorConfirmedAt ? (
                <span className="text-[#3E8B65] font-bold flex items-center gap-1 font-mono">
                  <Check className="w-4 h-4" />
                  ПОДТВЕРЖДЕНО ({new Date(snapshot.contractorConfirmedAt).toLocaleDateString('ru-RU')})
                </span>
              ) : (
                <span className="text-[var(--gold-primary)] font-black uppercase text-xs">Ожидает подписи</span>
              )}
            </div>
          </div>
        </section>

        {/* Confirm Action and Checkboxes */}
        {!isConfirmed && (
          <div className="p-6 bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/20 rounded-[24px] space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-[var(--gold-deep)]" />
              Подписание документов и регламентов
            </h3>

            {errorMessage && (
              <div className="p-3 bg-[#FDF0F0] border border-[#B94D4D]/20 rounded-xl flex items-center gap-2 text-xs text-[#B94D4D] font-bold">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}

            {/* Checklist of separate consents */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none text-left">
                <input 
                  type="checkbox"
                  checked={consentAgreement}
                  onChange={e => setConsentAgreement(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[var(--gold-primary)] border-[var(--border-soft)] rounded"
                />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  Я принимаю <a href="#/legal/user-agreement" target="_blank" className="text-[var(--gold-primary)] hover:underline font-bold">Пользовательское соглашение</a> *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-left">
                <input 
                  type="checkbox"
                  checked={consentPrivacy}
                  onChange={e => setConsentPrivacy(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[var(--gold-primary)] border-[var(--border-soft)] rounded"
                />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  Я ознакомился с <a href="#/legal/privacy-policy" target="_blank" className="text-[var(--gold-primary)] hover:underline font-bold">Политикой конфиденциальности</a> *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-left">
                <input 
                  type="checkbox"
                  checked={consentPersonal}
                  onChange={e => setConsentPersonal(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[var(--gold-primary)] border-[var(--border-soft)] rounded"
                />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  Я даю <a href="#/legal/personal-data-consent" target="_blank" className="text-[var(--gold-primary)] hover:underline font-bold">Согласие на обработку персональных данных</a> *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-left">
                <input 
                  type="checkbox"
                  checked={consentBooking}
                  onChange={e => setConsentBooking(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[var(--gold-primary)] border-[var(--border-soft)] rounded"
                />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  Я принимаю <a href="#/legal/booking-rules" target="_blank" className="text-[var(--gold-primary)] hover:underline font-bold">Правила бронирования и отмены</a> *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-left">
                <input 
                  type="checkbox"
                  checked={consentTerms}
                  onChange={e => setConsentTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[var(--gold-primary)] border-[var(--border-soft)] rounded"
                />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  Я подтверждаю правильность условий данного заказа и состава услуг *
                </span>
              </label>

              <div className="border-t border-[var(--border-soft)] my-2 pt-2"></div>

              <label className="flex items-start gap-3 cursor-pointer select-none text-left">
                <input 
                  type="checkbox"
                  checked={promoConsent}
                  onChange={e => setPromoConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[var(--gold-primary)] border-[var(--border-soft)] rounded"
                />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  Я хочу получать новости, специальные предложения и напоминания NADO (Необязательно)
                </span>
              </label>
            </div>

            <button
              onClick={handleConfirmTerms}
              className="w-full mt-4 py-4 premium-gold-button font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5" />
              Подписать и согласовать условия
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
