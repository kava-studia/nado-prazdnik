import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjects } from '../services/eventlyStorage';
import { DisputeCase } from '../types';
import { ArrowLeft, AlertCircle, FileText, Send, Clock, Plus } from 'lucide-react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { useAuth } from '../context/AuthContext';

export default function Disputes() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const { disputeRepository } = useRepositories();
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [disputeType, setDisputeType] = useState<any>('cancellation');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [desiredResolution, setDesiredResolution] = useState('');
  const [photosInput, setPhotosInput] = useState('');
  const [docsInput, setDocsInput] = useState('');

  // Collect bookings from all projects to dispute
  const projects = getProjects();
  const allBookings = projects.flatMap(p => (p.bookings || []).map(b => ({ ...b, eventName: p.name })));

  const loadDisputes = async () => {
    try {
      setDisputes(await disputeRepository.listDisputes(user?.id));
    } catch (e) {
      console.error('Failed to load disputes', e);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, [disputeRepository, user?.id]);

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      alert('Пожалуйста, выберите заказ для обращения');
      return;
    }
    if (!reason || !description) {
      alert('Пожалуйста, заполните суть обращения и детальное описание');
      return;
    }

    const newDispute: DisputeCase = {
      id: `dispute-${Date.now()}`,
      orderId: selectedBookingId,
      bookingId: selectedBookingId,
      type: disputeType,
      reason,
      description,
      desiredResolution,
      files: [photosInput, docsInput].filter(Boolean),
      status: 'sent',
      priority: 'standard',
      riskType: disputeType === 'payment_dispute' || disputeType === 'refund' ? 'financial' : 'service',
      orderAmount: allBookings.find(b => b.id === selectedBookingId)?.price || 0,
      factCheck: {
        orderTermsChecked: false,
        evidenceReviewed: false,
        partiesContacted: false
      },
      internalNotes: [],
      actionHistory: [{
        id: `case-action-${Date.now()}`,
        actorId: user?.id || 'anonymous',
        action: 'CASE_REGISTERED',
        details: 'Обращение отправлено пользователем',
        createdAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await disputeRepository.saveDispute(newDispute);
    await loadDisputes();
    setIsCreating(false);
    
    // Reset form
    setSelectedBookingId('');
    setReason('');
    setDescription('');
    setDesiredResolution('');
    setPhotosInput('');
    setDocsInput('');

    navigate(`/disputes/${newDispute.id}`);
  };

  const getStatusBadge = (status: DisputeCase['status']) => {
    switch (status) {
      case 'draft':
        return <span className="text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full uppercase">Черновик</span>;
      case 'sent':
        return <span className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-150 px-2.5 py-1 rounded-full uppercase">Отправлено</span>;
      case 'under_review':
        return <span className="text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full uppercase">Рассматривается</span>;
      case 'info_needed':
        return <span className="text-xs font-bold bg-[var(--gold-highlight)] text-[var(--gold-deep)] border border-[var(--gold-primary)]/25 px-2.5 py-1 rounded-full uppercase">Нужны данные</span>;
      case 'awaiting_financial_approval':
        return <span className="text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full uppercase">Ожидает подтверждения</span>;
      case 'resolved':
        return <span className="text-xs font-bold bg-[#EAF5EE] text-[#3E8B65] border border-[#3E8B65]/20 px-2.5 py-1 rounded-full uppercase">Решено</span>;
      case 'closed':
        return <span className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full uppercase">Закрыто</span>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (type: string) => {
    const map: Record<string, string> = {
      cancellation: 'Отмена заказа',
      reschedule: 'Перенос мероприятия',
      refund: 'Возврат средств',
      contractor_no_show: 'Исполнитель не явился',
      client_no_show: 'Клиент не явился',
      partial_service: 'Услуга оказана частично',
      quality_dispute: 'Спор по качеству',
      scope_dispute: 'Спор по составу услуги',
      payment_dispute: 'Спор по оплате',
      contractor_complaint: 'Жалоба на подрядчика',
      client_complaint: 'Жалоба на клиента'
    };
    return map[type] || type;
  };

  if (disputeId) {
    const dispute = disputes.find(d => d.id === disputeId);
    
    if (!dispute) {
      return (
        <div className="min-h-screen text-[var(--text-primary)] bg-[var(--background-primary)] flex flex-col items-center justify-center p-6 font-sans">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-black mb-3">Обращение не найдено</h1>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Спор с таким идентификатором отсутствует в системе.</p>
            <button 
              onClick={() => navigate('/disputes')}
              className="px-6 py-2.5 premium-gold-button font-bold text-xs uppercase tracking-wider"
            >
              К списку споров
            </button>
          </div>
        </div>
      );
    }

    const booking = allBookings.find(b => b.id === dispute.bookingId);

    return (
      <div className="min-h-screen pb-24 font-sans text-[var(--text-primary)] bg-[var(--background-primary)] animate-fade-in" id="dispute-detail-view">
        <header className="sticky top-0 z-30 bg-[var(--background-elevated)]/85 backdrop-blur-md border-b border-[var(--border-soft)] px-4 py-4 shadow-sm">
          <div className="max-w-xl mx-auto flex items-center gap-4 text-left">
            <button 
              onClick={() => navigate('/disputes')} 
              className="p-2 bg-[var(--background-secondary)] hover:bg-[var(--border-soft)]/40 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-black">Обращение #{dispute.id.split('-')[1]}</h1>
                {getStatusBadge(dispute.status)}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{getCategoryLabel(dispute.type)}</p>
            </div>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 mt-8 space-y-6 text-left">
          {/* Dispute Status Info Box */}
          <div className="p-5 bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/20 rounded-[24px] shadow-sm">
            <h3 className="text-xs font-black text-[var(--text-primary)] mb-2 flex items-center gap-2 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[var(--gold-primary)]" />
              Статус рассмотрения
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-semibold">
              {dispute.status === 'sent' && 'Ваше обращение успешно зарегистрировано на платформе NADO ПРАЗДНИК. Наша служба медиации изучит условия заказа, зафиксированные при бронировании, и окажет содействие сторонам в поиске решения в течение 10 рабочих дней.'}
              {dispute.status === 'under_review' && 'Обращение рассматривается юристом-медиатором NADO.'}
              {dispute.status === 'info_needed' && 'Для содействия в решении спора требуется дополнительная информация. Пожалуйста, отправьте запрошенные документы в чат поддержки.'}
              {dispute.status === 'awaiting_financial_approval' && 'Проверка фактов завершена. Денежное решение ожидает отдельного подтверждения уполномоченным сотрудником.'}
              {dispute.status === 'resolved' && 'Служба медиации NADO помогла сторонам прийти к согласию. Финансовые условия и возвраты скорректированы.'}
              {dispute.status === 'closed' && 'Обращение закрыто. Изменения зафиксированы в истории проекта.'}
            </p>
          </div>

          {/* Details */}
          <div className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-5 shadow-sm">
            <div>
              <span className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider block mb-1">Связанный заказ</span>
              {booking ? (
                <div className="p-3 bg-[var(--background-secondary)] border border-[var(--border-soft)] rounded-xl text-xs sm:text-sm shadow-sm">
                  <p className="font-bold text-[var(--text-primary)]">{booking.contractorName}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-bold">{booking.eventName} • {booking.selectedService}</p>
                  <p className="text-xs text-[var(--gold-primary)] mt-1 font-bold">Итоговая стоимость: {booking.price.toLocaleString('ru-RU')} ₽</p>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">Заказ не найден или был удален</p>
              )}
            </div>

            <div>
              <span className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider block mb-1">Суть обращения</span>
              <p className="text-sm font-black text-[var(--text-primary)]">{dispute.reason}</p>
            </div>

            <div>
              <span className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider block mb-1">Детальное описание проблемы</span>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] bg-[var(--background-secondary)] p-4 rounded-xl leading-relaxed whitespace-pre-wrap border border-[var(--border-soft)] shadow-sm">
                {dispute.description}
              </p>
            </div>

            {dispute.desiredResolution && (
              <div>
                <span className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider block mb-1">Желаемое решение</span>
                <p className="text-xs sm:text-sm text-[var(--text-primary)] font-semibold italic">
                  {dispute.desiredResolution}
                </p>
              </div>
            )}

            {dispute.files.length > 0 && (
              <div>
                <span className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider block mb-1">Приложенные доказательства</span>
                <div className="space-y-2 mt-2">
                  {dispute.files.map((file, i) => (
                    <div key={i} className="p-3 bg-[var(--background-secondary)] border border-[var(--border-soft)] rounded-xl flex items-center gap-2 text-xs shadow-sm">
                      <FileText className="w-4 h-4 text-[var(--gold-primary)]" />
                      <span className="text-[var(--text-primary)] font-medium truncate">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[var(--border-soft)] flex justify-between text-xs text-[var(--text-secondary)] font-mono font-bold uppercase">
              <span>Создано: {new Date(dispute.createdAt).toLocaleString('ru-RU')}</span>
              <span>Изменено: {new Date(dispute.updatedAt).toLocaleString('ru-RU')}</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 font-sans text-[var(--text-primary)] bg-[var(--background-primary)] animate-fade-in" id="disputes-list-view">
      <header className="sticky top-0 z-30 bg-[var(--background-elevated)]/85 backdrop-blur-md border-b border-[var(--border-soft)] px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 bg-[var(--background-secondary)] hover:bg-[var(--border-soft)]/40 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight text-[var(--text-primary)]">Медиация и обращения</h1>
              <p className="text-xs text-[var(--text-secondary)]">Решение спорных ситуаций и поддержка сделок</p>
            </div>
          </div>

          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 premium-gold-button text-xs font-black uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              Новый спор
            </button>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-8 space-y-6 text-left">
        {isCreating ? (
          <form onSubmit={handleCreateDispute} className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-4 shadow-sm text-left">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">Открыть обращение</h2>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="text-xs text-[var(--text-secondary)] font-bold hover:text-[var(--text-primary)] cursor-pointer"
              >
                Отмена
              </button>
            </div>

            {/* Booking selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] block pl-1">Выберите спорный заказ *</label>
              <select
                required
                value={selectedBookingId}
                onChange={e => setSelectedBookingId(e.target.value)}
                className="w-full min-h-[48px] bg-[var(--background-secondary)] border border-[var(--border-soft)] focus:border-[var(--gold-primary)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none transition-colors"
              >
                <option value="">-- Выберите заказ из вашего списка --</option>
                {allBookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.contractorName} ({b.eventName} • {b.price.toLocaleString('ru-RU')} ₽)
                  </option>
                ))}
              </select>
            </div>

            {/* Dispute Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] block pl-1">Категория разногласий *</label>
              <select
                value={disputeType}
                onChange={e => setDisputeType(e.target.value)}
                className="w-full min-h-[48px] bg-[var(--background-secondary)] border border-[var(--border-soft)] focus:border-[var(--gold-primary)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none transition-colors"
              >
                <option value="cancellation">Отмена заказа</option>
                <option value="reschedule">Перенос мероприятия</option>
                <option value="refund">Возврат средств</option>
                <option value="contractor_no_show">Исполнитель не явился на площадку</option>
                <option value="client_no_show">Клиент не явился на площадку</option>
                <option value="partial_service">Услуга оказана не в полном объеме</option>
                <option value="quality_dispute">Несоответствие качеству услуг</option>
                <option value="scope_dispute">Нарушение состава услуг по договору</option>
                <option value="payment_dispute">Разногласия по оплате / доп. расходам</option>
                <option value="contractor_complaint">Жалоба на действия подрядчика</option>
                <option value="client_complaint">Жалоба на действия клиента</option>
              </select>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] block pl-1">Суть претензии (кратко) *</label>
              <input
                required
                type="text"
                placeholder="Пример: Подрядчик отменил бронирование за день до события"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full min-h-[48px] bg-[var(--background-secondary)] border border-[var(--border-soft)] focus:border-[var(--gold-primary)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] block pl-1">Детальное описание ситуации *</label>
              <textarea
                required
                rows={5}
                placeholder="Подробно опишите, что произошло, даты, договоренности и суть разногласий."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-[var(--background-secondary)] border border-[var(--border-soft)] focus:border-[var(--gold-primary)] rounded-xl p-3 text-sm text-[var(--text-primary)] focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Desired Resolution */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] block pl-1">Желаемый исход</label>
              <input
                type="text"
                placeholder="Пример: Полный возврат внесенного аванса 5000 рублей"
                value={desiredResolution}
                onChange={e => setDesiredResolution(e.target.value)}
                className="w-full min-h-[48px] bg-[var(--background-secondary)] border border-[var(--border-soft)] focus:border-[var(--gold-primary)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none transition-colors"
              />
            </div>

            {/* Photos */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] block pl-1">Фотоматериалы (ссылки или названия)</label>
              <input
                type="text"
                placeholder="скриншот_переписки.png, фото_площадки.jpg"
                value={photosInput}
                onChange={e => setPhotosInput(e.target.value)}
                className="w-full min-h-[48px] bg-[var(--background-secondary)] border border-[var(--border-soft)] focus:border-[var(--gold-primary)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none transition-colors"
              />
            </div>

            {/* Documents */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] block pl-1">Договоры и чеки (доказательства)</label>
              <input
                type="text"
                placeholder="копия_договора_аренды.pdf, квитанция_об_оплате.jpg"
                value={docsInput}
                onChange={e => setDocsInput(e.target.value)}
                className="w-full min-h-[48px] bg-[var(--background-secondary)] border border-[var(--border-soft)] focus:border-[var(--gold-primary)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 premium-gold-button font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Отправить на медиацию
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-left">
            {disputes.length === 0 ? (
              <div className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-8 text-center space-y-4 shadow-sm">
                <AlertCircle className="w-12 h-12 text-[var(--text-secondary)]/40 mx-auto" />
                <div className="text-center">
                  <h3 className="font-black text-[var(--text-primary)] text-base">У вас нет активных обращений</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto leading-relaxed font-bold">
                    Все ваши заказы выполняются в штатном режиме. В спорных ситуациях служба медиации NADO всегда готова помочь найти разумный компромисс.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-5 py-3 bg-[var(--background-secondary)] border border-[var(--border-soft)] hover:bg-[var(--border-soft)]/20 text-[var(--text-primary)] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors"
                >
                  Открыть новое обращение
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/disputes/${d.id}`)}
                    className="p-5 bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[20px] cursor-pointer transition-all shadow-sm hover:border-[var(--gold-primary)]/40 hover:scale-[1.01] text-left"
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-[var(--text-secondary)] font-mono font-bold">#{d.id.split('-')[1]}</span>
                        <h4 className="font-black text-[var(--text-primary)] text-sm mt-0.5 truncate">{d.reason}</h4>
                      </div>
                      {getStatusBadge(d.status)}
                    </div>
                    
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed font-semibold">
                      {d.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex justify-between items-center text-xs text-[var(--text-secondary)] font-mono font-bold uppercase">
                      <span>Категория: {getCategoryLabel(d.type)}</span>
                      <span>{new Date(d.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
