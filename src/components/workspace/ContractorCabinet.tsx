import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart2,
  Award,
  BookOpen,
  Plus,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Trash,
  Sliders,
  DollarSign as PriceIcon
} from 'lucide-react';
import {
  leadRepository,
  contractorRepository,
  calendarRepository,
  scoringRepository,
  analyticsRepository
} from '../../repositories';
import { CRMLead, ContractorProfile, AvailabilitySlot, CalendarResource, ContractorScore } from '../../types';

export default function ContractorCabinet() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [resources, setResources] = useState<CalendarResource[]>([]);
  const [score, setScore] = useState<ContractorScore | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // SLA Countdown state
  const [timeLeftStr, setTimeLeftStr] = useState<Record<string, string>>({});

  // Input states for new blocked date
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [blockReason, setBlockReason] = useState('Отпуск / Личные дела');

  // Service price change
  const [editingPriceServiceId, setEditingPriceServiceId] = useState<string | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(0);

  const [activeRuleExplain, setActiveRuleExplain] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const activeLeads = await leadRepository.listLeads('demo-user-id');
      setLeads(activeLeads);

      const p = await contractorRepository.getProfileByUserId('demo-user-id') || await contractorRepository.getProfile('demo-c-host-sokolov');
      setProfile(p);

      if (p) {
        const s = await calendarRepository.getAllSlots(p.id);
        setSlots(s);

        const res = await calendarRepository.getResources(p.id);
        setResources(res);

        const sc = await scoringRepository.getContractorScore(p.id);
        setScore(sc);

        const an = await analyticsRepository.getContractorAnalytics(p.id);
        setAnalytics(an);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('demo-state-changed', loadData);
    return () => window.removeEventListener('demo-state-changed', loadData);
  }, []);

  // SLA Timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers: Record<string, string> = {};
      leads.forEach(lead => {
        if (lead.pipelineStage !== 'needs_reply') return;
        const limitMs = 45 * 60 * 1000; // 45 min SLA
        const createdTime = new Date(lead.createdAt).getTime();
        const limitTime = createdTime + limitMs;
        const now = Date.now();
        const diff = limitTime - now;

        if (diff <= 0) {
          updatedTimers[lead.id] = 'SLA Истёк';
        } else {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          updatedTimers[lead.id] = `${mins} мин ${secs} сек`;
        }
      });
      setTimeLeftStr(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [leads]);

  // Reply to lead simulated behavior
  const handleReplyToLead = async (leadId: string) => {
    const lead = await leadRepository.getLead(leadId);
    if (lead) {
      lead.pipelineStage = 'proposal_preparing';
      lead.firstResponseAt = new Date().toISOString();
      await leadRepository.saveLead(lead);
      await loadData();
    }
  };

  // Add Blocked Slot
  const handleAddBlockedSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newBlockedDate) return;

    const resourceId = resources[0]?.id || 'res-host-sokolov';
    const newSlot: AvailabilitySlot = {
      id: `slot-block-${Date.now()}`,
      ownerId: profile.id,
      resourceId,
      startAt: newBlockedDate,
      endAt: newBlockedDate,
      status: 'blocked',
      source: 'direct',
      notes: blockReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await calendarRepository.saveSlot(newSlot);
    setNewBlockedDate('');
    await loadData();
  };

  // Delete Slot
  const handleDeleteSlot = async (id: string) => {
    await calendarRepository.deleteSlot(id);
    await loadData();
  };

  // Update Service Price
  const handleSavePrice = async (serviceId: string) => {
    if (!profile) return;
    const sIdx = profile.services.findIndex(s => s.id === serviceId);
    if (sIdx >= 0) {
      profile.services[sIdx].price = editedPrice;
      await contractorRepository.saveProfile(profile);
      setEditingPriceServiceId(null);
      await loadData();
    }
  };

  const getSlaClass = (timerStr: string) => {
    if (!timerStr) return '';
    if (timerStr === 'SLA Истёк') return 'text-red-500 font-bold';
    if (timerStr.startsWith('0') || timerStr.startsWith('1') || timerStr.startsWith('2') || timerStr.startsWith('3') || timerStr.startsWith('4') || timerStr.startsWith('5')) {
      return 'text-amber-500 font-bold animate-pulse';
    }
    return 'text-green-500 font-semibold';
  };

  return (
    <div className="space-y-8" id="contractor-cabinet-root">
      {/* Upper Grid: Leads SLA & Score Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Leads & SLA (CRM) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[var(--gold-primary)]" />
                <h3 className="text-xl font-bold tracking-tight">Новые входящие заявки (SLA CRM)</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] font-mono">
                SLA: 45 минут
              </span>
            </div>

            {leads.length > 0 ? (
              <div className="space-y-4">
                {leads.map(lead => {
                  const isNew = lead.pipelineStage === 'needs_reply';
                  const timerVal = timeLeftStr[lead.id] || 'Обработано';

                  return (
                    <div
                      key={lead.id}
                      className={`p-5 rounded-2xl border ${isNew ? 'border-amber-500/30 bg-amber-500/5' : 'border-[var(--border-soft)] bg-[var(--surface-secondary)]'} transition-all space-y-4 text-left`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-mono text-[var(--gold-primary)] uppercase tracking-wider font-bold">
                            {lead.eventType} • {lead.city}
                          </span>
                          <h4 className="text-lg font-bold mt-1">{lead.clientName}</h4>
                        </div>

                        {/* Live SLA countdown value */}
                        {isNew ? (
                          <div className="flex items-center gap-2 bg-black/20 border border-[var(--border-soft)] px-3 py-1.5 rounded-xl font-mono text-xs">
                            <span className="text-[var(--text-muted)]">Ответ до SLA:</span>
                            <span className={getSlaClass(timerVal)}>{timerVal}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono text-xs">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Успешно принято</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-[var(--text-secondary)] leading-relaxed bg-black/10 p-3 rounded-xl border border-[var(--border-soft)]">
                        <strong className="text-[var(--text-primary)] block mb-1">Пожелания клиента:</strong>
                        {lead.requirements}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                        <div className="text-xs font-mono text-[var(--text-muted)]">
                          Бюджет: <span className="font-bold text-[var(--text-primary)]">{lead.budget.toLocaleString('ru-RU')} ₽</span> • Источник: {lead.source}
                        </div>

                        {isNew && (
                          <button
                            onClick={() => handleReplyToLead(lead.id)}
                            className="px-5 py-2.5 bg-[var(--gold-primary)] text-black font-extrabold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                          >
                            Подтвердить и связаться
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] py-4">Нет новых необработанных заявок в CRM.</p>
            )}
          </div>

          {/* Analytics Graphs (Earnings & Performance) */}
          {analytics && (
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm text-left">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[var(--gold-primary)]" />
                <h3 className="text-xl font-bold">Аналитика и финансы</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl p-4 space-y-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Общий доход</div>
                  <div className="text-2xl font-black text-[var(--text-primary)] font-mono">{(analytics.revenueTotal || 0).toLocaleString('ru-RU')} ₽</div>
                </div>
                <div className="bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl p-4 space-y-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">В ожидании</div>
                  <div className="text-2xl font-black text-amber-500 font-mono">{(analytics.revenuePending || 0).toLocaleString('ru-RU')} ₽</div>
                </div>
                <div className="bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl p-4 space-y-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Просмотры анкеты</div>
                  <div className="text-2xl font-black text-[var(--text-primary)] font-mono">{analytics.viewsCount} раз</div>
                </div>
              </div>

              {/* Visual simulated chart of earnings */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Динамика заказов</span>
                <div className="h-24 flex items-end gap-2 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl p-4">
                  <div className="bg-[var(--gold-primary)]/40 w-full rounded-t" style={{ height: '30%' }} title="Май: 3 заказа" />
                  <div className="bg-[var(--gold-primary)]/60 w-full rounded-t" style={{ height: '55%' }} title="Июнь: 5 заказов" />
                  <div className="bg-[var(--gold-primary)] w-full rounded-t" style={{ height: '85%' }} title="Июль: 8 заказов" />
                  <div className="bg-[var(--gold-primary)]/80 w-full rounded-t" style={{ height: '70%' }} title="Август (Прогноз)" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Explainable Scoring Panel */}
        <div className="space-y-6">
          {score && (
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-sm space-y-6 text-left">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-[var(--gold-primary)]" />
                <h3 className="text-xl font-bold">NADO Scoring Engine</h3>
              </div>

              {/* Score circle */}
              <div className="flex flex-col items-center justify-center p-4 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl relative overflow-hidden text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-1">Ваш рейтинг скоринга</div>
                <div className="text-5xl font-black font-mono text-[var(--gold-primary)]">
                  {score.breakdown.finalScore} <span className="text-sm font-semibold text-[var(--text-muted)]">/ 100</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] font-mono mt-2">
                  Индекс веса в каталоге: x{score.rankingWeight}
                </div>
              </div>

              {/* Metrics breakdown */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Слагаемые оценки:</h4>
                
                <div className="space-y-2 text-xs">
                  <div
                    className="flex items-center justify-between p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-all cursor-help"
                    onClick={() => setActiveRuleExplain('verification')}
                  >
                    <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                      Верификация профиля <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </span>
                    <span className="font-bold font-mono text-emerald-500">{score.breakdown.verificationScore} / 30</span>
                  </div>

                  <div
                    className="flex items-center justify-between p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-all cursor-help"
                    onClick={() => setActiveRuleExplain('calendar')}
                  >
                    <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                      Актуальность календаря <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </span>
                    <span className="font-bold font-mono text-emerald-500">{score.breakdown.availabilityAccuracyScore} / 15</span>
                  </div>

                  <div
                    className="flex items-center justify-between p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-all cursor-help"
                    onClick={() => setActiveRuleExplain('sla')}
                  >
                    <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                      Скорость ответа (SLA) <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </span>
                    <span className="font-bold font-mono text-emerald-500">{score.breakdown.responseSpeedScore} / 15</span>
                  </div>

                  {score.breakdown.cancellationScore < 0 && (
                    <div className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <span className="text-red-400 font-semibold">Штраф за отмену дат</span>
                      <span className="font-bold font-mono text-red-500">{score.breakdown.cancellationScore}</span>
                    </div>
                  )}
                </div>

                {/* Explanation text */}
                {activeRuleExplain && (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400 rounded-xl space-y-1">
                    <strong className="block text-blue-300 uppercase tracking-wide text-xs">Формула оценки:</strong>
                    {activeRuleExplain === 'verification' && 'Проверенные через Госуслуги (ЕСИА) или СБИС профили ИП/ООО получают максимальные +30 баллов скоринга автоматически.'}
                    {activeRuleExplain === 'calendar' && 'Каждое изменение свободного статуса в NADO Календаре без отмен повышает индекс точности. Обнаруженные дубли или частые отмены снижают балл.'}
                    {activeRuleExplain === 'sla' && 'Необходим ответ на входящий лид в течение 45 минут. Просрочка ответа снижает оценку.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar and services pricing section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* NADO Calendar blocks */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-sm space-y-6 text-left">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[var(--gold-primary)]" />
            <h3 className="text-xl font-bold">NADO Календарь занятости</h3>
          </div>

          <form onSubmit={handleAddBlockedSlot} className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Заблокировать дату</label>
              <input
                type="date"
                required
                value={newBlockedDate}
                onChange={e => setNewBlockedDate(e.target.value)}
                className="w-full p-2.5 text-sm bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-xl outline-none focus:border-[var(--gold-primary)] font-mono"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Причина</label>
              <input
                type="text"
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                className="w-full p-2.5 text-sm bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-xl outline-none focus:border-[var(--gold-primary)]"
              />
            </div>
            <button
              type="submit"
              className="p-2.5 bg-[var(--gold-primary)] text-black rounded-xl hover:brightness-110 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          {/* Slots list */}
          <div className="space-y-3 max-h-56 overflow-y-auto">
            {slots.length > 0 ? (
              slots.map(slot => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3.5 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-xl"
                >
                  <div>
                    <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      {new Date(slot.startAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] block mt-0.5">{slot.notes || 'Занято'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full ${slot.status === 'blocked' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {slot.status === 'blocked' ? 'Блок' : 'Удержание'}
                    </span>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 p-1 rounded transition-all cursor-pointer"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-secondary)] py-2">Все даты свободны в календаре.</p>
            )}
          </div>
        </div>

        {/* Services pricing management */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-sm space-y-6 text-left">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[var(--gold-primary)]" />
            <h3 className="text-xl font-bold">Цены и перечень услуг</h3>
          </div>

          {profile && profile.services.length > 0 ? (
            <div className="space-y-3.5">
              {profile.services.map(srv => (
                <div
                  key={srv.id}
                  className="p-4 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl space-y-3 text-left"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{srv.name}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{srv.description}</p>
                    </div>

                    {editingPriceServiceId !== srv.id ? (
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black font-mono text-[var(--gold-primary)]">
                          {srv.price.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="text-xs text-[var(--text-muted)] block">/ {srv.unit}</span>
                      </div>
                    ) : null}
                  </div>

                  {editingPriceServiceId === srv.id ? (
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={editedPrice}
                          onChange={e => setEditedPrice(Number(e.target.value))}
                          className="w-full p-2 bg-black/20 border border-[var(--border-soft)] rounded-xl outline-none text-xs text-white font-mono"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-[var(--text-muted)] font-mono">₽</span>
                      </div>
                      <button
                        onClick={() => handleSavePrice(srv.id)}
                        className="px-3.5 py-2 bg-[var(--gold-primary)] text-black text-xs font-bold rounded-lg hover:brightness-110 cursor-pointer shrink-0"
                      >
                        Сохранить
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingPriceServiceId(srv.id);
                        setEditedPrice(srv.price);
                      }}
                      className="text-xs text-[var(--gold-primary)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PriceIcon className="w-3 h-3" />
                      <span>Изменить цену</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] py-2">Нет добавленных услуг в профиле.</p>
          )}
        </div>
      </div>
    </div>
  );
}
