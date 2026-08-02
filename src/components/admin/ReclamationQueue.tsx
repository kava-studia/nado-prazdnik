import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MessageSquareText,
  ShieldAlert,
  UserCheck,
  WalletCards
} from 'lucide-react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { DisputeCase } from '../../types';
import {
  addInternalCaseNote,
  approveFinancialResolution,
  assignReclamationCase,
  completeFactCheck,
  isSlaOverdue,
  normalizeReclamationCase,
  proposeReclamationResolution
} from '../../services/reclamationService';

interface Props {
  actorId: string;
  actorName: string;
  permissions: string[];
  demoMode: boolean;
}

const statusLabels: Record<DisputeCase['status'], string> = {
  draft: 'Черновик',
  sent: 'Новое',
  under_review: 'В работе',
  info_needed: 'Нужны данные',
  awaiting_financial_approval: 'Финансовое подтверждение',
  resolved: 'Решено',
  closed: 'Закрыто'
};

function demoCases(): DisputeCase[] {
  const now = Date.now();
  return [
    {
      id: 'dispute-demo-quality',
      orderId: 'demo-b-disputed',
      bookingId: 'demo-b-disputed',
      type: 'quality_dispute',
      reason: 'Диджей опоздал и не привёз световое оборудование',
      description: 'Музыка началась на два часа позже. Заявленный свет отсутствовал.',
      desiredResolution: 'Частичный возврат оплаты',
      files: ['акт_заказчика.pdf', 'фото_пустой_сцены.jpg'],
      status: 'sent',
      riskType: 'service',
      orderAmount: 45_000,
      createdAt: new Date(now - 35 * 60_000).toISOString(),
      updatedAt: new Date(now - 35 * 60_000).toISOString()
    },
    {
      id: 'dispute-demo-safety',
      orderId: 'demo-b-safety',
      bookingId: 'demo-b-safety',
      type: 'contractor_complaint',
      reason: 'Нарушение техники безопасности при монтаже сцены',
      description: 'Часть конструкции устанавливалась без страховочных тросов.',
      desiredResolution: 'Немедленная проверка подрядчика',
      files: ['видео_монтажа.mp4'],
      status: 'sent',
      riskType: 'safety',
      orderAmount: 180_000,
      createdAt: new Date(now - 12 * 60_000).toISOString(),
      updatedAt: new Date(now - 12 * 60_000).toISOString()
    },
    {
      id: 'dispute-demo-fraud',
      orderId: 'demo-b-fraud',
      bookingId: 'demo-b-fraud',
      type: 'payment_dispute',
      reason: 'Подрядчик просит перевести доплату на карту третьего лица',
      description: 'Реквизиты не совпадают с данными стороны в договоре.',
      desiredResolution: 'Остановить операционные действия до проверки',
      files: ['скриншот_переписки.png'],
      status: 'sent',
      riskType: 'fraud',
      orderAmount: 95_000,
      createdAt: new Date(now - 8 * 60_000).toISOString(),
      updatedAt: new Date(now - 8 * 60_000).toISOString()
    }
  ];
}

function formatRemaining(deadline?: string): string {
  if (!deadline) return 'не рассчитан';
  const minutes = Math.ceil((new Date(deadline).getTime() - Date.now()) / 60_000);
  if (minutes <= 0) return `просрочено на ${Math.abs(minutes)} мин`;
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.ceil(minutes / 60)} ч`;
}

export default function ReclamationQueue({ actorId, actorName, permissions, demoMode }: Props) {
  const { disputeRepository } = useRepositories();
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState<'active' | 'critical' | 'approval' | 'resolved'>('active');
  const [note, setNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [compensation, setCompensation] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    let list = await disputeRepository.listDisputes();
    if (demoMode && list.length === 0) {
      for (const item of demoCases()) {
        await disputeRepository.saveDispute(normalizeReclamationCase(item, 'demo-system', new Date(item.createdAt)));
      }
      list = await disputeRepository.listDisputes();
    }
    const normalized = list.map(item => normalizeReclamationCase(item));
    setCases(normalized.sort((a, b) => {
      const priority = { critical: 0, high: 1, standard: 2 };
      return priority[a.priority || 'standard'] - priority[b.priority || 'standard'];
    }));
    setSelectedId(current => current || normalized[0]?.id || '');
  };

  useEffect(() => {
    load();
  }, [disputeRepository, demoMode]);

  const visibleCases = useMemo(() => cases.filter(item => {
    if (filter === 'critical') return item.priority === 'critical';
    if (filter === 'approval') return item.status === 'awaiting_financial_approval';
    if (filter === 'resolved') return item.status === 'resolved' || item.status === 'closed';
    return item.status !== 'resolved' && item.status !== 'closed';
  }), [cases, filter]);

  const selected = cases.find(item => item.id === selectedId) || visibleCases[0];

  const save = async (next: DisputeCase, successMessage: string) => {
    await disputeRepository.saveDispute(next);
    setMessage(successMessage);
    await load();
  };

  const run = async (action: () => Promise<void>) => {
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось выполнить действие');
    }
  };

  const canManage = permissions.includes('disputes.manage') || permissions.includes('system.admin');
  const canApprove = permissions.includes('disputes.approve_financial') || permissions.includes('system.admin');

  return (
    <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-5 animate-fade-in" id="reclamation-control-center">
      <section className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-4 space-y-4 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] font-black text-[var(--gold-primary)]">Очередь рекламаций</p>
            <h3 className="text-xl font-black mt-1">{visibleCases.length} дел</h3>
          </div>
          {demoMode && <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[var(--gold-highlight)] text-[var(--gold-deep)]">ДЕМО</span>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {([
            ['active', 'Активные'],
            ['critical', 'Критические'],
            ['approval', 'На подтверждении'],
            ['resolved', 'Решённые']
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border text-left ${filter === value ? 'bg-[var(--gold-primary)] text-black border-[var(--gold-primary)]' : 'bg-[var(--surface-secondary)] border-[var(--border-soft)] text-[var(--text-secondary)]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {visibleCases.map(item => {
            const overdue = isSlaOverdue(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${selected?.id === item.id ? 'border-[var(--gold-primary)] bg-[var(--gold-highlight)]' : 'border-[var(--border-soft)] bg-[var(--surface-secondary)] hover:border-[var(--gold-primary)]/50'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-black uppercase ${item.priority === 'critical' ? 'text-red-600' : 'text-[var(--text-secondary)]'}`}>
                    {item.priority === 'critical' ? 'Критический' : item.priority === 'high' ? 'Высокий' : 'Стандартный'}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">{statusLabels[item.status]}</span>
                </div>
                <p className="text-sm font-black mt-2 line-clamp-2">{item.reason}</p>
                <div className={`flex items-center gap-1.5 mt-3 text-xs font-bold ${overdue ? 'text-red-600' : 'text-[var(--text-secondary)]'}`}>
                  <Clock3 className="w-3.5 h-3.5" /> SLA: {formatRemaining(item.slaDeadlineAt)}
                </div>
              </button>
            );
          })}
          {visibleCases.length === 0 && (
            <div className="p-6 text-center text-sm text-[var(--text-secondary)] border border-dashed border-[var(--border-soft)] rounded-2xl">
              В этой очереди дел нет
            </div>
          )}
        </div>
      </section>

      <section className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-5 sm:p-7 min-w-0">
        {!selected ? (
          <div className="min-h-80 grid place-items-center text-sm text-[var(--text-secondary)]">Выберите обращение</div>
        ) : (
          <div className="space-y-6">
            <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--gold-primary)]">Дело {selected.id}</span>
                  {selected.riskType === 'safety' && <span className="text-xs font-black px-2 py-1 rounded-full bg-red-100 text-red-700">SAFETY</span>}
                  {selected.riskType === 'fraud' && <span className="text-xs font-black px-2 py-1 rounded-full bg-red-100 text-red-700">FRAUD</span>}
                </div>
                <h3 className="text-xl sm:text-2xl font-black max-w-3xl">{selected.reason}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{selected.description}</p>
              </div>
              <div className="shrink-0 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] p-3 min-w-44">
                <span className="text-xs text-[var(--text-muted)] font-bold uppercase">Стоимость заказа</span>
                <p className="text-lg font-black mt-1">{(selected.orderAmount || 0).toLocaleString('ru-RU')} ₽</p>
              </div>
            </header>

            {selected.operationsBlockRequest && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3 text-red-800">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black">Запрошена операционная блокировка</p>
                  <p className="text-xs mt-1">{selected.operationsBlockRequest.reason}. Статус: {selected.operationsBlockRequest.status === 'requested' ? 'ожидает решения службы безопасности' : selected.operationsBlockRequest.status}.</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)]">
                <UserCheck className="w-5 h-5 text-[var(--gold-primary)]" />
                <p className="text-xs text-[var(--text-muted)] font-bold uppercase mt-3">Ответственный</p>
                <p className="text-sm font-black mt-1">{selected.assignedManagerName || 'Не назначен'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)]">
                <FileCheck2 className="w-5 h-5 text-[var(--gold-primary)]" />
                <p className="text-xs text-[var(--text-muted)] font-bold uppercase mt-3">Проверка фактов</p>
                <p className="text-sm font-black mt-1">{selected.factCheck?.completedAt ? 'Завершена' : 'Не завершена'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)]">
                <WalletCards className="w-5 h-5 text-[var(--gold-primary)]" />
                <p className="text-xs text-[var(--text-muted)] font-bold uppercase mt-3">Денежное решение</p>
                <p className="text-sm font-black mt-1">{selected.resolutionProposal?.financialApprovalStatus === 'pending' ? 'Ждёт второго сотрудника' : selected.resolutionProposal?.financialApprovalStatus === 'approved' ? 'Подтверждено' : 'Нет'}</p>
              </div>
            </div>

            {message && (
              <div className="p-3.5 rounded-xl bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/30 text-sm font-bold">{message}</div>
            )}

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="space-y-3">
                <h4 className="text-sm font-black uppercase tracking-wider">Работа менеджера</h4>
                {!selected.assignedManagerId && (
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => run(() => save(assignReclamationCase(selected, { id: actorId, name: actorName }), 'Дело принято в работу'))}
                    className="w-full py-3 px-4 rounded-xl bg-[var(--gold-primary)] text-black font-black text-sm disabled:opacity-40"
                  >
                    Назначить себя ответственным
                  </button>
                )}
                {!selected.factCheck?.completedAt && (
                  <button
                    type="button"
                    disabled={!canManage || !selected.assignedManagerId}
                    onClick={() => run(() => save(completeFactCheck(selected, actorId, {
                      orderTermsChecked: true,
                      evidenceReviewed: true,
                      partiesContacted: true
                    }), 'Проверка фактов завершена'))}
                    className="w-full py-3 px-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-secondary)] font-black text-sm disabled:opacity-40"
                  >
                    Завершить проверку по чек-листу
                  </button>
                )}

                <textarea
                  value={resolutionNote}
                  onChange={event => setResolutionNote(event.target.value)}
                  placeholder="Обоснование решения"
                  className="w-full min-h-24 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] p-3 text-sm outline-none focus:border-[var(--gold-primary)]"
                />
                <input
                  value={compensation}
                  onChange={event => setCompensation(event.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Компенсация, ₽ - не выше суммы заказа"
                  className="w-full min-h-12 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] px-3 text-sm outline-none focus:border-[var(--gold-primary)]"
                />
                <button
                  type="button"
                  disabled={!canManage || !selected.factCheck?.completedAt}
                  onClick={() => run(() => save(proposeReclamationResolution(selected, {
                    actorId,
                    outcome: Number(compensation) > 0 ? 'partial_compensation' : 'no_action',
                    note: resolutionNote,
                    compensationAmount: Number(compensation) || 0
                  }), Number(compensation) > 0 ? 'Решение отправлено на отдельное финансовое подтверждение' : 'Решение зафиксировано'))}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--text-primary)] text-[var(--background-primary)] font-black text-sm disabled:opacity-40"
                >
                  Зафиксировать предложение
                </button>

                {selected.status === 'awaiting_financial_approval' && (
                  <button
                    type="button"
                    disabled={!canApprove}
                    onClick={() => run(() => save(approveFinancialResolution(selected, actorId, permissions), 'Денежное решение подтверждено вторым сотрудником'))}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-black text-sm disabled:opacity-40"
                  >
                    Подтвердить денежное решение
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-black uppercase tracking-wider">Внутренние заметки</h4>
                <textarea
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  placeholder="Видно только сотрудникам контура"
                  className="w-full min-h-24 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] p-3 text-sm outline-none focus:border-[var(--gold-primary)]"
                />
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => run(async () => {
                    await save(addInternalCaseNote(selected, { id: actorId, name: actorName }, note), 'Внутренняя заметка добавлена');
                    setNote('');
                  })}
                  className="w-full py-3 px-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-secondary)] font-black text-sm disabled:opacity-40"
                >
                  <MessageSquareText className="w-4 h-4 inline mr-2" /> Добавить заметку
                </button>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {(selected.internalNotes || []).map(item => (
                    <div key={item.id} className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)]">
                      <div className="flex justify-between gap-2 text-xs text-[var(--text-muted)] font-bold">
                        <span>{item.authorName}</span>
                        <span>{new Date(item.createdAt).toLocaleString('ru-RU')}</span>
                      </div>
                      <p className="text-sm mt-2">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-soft)] pt-5">
              <h4 className="text-sm font-black uppercase tracking-wider mb-3">Неизменяемая история действий</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...(selected.actionHistory || [])].reverse().map(item => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)]">
                    {item.action.includes('APPROVED') || item.action.includes('COMPLETED') ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : item.action.includes('BLOCK') ? <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /> : <Clock3 className="w-4 h-4 text-[var(--gold-primary)] shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-xs font-black">{item.action}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{item.details}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{item.actorId} - {new Date(item.createdAt).toLocaleString('ru-RU')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
