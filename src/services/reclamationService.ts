import { DisputeActionEntry, DisputeCase, DisputeFactCheck } from '../types';

const SLA_MINUTES = {
  standard: 24 * 60,
  high: 4 * 60,
  critical: 30
} as const;

function cloneCase(dispute: DisputeCase): DisputeCase {
  return structuredClone(dispute);
}

function action(actorId: string, actionName: string, details: string, now: Date): DisputeActionEntry {
  return {
    id: `case-action-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    actorId,
    action: actionName,
    details,
    createdAt: now.toISOString()
  };
}

function appendAction(dispute: DisputeCase, entry: DisputeActionEntry): void {
  dispute.actionHistory = [...(dispute.actionHistory || []), entry];
}

export function getCasePriority(riskType: DisputeCase['riskType']): NonNullable<DisputeCase['priority']> {
  if (riskType === 'safety' || riskType === 'fraud') return 'critical';
  if (riskType === 'financial') return 'high';
  return 'standard';
}

export function getSlaDeadline(priority: NonNullable<DisputeCase['priority']>, now = new Date()): string {
  return new Date(now.getTime() + SLA_MINUTES[priority] * 60_000).toISOString();
}

export function normalizeReclamationCase(dispute: DisputeCase, actorId = 'system', now = new Date()): DisputeCase {
  const next = cloneCase(dispute);
  next.riskType = next.riskType || 'service';
  next.priority = next.priority || getCasePriority(next.riskType);
  next.slaDeadlineAt = next.slaDeadlineAt || getSlaDeadline(next.priority, now);
  next.factCheck = next.factCheck || {
    orderTermsChecked: false,
    evidenceReviewed: false,
    partiesContacted: false
  };
  next.internalNotes = next.internalNotes || [];
  next.actionHistory = next.actionHistory || [];

  if (next.actionHistory.length === 0) {
    appendAction(next, action(actorId, 'CASE_REGISTERED', 'Обращение зарегистрировано в очереди рекламаций', now));
  }

  if (next.riskType === 'fraud' && !next.operationsBlockRequest) {
    next.operationsBlockRequest = {
      requestedAt: now.toISOString(),
      requestedBy: actorId,
      status: 'requested',
      reason: 'Автоматический запрос операционной блокировки по сигналу FRAUD'
    };
    appendAction(next, action(actorId, 'OPS_BLOCK_REQUESTED', 'Создан запрос операционной блокировки', now));
  }

  return next;
}

export function assignReclamationCase(
  dispute: DisputeCase,
  manager: { id: string; name: string },
  now = new Date()
): DisputeCase {
  const next = normalizeReclamationCase(dispute, manager.id, now);
  next.assignedManagerId = manager.id;
  next.assignedManagerName = manager.name;
  next.status = 'under_review';
  next.firstResponseAt = next.firstResponseAt || now.toISOString();
  next.updatedAt = now.toISOString();
  appendAction(next, action(manager.id, 'CASE_ASSIGNED', `Ответственный менеджер: ${manager.name}`, now));
  return next;
}

export function completeFactCheck(
  dispute: DisputeCase,
  actorId: string,
  checklist: DisputeFactCheck,
  now = new Date()
): DisputeCase {
  if (!checklist.orderTermsChecked || !checklist.evidenceReviewed || !checklist.partiesContacted) {
    throw new Error('Нельзя завершить проверку: договор, доказательства и позиции сторон должны быть проверены');
  }

  const next = normalizeReclamationCase(dispute, actorId, now);
  next.factCheck = {
    ...checklist,
    completedAt: now.toISOString(),
    completedBy: actorId
  };
  next.updatedAt = now.toISOString();
  appendAction(next, action(actorId, 'FACT_CHECK_COMPLETED', 'Проверка фактов завершена по обязательному чек-листу', now));
  return next;
}

export function proposeReclamationResolution(
  dispute: DisputeCase,
  params: {
    actorId: string;
    outcome: NonNullable<DisputeCase['resolutionProposal']>['outcome'];
    note: string;
    compensationAmount?: number;
  },
  now = new Date()
): DisputeCase {
  const next = normalizeReclamationCase(dispute, params.actorId, now);
  if (!next.factCheck?.completedAt) {
    throw new Error('Решение нельзя предложить до завершения проверки фактов');
  }

  const amount = Math.max(0, params.compensationAmount || 0);
  const orderAmount = Math.max(0, next.orderAmount || 0);
  if (amount > orderAmount) {
    throw new Error('Компенсация не может превышать стоимость заказа');
  }
  if (!params.note.trim()) {
    throw new Error('Добавьте обоснование решения');
  }

  next.resolutionProposal = {
    outcome: params.outcome,
    note: params.note.trim(),
    compensationAmount: amount,
    proposedBy: params.actorId,
    proposedAt: now.toISOString(),
    financialApprovalStatus: amount > 0 ? 'pending' : 'not_required'
  };
  next.status = amount > 0 ? 'awaiting_financial_approval' : 'resolved';
  next.updatedAt = now.toISOString();
  appendAction(next, action(
    params.actorId,
    'RESOLUTION_PROPOSED',
    amount > 0 ? `Предложена компенсация ${amount} ₽, требуется отдельное подтверждение` : 'Предложено решение без денежной компенсации',
    now
  ));
  return next;
}

export function approveFinancialResolution(
  dispute: DisputeCase,
  approverId: string,
  permissions: string[],
  now = new Date()
): DisputeCase {
  const next = normalizeReclamationCase(dispute, approverId, now);
  const proposal = next.resolutionProposal;
  if (!proposal || proposal.financialApprovalStatus !== 'pending') {
    throw new Error('Нет денежного решения, ожидающего подтверждения');
  }
  if (!permissions.includes('disputes.approve_financial') && !permissions.includes('system.admin')) {
    throw new Error('Недостаточно прав для подтверждения денежного решения');
  }
  if (proposal.proposedBy === approverId) {
    throw new Error('Автор решения не может сам подтвердить выплату');
  }
  if (proposal.compensationAmount > Math.max(0, next.orderAmount || 0)) {
    throw new Error('Компенсация не может превышать стоимость заказа');
  }

  proposal.financialApprovalStatus = 'approved';
  proposal.financialApprovedBy = approverId;
  proposal.financialApprovedAt = now.toISOString();
  next.status = 'resolved';
  next.updatedAt = now.toISOString();
  appendAction(next, action(approverId, 'FINANCIAL_DECISION_APPROVED', 'Денежное решение подтверждено вторым уполномоченным сотрудником', now));
  return next;
}

export function addInternalCaseNote(
  dispute: DisputeCase,
  author: { id: string; name: string },
  text: string,
  now = new Date()
): DisputeCase {
  if (!text.trim()) throw new Error('Внутренняя заметка не может быть пустой');
  const next = normalizeReclamationCase(dispute, author.id, now);
  next.internalNotes = [
    ...(next.internalNotes || []),
    {
      id: `case-note-${now.getTime()}`,
      authorId: author.id,
      authorName: author.name,
      text: text.trim(),
      createdAt: now.toISOString()
    }
  ];
  next.updatedAt = now.toISOString();
  appendAction(next, action(author.id, 'INTERNAL_NOTE_ADDED', 'Добавлена внутренняя заметка без изменения решения', now));
  return next;
}

export function isSlaOverdue(dispute: DisputeCase, now = new Date()): boolean {
  return Boolean(dispute.slaDeadlineAt && !dispute.firstResponseAt && new Date(dispute.slaDeadlineAt).getTime() < now.getTime());
}
