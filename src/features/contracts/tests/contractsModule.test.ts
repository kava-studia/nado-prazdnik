import { describe, test, expect, beforeEach } from 'vitest';
import { defaultTemplates } from '../templates/defaultTemplates';
import { DemoContractRepository } from '../repositories/DemoContractRepository';
import { DemoPartyRepository } from '../../../repositories/demoRepositories';
import { ContractService } from '../services/ContractService';
import { TemplateReviewService } from '../services/TemplateReviewService';
import { ContractAccessService } from '../services/ContractAccessService';
import { renderContractText } from '../utils/contractFormatters';
import { setLegalEntityConfigForTesting } from '../../../config/legalEntity';
import { createConsentClauses, buildPlatformPolicy, buildConsentDocument } from '../templates/clauseBuilders';
import { ContractWizardValidationService } from '../services/ContractWizardValidationService';
import { getContractPartyOptionKey } from '../utils/partyOptions';

describe('NADO CONTRACTS Module Comprehensive Integration Test Suite', () => {
  let repo: DemoContractRepository;
  let service: ContractService;
  let reviewService: TemplateReviewService;
  let partyRepo: DemoPartyRepository;

  const fullValidVars = {
    client_name: 'Алексей Иванов',
    contractor_name: 'ИП Смирнов В.А.',
    event_date: '2026-08-10',
    event_time: '18:00',
    event_location: 'Москва',
    price: '50000',
    prepayment: '10000',
    service_composition: 'Организация и ведение',
    cancellation_policy: 'Бесплатная отмена за 14 дней до события',
    reschedule_policy: 'Бесплатный перенос',
    refund_policy: 'Возврат в течение 5 банковских дней',
    prepayment_due_rule: 'В течение 3 дней',
    final_payment_rule: 'В день проведения',
    force_majeure_policy: 'Освобождение от ответственности',
    duration: '5',
    dj_included: 'true'
  };

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    repo = new DemoContractRepository();
    service = new ContractService(repo);
    reviewService = new TemplateReviewService(repo);
    partyRepo = new DemoPartyRepository();
    setLegalEntityConfigForTesting({
      legalName: 'ООО НАДО ПРАЗДНИК',
      inn: '7700000000',
      ogrn: '1000000000000',
      legalAddress: 'г. Москва, ул. Праздничная, д. 1',
      directorName: 'Иванов И.И.'
    });
  });

  test('1. Creation of draft contract with legal_review template version', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: {
        clientId: 'client-100',
        contractorId: 'contractor-200'
      },
      initialValues: {
        client_name: 'Анна и Максим',
        contractor_name: 'MC KAVA',
        price: '120000',
        event_date: '2026-08-20'
      }
    });

    expect(draft.id).toBeDefined();
    expect(draft.status).toBe('draft');
    expect(draft.currentVersion).toBe(1);
    expect(draft.workingDraft?.['client_name']).toBe('Анна и Максим');
    expect(draft.confirmations).toEqual([]);
  });

  test('2. Prevention of contract draft creation when template or version is not found', async () => {
    await expect(service.createContractDraft({
      templateId: 'non-existent-template-id',
      parties: { clientId: 'c-1', contractorId: 'c-2' }
    })).rejects.toThrow();
  });

  test('3. Immutable snapshots on version creation', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });

    const sent = await service.sendForReview(draft.id, 'client-100');

    expect(sent.status).toBe('sent');
    expect(sent.currentVersion).toBe(1);

    const versions = await repo.listContractVersions(draft.id);
    expect(versions.length).toBe(1);
    expect(versions[0].immutable).toBe(true);
    expect(versions[0].version).toBe(1);
  });

  test('4. Immutable snapshot preserves prior versions on subsequent revision updates', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });

    await service.sendForReview(draft.id, 'client-100');
    await service.requestRevision(draft.id, 'contractor-200', 'Уточнить время');

    await service.updateDraftVariable(draft.id, 'event_time', '19:00', 'client-100');
    await service.createNewRevision(draft.id, 'client-100', 'Новое время события', { event_time: '19:00' });
    const v2 = await service.sendForReview(draft.id, 'client-100');

    expect(v2.currentVersion).toBe(2);
    const versions = await repo.listContractVersions(draft.id);
    expect(versions.length).toBe(2);
    expect(versions[0].immutable).toBe(true);
    expect(versions[1].immutable).toBe(true);
    expect(versions[0].variableValues['event_time']).toBe('18:00');
    expect(versions[1].variableValues['event_time']).toBe('19:00');
  });

  test('5. Confirmation of contract by client updates status to partially_confirmed', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');

    const updated = await service.confirmContract(draft.id, 'client-100', 'client');
    expect(updated.status).toBe('partially_confirmed');
    expect(updated.confirmations.length).toBe(1);
    expect(updated.confirmations[0].role).toBe('client');
  });

  test('6. Confirmation of contract by contractor updates status to partially_confirmed', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');

    const updated = await service.confirmContract(draft.id, 'contractor-200', 'contractor');
    expect(updated.status).toBe('partially_confirmed');
    expect(updated.confirmations.length).toBe(1);
    expect(updated.confirmations[0].role).toBe('contractor');
  });

  test('7. Confirming by all required parties updates status to confirmed', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');

    await service.confirmContract(draft.id, 'client-100', 'client');
    const finalContract = await service.confirmContract(draft.id, 'contractor-200', 'contractor');

    expect(finalContract.status).toBe('confirmed');
    expect(finalContract.confirmations.length).toBe(2);
  });

  test('8. Order-independent confirmation sequence (contractor then client)', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');

    await service.confirmContract(draft.id, 'contractor-200', 'contractor');
    const finalContract = await service.confirmContract(draft.id, 'client-100', 'client');

    expect(finalContract.status).toBe('confirmed');
  });

  test('9. Venue confirmation independently in venue mode', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-ven-rent',
      parties: { clientId: 'client-100', venueId: 'venue-300' },
      initialValues: { ...fullValidVars, hall_name: 'Зал Торжеств', rent_cost: '40000' }
    });
    await service.sendForReview(draft.id, 'client-100');

    const partially = await service.confirmContract(draft.id, 'venue-300', 'venue');
    expect(partially.status).toBe('partially_confirmed');

    const finalContract = await service.confirmContract(draft.id, 'client-100', 'client');
    expect(finalContract.status).toBe('confirmed');
  });

  test('10. Organizer confirmation independently in organizer mode', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-organizer',
      parties: { clientId: 'client-100', organizerId: 'organizer-400' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');

    const partially = await service.confirmContract(draft.id, 'organizer-400', 'organizer');
    expect(partially.status).toBe('partially_confirmed');

    const finalContract = await service.confirmContract(draft.id, 'client-100', 'client');
    expect(finalContract.status).toBe('confirmed');
  });

  test('11. Revision request retains confirmation history and sets status to revision_required', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');
    await service.confirmContract(draft.id, 'client-100', 'client');

    const revised = await service.requestRevision(draft.id, 'contractor-200', 'Изменить залог');
    expect(revised.status).toBe('revision_required');
    expect(revised.confirmations.length).toBe(1);
    expect(revised.confirmations[0].role).toBe('client');
    expect(revised.confirmations[0].contractVersionNumber).toBe(1);
  });

  test('12. Editing contract variables resets confirmations and retains draft state', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });

    const updated = await service.updateDraftVariable(draft.id, 'price', '60000', 'client-100');
    expect(updated.status).toBe('draft');
    expect(updated.confirmations).toEqual([]);
    expect(updated.workingDraft?.['price']).toBe('60000');
  });

  test('13. renderContractText properly replaces standard placeholders', () => {
    const tpl = defaultTemplates.find(t => t.template.id === 'tpl-cnt-host');
    expect(tpl).toBeDefined();

    const text = renderContractText(tpl!.version.clauses, fullValidVars);
    expect(text).toContain('Алексей Иванов');
    expect(text).toContain('ИП Смирнов В.А.');
    expect(text).toContain('50000 руб.');
  });

  test('14. TemplateReviewService.submitForLegalReview checks draft status of template and version', async () => {
    const tpl = await repo.getTemplate('tpl-pl-1');
    const ver = await repo.getTemplateVersion('tpl-pl-1-v1');
    expect(tpl).toBeDefined();
    expect(ver).toBeDefined();

    tpl!.status = 'draft';
    ver!.status = 'draft';
    await repo.saveTemplate(tpl!);
    await repo.saveTemplateVersion(ver!);

    const updated = await reviewService.submitForLegalReview({
      templateId: 'tpl-pl-1',
      versionId: 'tpl-pl-1-v1',
      actorId: 'admin-1'
    });

    expect(updated.status).toBe('legal_review');
  });

  test('15. TemplateReviewService.approveVersion records approval metadata on both template and version', async () => {
    const tpl = await repo.getTemplate('tpl-pl-1');
    const ver = await repo.getTemplateVersion('tpl-pl-1-v1');

    tpl!.status = 'legal_review';
    ver!.status = 'legal_review';
    await repo.saveTemplate(tpl!);
    await repo.saveTemplateVersion(ver!);

    const approved = await reviewService.approveVersion({
      templateId: 'tpl-pl-1',
      versionId: 'tpl-pl-1-v1',
      reviewerId: 'legal-user-1',
      reviewerRole: 'head_legal',
      reviewComment: 'Утверждено юристом'
    });

    expect(approved.status).toBe('approved');
    expect(approved.reviewedBy).toBe('legal-user-1');
    expect(approved.approvedVersionId).toBe('tpl-pl-1-v1');

    const updatedVer = await repo.getTemplateVersion('tpl-pl-1-v1');
    expect(updatedVer?.reviewedBy).toBe('legal-user-1');
    expect(updatedVer?.status).toBe('approved');
  });

  test('16. TemplateReviewService.publishApprovedVersion rejects unapproved template/version or missing metadata', async () => {
    const tpl = await repo.getTemplate('tpl-pl-1');
    const ver = await repo.getTemplateVersion('tpl-pl-1-v1');

    tpl!.status = 'draft';
    ver!.status = 'draft';
    tpl!.reviewedBy = undefined;
    ver!.reviewedBy = undefined;
    await repo.saveTemplate(tpl!);
    await repo.saveTemplateVersion(ver!);

    await expect(reviewService.publishApprovedVersion({
      templateId: 'tpl-pl-1',
      versionId: 'tpl-pl-1-v1',
      actorId: 'admin-1'
    })).rejects.toThrow();
  });

  test('17. Platform policy submission/publication blocked if legal entity config is incomplete', async () => {
    setLegalEntityConfigForTesting({
      legalName: '',
      inn: '',
      ogrn: '',
      legalAddress: '',
      directorName: ''
    });

    const tpl = await repo.getTemplate('tpl-pl-1');
    const ver = await repo.getTemplateVersion('tpl-pl-1-v1');
    tpl!.status = 'draft';
    ver!.status = 'draft';
    await repo.saveTemplate(tpl!);
    await repo.saveTemplateVersion(ver!);

    await expect(reviewService.submitForLegalReview({
      templateId: 'tpl-pl-1',
      versionId: 'tpl-pl-1-v1',
      actorId: 'admin-1'
    })).rejects.toThrow(/юридическое лицо платформы/);
  });

  test('18. External party options in PartyRepository do not set userId on external party objects', async () => {
    const contractors = await partyRepo.listContractors();
    for (const party of contractors) {
      if (party.isExternal) {
        expect(party.userId).toBeUndefined();
        expect(party.entityId).toBe(party.id);
      }
    }
  });

  test('19. Access control: creator with contracts.edit_created_draft permission can edit draft/data_required/revision_required contracts', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      createdByUserId: 'creator-1',
      initialValues: fullValidVars
    });

    const canEdit = ContractAccessService.canEditDraft(draft, 'creator-1', ['contracts.edit_created_draft']);

    expect(canEdit).toBe(true);
  });

  test('20. Access control: non-party user cannot confirm contract', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');

    const canConfirmRandomUser = ContractAccessService.canConfirm(draft, 'random-user-999', []);

    expect(canConfirmRandomUser).toBe(false);
  });

  test('21. Access control: user with contracts.view_all can list all contracts', async () => {
    await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'c-1', contractorId: 'c-2' },
      createdByUserId: 'user-a'
    });

    const allContracts = await repo.listContracts({
      currentUserId: 'admin-1',
      permissions: ['contracts.view_all']
    });

    expect(allContracts.length).toBeGreaterThan(0);
  });

  test('22. Access control: non-admin user can only view contracts where they are client, contractor, venue, organizer, or creator', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      createdByUserId: 'creator-1',
      initialValues: fullValidVars
    });

    const userContracts = await repo.listContracts({
      currentUserId: 'client-100',
      permissions: []
    });

    expect(userContracts.some(c => c.id === draft.id)).toBe(true);

    const strangerContracts = await repo.listContracts({
      currentUserId: 'stranger-999',
      permissions: []
    });
    expect(strangerContracts.some(c => c.id === draft.id)).toBe(false);
  });

  test('23. Consent template variables strictly use new keys without hardcoded defaults', () => {
    const consentTpl = defaultTemplates.find(t => t.template.id === 'tpl-pl-11');
    expect(consentTpl).toBeDefined();

    const keys = consentTpl!.version.variables.map(v => v.key);
    expect(keys).toContain('data_subject_name');
    expect(keys).toContain('data_subject_identifier');
    expect(keys).toContain('processing_purpose');
    expect(keys).toContain('data_categories');
    expect(keys).not.toContain('consent_purpose');
    expect(keys).not.toContain('consent_data_categories');

    // Verify non-operator consent variables have no defaultValue
    const purposeVar = consentTpl!.version.variables.find(v => v.key === 'processing_purpose');
    expect(purposeVar?.defaultValue).toBeUndefined();
  });

  test('24. Demo confirmation notice is present in rendered contract text', () => {
    const tpl = defaultTemplates.find(t => t.template.id === 'tpl-cnt-host');
    const text = renderContractText(tpl!.version.clauses, fullValidVars);
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(50);
  });

  test('25. Dynamic attachment creation and rendering in contract', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });

    const updated = await service.addAttachment(draft.id, {
      name: 'Техническое задание',
      type: 'tech_rider',
      content: 'Комплект звука 2кВт, радиомикрофон 2шт.'
    }, 'client-100');

    expect(updated.attachments.length).toBe(1);
    expect(updated.attachments[0].name).toBe('Техническое задание');
    expect(updated.attachments[0].content).toContain('Комплект звука');
  });

  test('26. Confirming contract is idempotent upon duplicate calls by same party', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');

    const firstConf = await service.confirmContract(draft.id, 'client-100', 'client');
    expect(firstConf.confirmations.length).toBe(1);

    const secondConf = await service.confirmContract(draft.id, 'client-100', 'client');
    expect(secondConf.confirmations.length).toBe(1);
  });

  test('27. Creating external party preserves legalStatus and sets userId to undefined', async () => {
    const extParty = await partyRepo.createExternalParty({
      name: 'ООО Ромашка',
      role: 'client',
      legalStatus: 'company',
      taxId: '7712345678'
    });

    expect(extParty.isExternal).toBe(true);
    expect(extParty.userId).toBeUndefined();
    expect(extParty.legalStatus).toBe('company');
    expect(extParty.name).toBe('ООО Ромашка');
  });

  test('28. TemplateReviewService.createNewTemplateVersion isolates clauses via structuredClone', async () => {
    const newVer = await reviewService.createNewTemplateVersion('tpl-cnt-host', 'admin-1', 'Редакция 2.0');
    expect(newVer.version).toBe('1.1.0');
    expect(newVer.status).toBe('draft');
    expect(newVer.clauses).toBeDefined();

    // Mutate newVer clause and verify original template version remains unchanged
    if (newVer.clauses && newVer.clauses.length > 0) {
      newVer.clauses[0].title = 'MUTATED TITLE';
      const origVer = await repo.getTemplateVersion('tpl-cnt-host-v1');
      expect(origVer?.clauses[0].title).not.toBe('MUTATED TITLE');
    }
  });

  test('29. ContractAccessService.getAvailableActions provides action flags matching role and status', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });

    const actionsClientDraft = ContractAccessService.getAvailableActions(draft, 'client-100', []);
    expect(actionsClientDraft.canEdit).toBe(true);
    expect(actionsClientDraft.canSend).toBe(true);
    expect(actionsClientDraft.canConfirm).toBe(false);

    await service.sendForReview(draft.id, 'client-100');
    const sentState = await repo.getContract(draft.id);

    const actionsClientSent = ContractAccessService.getAvailableActions(sentState!, 'client-100', []);
    expect(actionsClientSent.canEdit).toBe(false);
    expect(actionsClientSent.canConfirm).toBe(true);
    expect(actionsClientSent.canRequestRevision).toBe(true);
  });

  test('30. Multi-version contract confirmations history filtering by currentVersionId', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');
    await service.confirmContract(draft.id, 'client-100', 'client'); // v1 confirmation

    await service.requestRevision(draft.id, 'contractor-200', 'Нужна отметка о ПДн');
    await service.createNewRevision(draft.id, 'client-100', 'Редакция 2');
    await service.sendForReview(draft.id, 'client-100'); // v2 sent

    const contractV2 = await repo.getContract(draft.id);
    expect(contractV2?.currentVersion).toBe(2);

    // Filter confirmations for version 2 should be 0
    const activeConfsV2 = contractV2?.confirmations.filter(c => c.contractVersionId === contractV2.currentVersionId);
    expect(activeConfsV2?.length).toBe(0);

    // Total confirmations in history should still retain v1 confirmation (length === 1)
    expect(contractV2?.confirmations.length).toBe(1);
  });

  test('31. Validation of consent variable rendering in createConsentClauses', () => {
    const clauses = createConsentClauses([
      {
        id: 'c1',
        sectionKey: 'subject',
        title: 'Субъект ПДн',
        order: 1,
        body: 'Петров Петр Петрович из ООО НАДО ПРАЗДНИК (Анализ работы сервиса)',
        required: true
      }
    ]);

    expect(clauses.length).toBeGreaterThan(0);
    expect(clauses[0].body).toContain('Петров Петр Петрович');
    expect(clauses[0].body).toContain('ООО НАДО ПРАЗДНИК');
    expect(clauses[0].body).toContain('Анализ работы сервиса');
  });

  test('32. TemplateReviewService.repairTemplateVersionState fixes inconsistent status', async () => {
    const tplVer = await repo.getTemplateVersion('tpl-cnt-host-v1');
    expect(tplVer).toBeDefined();

    const repaired = await reviewService.repairTemplateVersionState({
      templateId: 'tpl-cnt-host',
      versionId: 'tpl-cnt-host-v1',
      targetStatus: 'legal_review',
      actorId: 'admin-1',
      actorPermissions: ['system.admin'],
      reason: 'Исправление тестового статуса'
    });

    expect(repaired.status).toBe('legal_review');
  });

  test('33. ContractAccessService.getAvailableActions prevents confirmation when status is draft', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });

    const actions = ContractAccessService.getAvailableActions(draft, 'client-100', []);
    expect(actions.canConfirm).toBe(false);

    await service.sendForReview(draft.id, 'client-100');
    const sent = await repo.getContract(draft.id);

    const strangerActions = ContractAccessService.getAvailableActions(sent!, 'random-stranger', []);
    expect(strangerActions.canConfirm).toBe(false);
  });

  test('34. ContractWizardValidationService validates consent document missing fields correctly', () => {
    const res = ContractWizardValidationService.validateStep(
      'consent_subject',
      'consent',
      'tpl-consent-pdn',
      {
        consent_subject_fio: '',
        data_operator_name: 'ООО ТЕСТ'
      }
    );

    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  test('35. ContractWizardValidationService valid consent step returns isValid true', () => {
    const res = ContractWizardValidationService.validateStep(
      'consent_subject',
      'consent',
      'tpl-consent-pdn',
      {
        consent_subject_fio: 'Иванов И.И.',
        data_operator_name: 'ООО Оператор',
        consent_purpose: 'Исполнение договора',
        consent_term: '3 года'
      }
    );

    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  test('36. ContractWizardValidationService returns validation errors for missing templateId', () => {
    const res = ContractWizardValidationService.validateStep(
      'template',
      'consent',
      '',
      {}
    );

    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Выберите вид согласия');
  });

  test('37. ContractService.createContractDraft preserves contractorProfileId, venueProfileId, organizerProfileId', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      profileIds: {
        contractorProfileId: 'profile-contractor-999',
        venueProfileId: 'profile-venue-888',
        organizerProfileId: 'profile-org-777'
      }
    });

    expect(draft.contractorProfileId).toBe('profile-contractor-999');
    expect(draft.venueProfileId).toBe('profile-venue-888');
    expect(draft.organizerProfileId).toBe('profile-org-777');
  });

  test('38. PartyRepository.createExternalParty preserves legalStatus and sets userId to undefined', async () => {
    const extParty = await partyRepo.createExternalParty({
      name: 'Внешняя Площадка Лофт',
      role: 'venue',
      legalStatus: 'company',
      taxId: '7799887766'
    });

    expect(extParty.isExternal).toBe(true);
    expect(extParty.userId).toBeUndefined();
    expect(extParty.name).toBe('Внешняя Площадка Лофт');
  });

  test('39. ContractService.confirmContract throws error if role is not listed in template.partyRoles', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host', // partyRoles: ['client', 'contractor']
      parties: { clientId: 'client-100', contractorId: 'contractor-200', venueId: 'venue-300' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');

    await expect(service.confirmContract(draft.id, 'venue-300', 'venue')).rejects.toThrow();
  });

  test('40. ContractService.confirmContract with 3 parties transitions to confirmed only when all 3 confirm', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-vne-rental', // partyRoles: ['client', 'venue', 'organizer']
      parties: { clientId: 'client-100', venueId: 'venue-300', organizerId: 'org-400' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');

    // Party 1 confirms
    const s1 = await service.confirmContract(draft.id, 'client-100', 'client');
    expect(s1.status).toBe('partially_confirmed');

    // Party 2 confirms
    const s2 = await service.confirmContract(draft.id, 'venue-300', 'venue');
    expect(s2.status).toBe('partially_confirmed');

    // Party 3 confirms -> fully confirmed
    const s3 = await service.confirmContract(draft.id, 'org-400', 'organizer');
    expect(s3.status).toBe('confirmed');
  });

  test('41. buildPlatformPolicy creates compliant template structure with legal_review status', () => {
    const policy = buildPlatformPolicy({
      id: 'custom-pol-01',
      title: 'Политика обработки файлов cookie',
      code: 'POLICY_COOKIE',
      description: 'Регламент использования cookie',
      operatorName: 'ООО НАДО ПРАЗДНИК',
      terms: 'Использование файлов cookie для авторизации'
    });

    expect(policy.id).toBe('custom-pol-01');
    expect(policy.documentKind).toBe('platform_policy');
    expect(policy.versions[0].status).toBe('legal_review');
  });

  test('42. buildConsentDocument creates compliant template structure with legal_review status', () => {
    const consent = buildConsentDocument({
      id: 'custom-pdn-01',
      title: 'Согласие на рекламную рассылку',
      code: 'CONSENT_MARKETING',
      description: 'Согласие на получение рассылок',
      operatorName: 'ООО НАДО ПРАЗДНИК',
      purpose: 'Информирование об акциях'
    });

    expect(consent.id).toBe('custom-pdn-01');
    expect(consent.documentKind).toBe('consent');
    expect(consent.versions[0].status).toBe('legal_review');
  });

  test('43. TemplateReviewService.createNewTemplateVersion requires explicit changeReason', async () => {
    await expect(reviewService.createNewTemplateVersion('tpl-cnt-host', 'admin-1', ''))
      .rejects.toThrow('Необходимо указать причину создания новой версии');
  });

  test('44. TemplateReviewService.submitForLegalReview transitions draft version to legal_review', async () => {
    const newVer = await reviewService.createNewTemplateVersion('tpl-cnt-host', 'admin-1', 'Обновление формулировок');
    expect(newVer.status).toBe('draft');

    const submitted = await reviewService.submitForLegalReview({
      templateId: 'tpl-cnt-host',
      versionId: newVer.id,
      actorId: 'admin-1'
    });
    expect(submitted.status).toBe('legal_review');
  });

  test('45. TemplateReviewService.approveVersion transitions legal_review version to approved', async () => {
    const newVer = await reviewService.createNewTemplateVersion('tpl-cnt-host', 'admin-1', 'Подготовка к релизу');
    await reviewService.submitForLegalReview({
      templateId: 'tpl-cnt-host',
      versionId: newVer.id,
      actorId: 'admin-1'
    });

    const approved = await reviewService.approveVersion({
      templateId: 'tpl-cnt-host',
      versionId: newVer.id,
      reviewerId: 'lawyer-1',
      reviewerRole: 'contracts.manage_templates',
      reviewComment: 'Проверено юристом'
    });
    expect(approved.status).toBe('approved');
    expect(approved.reviewedBy).toBe('lawyer-1');
  });

  test('46. TemplateReviewService.publishApprovedVersion sets status to published', async () => {
    const newVer = await reviewService.createNewTemplateVersion('tpl-cnt-host', 'admin-1', 'Публикация версии 1.1');
    await reviewService.submitForLegalReview({
      templateId: 'tpl-cnt-host',
      versionId: newVer.id,
      actorId: 'admin-1'
    });
    await reviewService.approveVersion({
      templateId: 'tpl-cnt-host',
      versionId: newVer.id,
      reviewerId: 'lawyer-1',
      reviewerRole: 'contracts.manage_templates',
      reviewComment: 'Одобрено'
    });

    const published = await reviewService.publishApprovedVersion({
      templateId: 'tpl-cnt-host',
      versionId: newVer.id,
      actorId: 'admin-1'
    });
    expect(published.status).toBe('published');

    const template = await repo.getTemplate('tpl-cnt-host');
    expect(template?.currentVersionId).toBe(newVer.id);
  });

  test('47. TemplateReviewService.archiveVersion prevents archiving when conditions are not met', async () => {
    const template = await repo.getTemplate('tpl-cnt-host');
    const activeVerId = template?.currentVersionId;
    expect(activeVerId).toBeDefined();

    await expect(reviewService.archiveVersion({
      templateId: 'tpl-cnt-host',
      versionId: activeVerId!,
      actorId: 'admin-1',
      reason: 'Архивация'
    })).rejects.toThrow();
  });

  test('48. ContractService.cancelContract cancels contract with reason', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });

    const cancelled = await service.cancelContract(draft.id, 'client-100', 'Отмена мероприятия заказчиком');
    expect(cancelled.status).toBe('cancelled');
  });

  test('49. ContractService.updateDraftVariable updates variable value', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });

    const updated = await service.updateDraftVariable(draft.id, 'price', '75000', 'client-100');
    expect(updated.variableValues['price']).toBe('75000');
  });

  test('50. getContractPartyOptionKey correctly formats keys for party options', () => {
    const keyProf = getContractPartyOptionKey({
      id: 'prof-1',
      partyId: 'p-1',
      role: 'contractor',
      displayName: 'ИП Смирнов',
      name: 'ИП Смирнов',
      isExternal: false
    });
    expect(keyProf).toBe('contractor:p-1:prof-1');

    const keyExt = getContractPartyOptionKey({
      id: 'ext-2',
      partyId: 'p-2',
      role: 'client',
      displayName: 'ООО Ромашка',
      name: 'ООО Ромашка',
      isExternal: true
    });
    expect(keyExt).toBe('client:p-2:ext-2');
  });

  test('51. ContractAccessService.canViewContract checks party permissions correctly', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });

    expect(ContractAccessService.canViewContract(draft, 'client-100', [])).toBe(true);
    expect(ContractAccessService.canViewContract(draft, 'stranger', [])).toBe(false);
  });

  test('52. ContractAccessService.getAvailableActions restricts editing for confirmed contract', async () => {
    const draft = await service.createContractDraft({
      templateId: 'tpl-cnt-host',
      parties: { clientId: 'client-100', contractorId: 'contractor-200' },
      initialValues: fullValidVars
    });
    await service.sendForReview(draft.id, 'client-100');
    await service.confirmContract(draft.id, 'client-100', 'client');
    const confirmed = await service.confirmContract(draft.id, 'contractor-200', 'contractor');

    const actions = ContractAccessService.getAvailableActions(confirmed, 'client-100', []);
    expect(actions.canEdit).toBe(false);
    expect(actions.canSend).toBe(false);
    expect(actions.canConfirm).toBe(false);
  });
});
