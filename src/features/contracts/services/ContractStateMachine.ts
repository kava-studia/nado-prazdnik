import { ContractStatus } from '../types';

export class ContractStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContractStateError';
  }
}

export class ContractStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    draft: ['data_required', 'ready_for_review', 'cancelled'],
    data_required: ['draft', 'ready_for_review', 'cancelled'],
    ready_for_review: ['sent', 'revision_required', 'cancelled'],
    sent: ['partially_confirmed', 'revision_required', 'cancelled'],
    partially_confirmed: ['confirmed', 'revision_required', 'cancelled'],
    confirmed: ['revision_required', 'completed', 'cancelled'],
    revision_required: ['draft', 'cancelled'],
    superseded: [],
    completed: [],
    cancelled: []
  };

  static canTransition(current: ContractStatus, target: ContractStatus): boolean {
    if (current === target) return true;
    const allowed = this.ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  static validateTransition(current: ContractStatus, target: ContractStatus): void {
    if (!this.canTransition(current, target)) {
      throw new ContractStateError(`Недопустимый переход статуса договора: из "${current}" в "${target}"`);
    }
  }
}
