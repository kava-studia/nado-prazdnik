import { describe, expect, test } from 'vitest';
import { DisputeCase } from '../types';
import {
  approveFinancialResolution,
  completeFactCheck,
  getSlaDeadline,
  normalizeReclamationCase,
  proposeReclamationResolution
} from './reclamationService';

const NOW = new Date('2026-08-01T12:00:00.000Z');

function baseCase(overrides: Partial<DisputeCase> = {}): DisputeCase {
  return {
    id: 'case-1',
    orderId: 'order-1',
    bookingId: 'order-1',
    type: 'quality_dispute',
    reason: 'Услуга оказана не полностью',
    description: 'Не было заявленного оборудования',
    desiredResolution: 'Частичный возврат',
    files: ['act.pdf'],
    status: 'sent',
    riskType: 'service',
    orderAmount: 45_000,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides
  };
}

describe('reclamationService', () => {
  test('SAFETY and FRAUD cases receive a 30 minute SLA', () => {
    const safety = normalizeReclamationCase(baseCase({ riskType: 'safety' }), 'system', NOW);
    expect(safety.priority).toBe('critical');
    expect(safety.slaDeadlineAt).toBe(getSlaDeadline('critical', NOW));
  });

  test('FRAUD automatically creates an operations block request', () => {
    const fraud = normalizeReclamationCase(baseCase({ riskType: 'fraud' }), 'system', NOW);
    expect(fraud.operationsBlockRequest?.status).toBe('requested');
    expect(fraud.actionHistory?.some(item => item.action === 'OPS_BLOCK_REQUESTED')).toBe(true);
  });

  test('a resolution cannot be proposed before fact check', () => {
    expect(() => proposeReclamationResolution(baseCase(), {
      actorId: 'manager-1',
      outcome: 'partial_compensation',
      note: 'Частичный возврат',
      compensationAmount: 10_000
    }, NOW)).toThrow('до завершения проверки фактов');
  });

  test('compensation is capped by order amount', () => {
    const checked = completeFactCheck(baseCase(), 'manager-1', {
      orderTermsChecked: true,
      evidenceReviewed: true,
      partiesContacted: true
    }, NOW);
    expect(() => proposeReclamationResolution(checked, {
      actorId: 'manager-1',
      outcome: 'full_compensation',
      note: 'Полный возврат',
      compensationAmount: 50_000
    }, NOW)).toThrow('не может превышать стоимость заказа');
  });

  test('the proposal author cannot approve their own financial decision', () => {
    const checked = completeFactCheck(baseCase(), 'manager-1', {
      orderTermsChecked: true,
      evidenceReviewed: true,
      partiesContacted: true
    }, NOW);
    const proposed = proposeReclamationResolution(checked, {
      actorId: 'manager-1',
      outcome: 'partial_compensation',
      note: 'Возврат стоимости отсутствовавшего света',
      compensationAmount: 15_000
    }, NOW);
    expect(() => approveFinancialResolution(
      proposed,
      'manager-1',
      ['disputes.approve_financial'],
      NOW
    )).toThrow('не может сам подтвердить');
  });

  test('a second authorized employee can approve a financial decision', () => {
    const checked = completeFactCheck(baseCase(), 'manager-1', {
      orderTermsChecked: true,
      evidenceReviewed: true,
      partiesContacted: true
    }, NOW);
    const proposed = proposeReclamationResolution(checked, {
      actorId: 'manager-1',
      outcome: 'partial_compensation',
      note: 'Возврат стоимости отсутствовавшего света',
      compensationAmount: 15_000
    }, NOW);
    const approved = approveFinancialResolution(
      proposed,
      'owner-1',
      ['disputes.approve_financial'],
      NOW
    );
    expect(approved.status).toBe('resolved');
    expect(approved.resolutionProposal?.financialApprovalStatus).toBe('approved');
  });
});
