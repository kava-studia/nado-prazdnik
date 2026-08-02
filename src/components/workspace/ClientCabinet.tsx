import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Wallet,
  Percent,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Wine,
  Plus,
  ArrowRight
} from 'lucide-react';
import { eventRepository, contractRepository, disputeRepository } from '../../repositories';
import { EventProject, GeneratedContract, DisputeCase } from '../../types';

import { useAuth } from '../../context/AuthContext';

export default function ClientCabinet() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeProject, setActiveProject] = useState<EventProject | null>(null);
  const [contracts, setContracts] = useState<GeneratedContract[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const events = await eventRepository.listEvents({ clientId: currentUser?.id || 'demo-user-id' });
      if (events.length > 0) {
        // Use first active or planning project as active
        const active = events.find(e => e.status === 'active' || e.status === 'planning') || events[0];
        setActiveProject(active);
      } else {
        setActiveProject(null);
      }

      const clientContracts = await contractRepository.listContracts({ clientId: 'demo-user-id' });
      setContracts(clientContracts);

      const clientDisputes = await disputeRepository.listDisputes('demo-user-id');
      setDisputes(clientDisputes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Listen for demo changes to re-sync
    window.addEventListener('demo-state-changed', loadData);
    return () => window.removeEventListener('demo-state-changed', loadData);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" id="client-cabinet-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8" id="client-cabinet-dashboard">
      {/* Welcome Banner / No Event State */}
      {!activeProject ? (
        <div className="bg-[var(--surface-primary)] border border-dashed border-[var(--border-primary)] rounded-3xl p-10 text-center space-y-6">
          <h3 className="text-2xl font-bold">У вас пока нет запланированных праздников</h3>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto">
            Используйте пошаговый планировщик NADO, чтобы рассчитать бюджет, подобрать площадку и составить график подготовки.
          </p>
          <button
            onClick={() => navigate('/create-event')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--gold-primary)] text-black font-semibold rounded-2xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Создать мероприятие</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Stats Card */}
          <div className="lg:col-span-2 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-[var(--gold-primary)] uppercase tracking-widest font-semibold block mb-1">
                  Активное событие
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {activeProject.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                  Тип: {activeProject.eventType === 'Wedding' ? 'Свадьба' : activeProject.eventType === 'Birthday' ? 'День рождения' : activeProject.eventType === 'Corporate' ? 'Корпоратив' : activeProject.eventType}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-[var(--surface-secondary)] border border-[var(--border-soft)] px-4 py-2.5 rounded-2xl">
                <Percent className="w-4 h-4 text-[var(--gold-primary)]" />
                <div>
                  <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Готовность</div>
                  <div className="text-sm font-bold font-mono">{activeProject.progressPercent || 0}%</div>
                </div>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-b border-[var(--border-soft)] py-6">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Calendar className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                <span>
                  {activeProject.date ? new Date(activeProject.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Дата не выбрана'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Users className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                <span>{activeProject.guestsCount || 0} гостей</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] col-span-2 sm:col-span-1">
                <Wallet className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                <span className="font-semibold text-[var(--text-primary)]">
                  {(activeProject.budgetTotal || 0).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>

            {/* Plan Checklist Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Шаги подготовки</h4>
                <button
                  onClick={() => navigate(`/events/${activeProject.id}/plan`)}
                  className="text-xs text-[var(--gold-primary)] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Посмотреть все</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeProject.planItems && activeProject.planItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => navigate(item.route || `/events/${activeProject.id}/plan`)}
                    className="flex items-center justify-between p-3.5 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl hover:border-[var(--gold-primary)] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={`w-5 h-5 ${item.status === 'booked' || item.status === 'completed' ? 'text-[var(--gold-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--gold-primary)]'} shrink-0`} />
                      <div className="text-left">
                        <span className="text-xs font-semibold block text-[var(--text-primary)]">{item.title}</span>
                        <span className="text-xs text-[var(--text-secondary)] block truncate max-w-[200px]">{item.description}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold bg-black/10 px-2 py-0.5 rounded-full uppercase text-[var(--text-secondary)] shrink-0 font-mono">
                      {item.status === 'booked' ? 'Бронь' : item.status === 'completed' ? 'Готово' : 'В работе'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Area: Drinks & quick tools */}
          <div className="space-y-8">
            {/* Drinks calculator preview */}
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[var(--gold-primary)]/10 flex items-center justify-center text-[var(--gold-primary)]">
                <Wine className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold">Калькулятор напитков</h4>
              {activeProject.drinksCalculation ? (
                <div className="space-y-3">
                  <div className="text-xs text-[var(--text-secondary)]">Сохранен расчет напитков под ваше мероприятие:</div>
                  <div className="p-3 bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border-soft)] space-y-2">
                    {activeProject.drinksCalculation.savedDrinksList.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">{item.name}</span>
                        <span className="font-semibold font-mono">{item.bottles} бут. ({item.liters}л)</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/drinks-calculator')}
                    className="w-full py-2.5 bg-[var(--surface-secondary)] border border-[var(--border-soft)] hover:border-[var(--gold-primary)] rounded-xl text-xs font-semibold transition-all"
                  >
                    Пересчитать
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Рассчитайте алкоголь и соки для гостей с учетом времени года, меню и бюджета.
                  </p>
                  <button
                    onClick={() => navigate('/drinks-calculator')}
                    className="w-full py-2.5 bg-[var(--gold-primary)] text-black rounded-xl text-xs font-bold transition-all"
                  >
                    Запустить расчет
                  </button>
                </div>
              )}
            </div>

            {/* Quick contracts overview */}
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold">Договоры и соглашения</h4>
              {contracts.length > 0 ? (
                <div className="space-y-3.5">
                  {contracts.map(contract => (
                    <div
                      key={contract.id}
                      onClick={() => navigate(`/orders/${contract.orderId || 'demo-b'}/terms`)}
                      className="flex items-center justify-between p-3 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-xl hover:border-[var(--gold-primary)] transition-all cursor-pointer"
                    >
                      <div className="text-left">
                        <span className="text-xs font-semibold block text-[var(--text-primary)] truncate max-w-[150px]">
                          {contract.templateName}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] block font-mono">
                          Версия {contract.currentVersion} • {contract.contractorName}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold font-mono uppercase bg-yellow-500/10 text-yellow-500">
                        {contract.status === 'ready_for_review' ? 'Проверка' : 'Одобрен'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">Нет сформированных договоров по проекту.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disputes Cases */}
      {disputes.length > 0 && (
        <div className="bg-[var(--surface-primary)] border border-red-500/20 rounded-3xl p-6 space-y-4 shadow-sm" id="client-disputes-panel">
          <div className="flex items-center gap-2.5 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="text-lg font-bold">Активные споры и арбитраж</h4>
          </div>
          <div className="space-y-3">
            {disputes.map(dispute => (
              <div
                key={dispute.id}
                onClick={() => navigate(`/disputes/${dispute.id}`)}
                className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl flex flex-wrap items-center justify-between gap-4 hover:bg-red-500/10 transition-all cursor-pointer text-left"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-red-500 block uppercase tracking-wider font-mono">
                    {dispute.type === 'quality_dispute' ? 'Претензия по качеству' : 'Спор по условиям'}
                  </span>
                  <p className="text-sm font-semibold">{dispute.reason}</p>
                  <p className="text-xs text-[var(--text-secondary)] max-w-xl line-clamp-1">{dispute.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold font-mono bg-red-500/20 text-red-400 px-2.5 py-1 rounded-lg uppercase">
                    {dispute.status === 'under_review' ? 'На рассмотрении' : 'Ожидает инфо'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
