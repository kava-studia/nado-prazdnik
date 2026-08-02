import { ContractRepository } from '../repositories/ContractRepository';
import { 
  GeneratedContract, 
  ContractTemplate, 
  ContractTemplateVersion, 
  GeneratedContractVersion, 
  ContractAttachment, 
  ContractConfirmation, 
  VersionDiffItem, 
  ContractValidationResult,
  ContractStatus,
  ContractDocumentKind
} from '../types';
import { generateUUID } from '../utils/uuid';
import { ContractStateMachine } from './ContractStateMachine';
import { ContractWizardValidationService } from './ContractWizardValidationService';
import { ContractAccessService } from './ContractAccessService';

export interface ContractActorContext {
  userId: string;
  permissions?: string[];
}

function parseActor(actor?: string | ContractActorContext, defaultPermissions?: string[]): ContractActorContext {
  if (!actor) return { userId: '', permissions: defaultPermissions || [] };
  if (typeof actor === 'string') return { userId: actor, permissions: defaultPermissions || [] };
  return { userId: actor.userId, permissions: actor.permissions || defaultPermissions || [] };
}

export interface CreateContractDraftParams {
  templateId: string;
  documentKind?: ContractDocumentKind;
  parties?: {
    clientId?: string;
    contractorId?: string;
    venueId?: string;
    organizerId?: string;
  };
  profileIds?: {
    contractorProfileId?: string;
    venueProfileId?: string;
    organizerProfileId?: string;
  };
  initialValues?: Record<string, string>;
  eventId?: string;
  orderId?: string;
  proposalId?: string;
  createdByUserId?: string;
  demo?: boolean;
}

export class ContractService {
  constructor(private repo: ContractRepository) {}

  async listTemplates(category?: string): Promise<ContractTemplate[]> {
    const list = await this.repo.listTemplates();
    if (category) {
      return list.filter(t => t.category === category || (t.subcategory && t.subcategory === category));
    }
    return list;
  }

  async getTemplate(id: string): Promise<ContractTemplate | null> {
    return this.repo.getTemplate(id);
  }

  async getTemplateVersion(id: string): Promise<ContractTemplateVersion | null> {
    return this.repo.getTemplateVersion(id);
  }

  async createContractDraft(
    paramsOrTemplateId: string | CreateContractDraftParams,
    clientIdPositional?: string,
    contractorIdPositional?: string,
    initialValuesPositional: Record<string, string> = {},
    optionsPositional?: {
      eventId?: string;
      orderId?: string;
      proposalId?: string;
      venueId?: string;
      organizerId?: string;
      createdByUserId?: string;
      demo?: boolean;
    }
  ): Promise<GeneratedContract> {
    let params: CreateContractDraftParams;

    if (typeof paramsOrTemplateId === 'string') {
      params = {
        templateId: paramsOrTemplateId,
        parties: {
          clientId: clientIdPositional,
          contractorId: contractorIdPositional,
          venueId: optionsPositional?.venueId,
          organizerId: optionsPositional?.organizerId
        },
        initialValues: initialValuesPositional,
        eventId: optionsPositional?.eventId,
        orderId: optionsPositional?.orderId,
        proposalId: optionsPositional?.proposalId,
        createdByUserId: optionsPositional?.createdByUserId,
        demo: optionsPositional?.demo
      };
    } else {
      params = paramsOrTemplateId;
    }

    const template = await this.repo.getTemplate(params.templateId);
    if (!template) {
      throw new Error(`Шаблон договора с ID ${params.templateId} не найден`);
    }

    const tplVersion = await this.repo.getTemplateVersion(template.currentVersionId);
    if (!tplVersion) {
      throw new Error(`Версия шаблона ${template.currentVersionId} не найдена`);
    }

    const id = generateUUID();
    const docKind = params.documentKind || template.documentKind || 'service_contract';

    const variableValues: Record<string, string> = {};
    if (tplVersion.variables) {
      for (const v of tplVersion.variables) {
        if (v.defaultValue) variableValues[v.key] = v.defaultValue;
      }
    }
    if (params.initialValues) {
      Object.assign(variableValues, params.initialValues);
    }

    const clientName = variableValues['client_name'] || 'Заказчик';
    const contractorName = variableValues['contractor_name'] || 'Исполнитель';
    const venueName = variableValues['venue_name'] || 'Площадка';
    const organizerName = variableValues['organizer_name'] || 'Организатор';

    const p = params.parties || {};
    const prof = params.profileIds || {};

    const contract: GeneratedContract = {
      id,
      templateId: params.templateId,
      templateName: template.name,
      templateVersionId: tplVersion.id,
      documentKind: docKind,
      category: template.category,
      templateSubcategory: template.subcategory,
      serviceCategory: template.category === 'contractor' ? (template.subcategory || 'services') : undefined,
      partyRoles: template.partyRoles ? [...template.partyRoles] : [],
      eventId: params.eventId,
      orderId: params.orderId,
      proposalId: params.proposalId,
      clientId: p.clientId || '',
      clientName,
      contractorId: docKind === 'venue_contract' || docKind === 'platform_policy' || docKind === 'consent' ? (p.contractorId || '') : (p.contractorId || ''),
      contractorName,
      venueId: p.venueId,
      venueName: p.venueId ? venueName : undefined,
      organizerId: p.organizerId,
      organizerName: p.organizerId ? organizerName : undefined,
      contractorProfileId: prof.contractorProfileId,
      venueProfileId: prof.venueProfileId,
      organizerProfileId: prof.organizerProfileId,
      createdByUserId: params.createdByUserId || p.clientId || 'system',
      status: 'draft',
      currentVersion: 1,
      currentVersionId: undefined,
      variableValues,
      workingDraft: { ...variableValues },
      fullText: '',
      attachments: [],
      confirmations: [],
      demo: params.demo ?? false,
      auditLog: [
        {
          id: generateUUID(),
          contractId: id,
          actorId: params.createdByUserId || p.clientId || 'system',
          actorRole: 'creator',
          action: 'CREATE_DRAFT',
          timestamp: new Date().toISOString(),
          details: 'Создан черновик договора v1'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contract.fullText = this.generatePreview(contract, tplVersion);

    await this.repo.saveContract(contract);
    return contract;
  }

  async updateDraftVariable(
    contractId: string, 
    key: string, 
    value: string, 
    actor?: string | ContractActorContext,
    permissions?: string[]
  ): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract) throw new Error('Договор не найден');

    const ctx = parseActor(actor, permissions);
    if (ctx.userId && !ContractAccessService.canEditDraft(contract, ctx.userId, ctx.permissions)) {
      throw new Error('Нет прав для редактирования черновика');
    }

    if (contract.status !== 'draft' && contract.status !== 'data_required' && contract.status !== 'revision_required') {
      throw new Error('Зафиксированная версия договора недоступна для редактирования. Создайте новую редакцию или отправьте договор на доработку.');
    }

    contract.variableValues[key] = value;
    if (!contract.workingDraft) contract.workingDraft = {};
    contract.workingDraft[key] = value;

    if (key === 'client_name') contract.clientName = value;
    if (key === 'contractor_name') contract.contractorName = value;
    if (key === 'venue_name') contract.venueName = value;
    if (key === 'organizer_name') contract.organizerName = value;

    contract.updatedAt = new Date().toISOString();

    const tplVersion = contract.templateVersionId 
      ? await this.repo.getTemplateVersion(contract.templateVersionId)
      : null;

    contract.fullText = this.generatePreview(contract, tplVersion || undefined);

    contract.auditLog.push({
      id: generateUUID(),
      contractId: contract.id,
      actorId: ctx.userId || 'system',
      actorRole: 'user',
      action: 'UPDATE_VARIABLE',
      timestamp: new Date().toISOString(),
      details: `Изменено поле: ${key}`
    });

    await this.repo.saveContract(contract);
    return contract;
  }

  validateContract(contract: GeneratedContract, tplVersion?: ContractTemplateVersion): ContractValidationResult {
    const result = ContractWizardValidationService.validateFullContract(
      contract.variableValues || {},
      tplVersion,
      contract.documentKind
    );

    if (contract.templateId === 'tpl-ven-mixed' || contract.templateId?.includes('mixed')) {
      const priceNum = Number(contract.variableValues['price'] || 0);
      const rent = Number(contract.variableValues['rent_cost'] || 0);
      const catering = Number(contract.variableValues['catering_cost'] || 0);
      const tech = Number(contract.variableValues['tech_cost'] || 0);
      if (rent + catering + tech !== priceNum) {
        result.isValid = false;
        result.missingFields.push({
          key: 'price',
          label: `Сумма раздельных услуг (${rent + catering + tech}) не совпадает с итоговой стоимостью (${priceNum})`,
          step: 7
        });
      }
    }

    return result;
  }

  getMissingFields(contract: GeneratedContract, tplVersion?: ContractTemplateVersion) {
    return this.validateContract(contract, tplVersion).missingFields;
  }

  generatePreview(contract: GeneratedContract, tplVersion?: ContractTemplateVersion): string {
    const vals = contract.variableValues || {};

    if (tplVersion && tplVersion.clauses && tplVersion.clauses.length > 0) {
      let bodyText = `ДОГОВОР: ${tplVersion.title || contract.templateName}\nРедакция №${contract.currentVersion}\n\n`;
      if (tplVersion.introduction) {
        bodyText += `[ПРИМЕЧАНИЕ]: ${tplVersion.introduction}\n\n`;
      }

      const clausesSorted = [...tplVersion.clauses].sort((a, b) => a.order - b.order);
      for (const cl of clausesSorted) {
        let clauseBody = cl.body;
        for (const [k, v] of Object.entries(vals)) {
          const displayVal = v && v.trim() !== '' ? v : 'Условие не определено';
          clauseBody = clauseBody.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), displayVal);
        }
        clauseBody = clauseBody.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, 'Условие не определено');

        bodyText += `${cl.order}. ${cl.title}\n${clauseBody}\n\n`;
      }
      return bodyText;
    }

    return `ДОГОВОР №${contract.id}\nЗаказчик: ${vals['client_name'] || 'Условие не определено'}\nИсполнитель: ${vals['contractor_name'] || 'Условие не определено'}\nДата проведения: ${vals['event_date'] || 'Условие не определено'}\nСтоимость: ${vals['price'] || '0'} руб.`;
  }

  async sendForReview(
    contractId: string, 
    actor: string | ContractActorContext, 
    permissions?: string[]
  ): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract) throw new Error('Договор не найден');

    const ctx = parseActor(actor, permissions);
    if (ctx.userId && !ContractAccessService.canSendForReview(contract, ctx.userId, ctx.permissions)) {
      throw new Error('Нет прав отправки на согласование');
    }

    const actorId = ctx.userId || 'system';

    const tplVersion = contract.templateVersionId 
      ? await this.repo.getTemplateVersion(contract.templateVersionId)
      : null;

    const validation = this.validateContract(contract, tplVersion || undefined);
    if (!validation.isValid) {
      throw new Error(`Не заполнены обязательные поля: ${validation.missingFields.map(m => m.label).join('; ')}`);
    }

    if (contract.status === 'draft' || contract.status === 'data_required') {
      ContractStateMachine.validateTransition(contract.status, 'ready_for_review');
      contract.status = 'ready_for_review';
    }

    ContractStateMachine.validateTransition(contract.status, 'sent');

    if (contract.workingDraft) {
      contract.variableValues = { ...contract.workingDraft };
    }
    contract.fullText = this.generatePreview(contract, tplVersion || undefined);

    const versionId = generateUUID();
    const now = new Date().toISOString();

    const snapshotVersion: GeneratedContractVersion = {
      id: versionId,
      contractId,
      templateVersionId: contract.templateVersionId,
      version: contract.currentVersion,
      variableValues: { ...contract.variableValues },
      fullText: contract.fullText,
      createdAt: now,
      createdBy: actorId,
      changeReason: contract.currentVersion === 1 ? 'Первоначальная зафиксированная редакция' : 'Направление на согласование',
      immutable: true
    };

    contract.currentVersionId = versionId;
    contract.status = 'sent';
    contract.updatedAt = now;

    contract.auditLog.push({
      id: generateUUID(),
      contractId,
      actorId,
      actorRole: 'user',
      action: 'SEND_FOR_REVIEW',
      timestamp: now,
      details: `Редакция №${contract.currentVersion} направлена на согласование`
    });

    await this.repo.saveContractVersion(snapshotVersion);
    await this.repo.saveContract(contract);
    return contract;
  }

  async confirmContractParty(
    contractId: string,
    contractVersionId: string,
    partyId: string,
    partyRole: 'client' | 'contractor' | 'venue' | 'organizer',
    note?: string
  ): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract) throw new Error('Договор не найден');

    const template = await this.repo.getTemplate(contract.templateId);
    const validRoles = (template?.partyRoles || []).filter(r => r !== 'platform' && r !== 'user') as ('client' | 'contractor' | 'venue' | 'organizer')[];

    if (validRoles.length > 0 && !validRoles.includes(partyRole)) {
      throw new Error('Эта роль не является стороной данного договора');
    }

    let expectedPartyId: string | undefined;
    if (partyRole === 'client') expectedPartyId = contract.clientId;
    else if (partyRole === 'contractor') expectedPartyId = contract.contractorId;
    else if (partyRole === 'venue') expectedPartyId = contract.venueId;
    else if (partyRole === 'organizer') expectedPartyId = contract.organizerId;

    if (!expectedPartyId) {
      throw new Error(`Участник с ролью ${partyRole} не назначен в договоре`);
    }

    if (expectedPartyId !== partyId) {
      throw new Error(`Пользователь ${partyId} не является ${partyRole} по данному договору`);
    }

    if (!contractVersionId || contractVersionId !== contract.currentVersionId) {
      throw new Error('Подтверждение допускается только для текущей зафиксированной редакции договора');
    }

    const versionSnapshot = await this.repo.getContractVersion(contractVersionId);
    if (!versionSnapshot) {
      throw new Error('Фиксированный снимок версии договора не найден');
    }

    if (['draft', 'data_required', 'ready_for_review', 'cancelled', 'completed', 'superseded'].includes(contract.status)) {
      throw new Error('Текущий статус договора не допускает подтверждения');
    }

    const existing = (contract.confirmations || []).find(
      c => c.contractVersionId === contractVersionId && c.partyId === partyId && c.role === partyRole
    );
    if (existing) {
      return contract;
    }

    let requiredRoles: ('client' | 'contractor' | 'organizer' | 'platform' | 'venue')[] = validRoles.length > 0 ? validRoles : ['client'];

    const currentConfirmedRoles = new Set(
      (contract.confirmations || [])
        .filter(c => c.contractVersionId === contractVersionId)
        .map(c => c.role)
    );
    currentConfirmedRoles.add(partyRole);

    const allRequiredConfirmed = requiredRoles.every(r => currentConfirmedRoles.has(r));

    let currentStatus: ContractStatus = contract.status;

    if (currentStatus === 'sent') {
      ContractStateMachine.validateTransition('sent', 'partially_confirmed');
      currentStatus = 'partially_confirmed';
    }

    if (allRequiredConfirmed) {
      ContractStateMachine.validateTransition(currentStatus, 'confirmed');
      currentStatus = 'confirmed';
    }

    const now = new Date().toISOString();
    const conf: ContractConfirmation = {
      id: generateUUID(),
      contractId,
      contractVersionId,
      contractVersionNumber: contract.currentVersion,
      partyId,
      role: partyRole,
      confirmedAt: now,
      note: note || `Подтверждено (${partyRole})`,
      method: 'demo_click',
      isDemo: contract.demo
    };

    await this.repo.saveConfirmation(conf);
    const updatedContract = await this.repo.getContract(contractId);
    if (updatedContract) {
      updatedContract.status = currentStatus;
      updatedContract.updatedAt = now;
      updatedContract.auditLog.push({
        id: generateUUID(),
        contractId,
        actorId: partyId,
        actorRole: partyRole,
        action: `CONFIRM_${partyRole.toUpperCase()}`,
        timestamp: now,
        details: `Редакция №${contract.currentVersion} подтверждена (${partyRole})`
      });
      await this.repo.saveContract(updatedContract);
      return updatedContract;
    }

    contract.status = currentStatus;
    contract.updatedAt = now;
    if (!contract.confirmations) contract.confirmations = [];
    contract.confirmations.push(conf);
    contract.auditLog.push({
      id: generateUUID(),
      contractId,
      actorId: partyId,
      actorRole: partyRole,
      action: `CONFIRM_${partyRole.toUpperCase()}`,
      timestamp: now,
      details: `Редакция №${contract.currentVersion} подтверждена (${partyRole})`
    });

    await this.repo.saveContract(contract);
    return contract;
  }

  async confirmByClient(contractId: string, clientId: string, note?: string): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract || !contract.currentVersionId) throw new Error('Договор или зафиксированная версия не найдена');
    return this.confirmContractParty(contractId, contract.currentVersionId, clientId, 'client', note);
  }

  async confirmByContractor(contractId: string, contractorId: string, note?: string): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract || !contract.currentVersionId) throw new Error('Договор или зафиксированная версия не найдена');
    return this.confirmContractParty(contractId, contract.currentVersionId, contractorId, 'contractor', note);
  }

  async confirmByVenue(contractId: string, venueId: string, note?: string): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract || !contract.currentVersionId) throw new Error('Договор или зафиксированная версия не найдена');
    return this.confirmContractParty(contractId, contract.currentVersionId, venueId, 'venue', note);
  }

  async confirmByOrganizer(contractId: string, organizerId: string, note?: string): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract || !contract.currentVersionId) throw new Error('Договор или зафиксированная версия не найдена');
    return this.confirmContractParty(contractId, contract.currentVersionId, organizerId, 'organizer', note);
  }

  async confirmContract(
    contractId: string,
    partyId: string,
    role: 'client' | 'contractor' | 'venue' | 'organizer',
    note?: string
  ): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract || !contract.currentVersionId) throw new Error('Договор или зафиксированная версия не найдена');
    return this.confirmContractParty(contractId, contract.currentVersionId, partyId, role, note);
  }

  async createNewRevision(
    contractId: string,
    author: string | ContractActorContext,
    changeReason: string,
    newValues: Record<string, string> = {},
    permissions?: string[]
  ): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract) throw new Error('Договор не найден');

    const ctx = parseActor(author, permissions);
    if (ctx.userId && !ContractAccessService.canCreateNewVersion(contract, ctx.userId) && !ContractAccessService.canEditDraft(contract, ctx.userId, ctx.permissions)) {
      throw new Error('Нет прав создавать новую редакцию');
    }

    if (!changeReason || !changeReason.trim()) {
      throw new Error('Укажите причину создания новой редакции');
    }

    if (['sent', 'partially_confirmed'].includes(contract.status)) {
      throw new Error('Для перехода в новую редакцию сначала необходимо запросить доработку договора');
    }

    if (contract.status === 'confirmed') {
      ContractStateMachine.validateTransition(contract.status, 'revision_required');
      contract.status = 'revision_required';
    }

    ContractStateMachine.validateTransition(contract.status, 'draft');

    const nextVersionNum = contract.currentVersion + 1;
    contract.currentVersion = nextVersionNum;
    contract.status = 'draft';
    contract.currentVersionId = undefined;
    contract.variableValues = { ...contract.variableValues, ...newValues };
    contract.workingDraft = { ...contract.variableValues };
    contract.updatedAt = new Date().toISOString();

    const tplVersion = contract.templateVersionId 
      ? await this.repo.getTemplateVersion(contract.templateVersionId)
      : null;

    contract.fullText = this.generatePreview(contract, tplVersion || undefined);

    contract.auditLog.push({
      id: generateUUID(),
      contractId,
      actorId: ctx.userId || 'user',
      actorRole: 'user',
      action: 'CREATE_NEW_REVISION',
      timestamp: new Date().toISOString(),
      details: `Создана новая редакция №${nextVersionNum}. Причина: ${changeReason}`
    });

    await this.repo.saveContract(contract);
    return contract;
  }

  async createVersion(
    contractId: string,
    author: string | ContractActorContext,
    changeReason: string,
    newValues: Record<string, string> = {},
    permissions?: string[]
  ): Promise<GeneratedContract> {
    return this.createNewRevision(contractId, author, changeReason, newValues, permissions);
  }

  async requestRevision(
    contractId: string,
    actor: string | ContractActorContext,
    reason: string,
    permissions?: string[]
  ): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract) throw new Error('Договор не найден');

    const ctx = parseActor(actor, permissions);
    if (!ContractAccessService.canRequestRevision(contract, ctx.userId, ctx.permissions)) {
      throw new Error('Запросить доработку может только участник договора');
    }

    const isClient = contract.clientId === ctx.userId;
    const isContractor = contract.contractorId === ctx.userId;
    const isVenue = contract.venueId === ctx.userId;
    const isOrganizer = contract.organizerId === ctx.userId;

    ContractStateMachine.validateTransition(contract.status, 'revision_required');
    contract.status = 'revision_required';
    contract.updatedAt = new Date().toISOString();

    contract.auditLog.push({
      id: generateUUID(),
      contractId,
      actorId: ctx.userId,
      actorRole: isClient ? 'client' : isContractor ? 'contractor' : isVenue ? 'venue' : isOrganizer ? 'organizer' : 'user',
      action: 'REQUEST_REVISION',
      timestamp: new Date().toISOString(),
      details: `Запрошена доработка договора. Зафиксированная редакция №${contract.currentVersion}. Причина: ${reason}`
    });

    await this.repo.saveContract(contract);
    return contract;
  }

  async addAttachment(
    contractId: string,
    titleOrObj: string | { name: string; type: string; content: string },
    categoryOrActorId?: string | ContractActorContext,
    contentArg?: string,
    actorCtx?: string | ContractActorContext
  ): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract) throw new Error('Договор не найден');

    const ctx = parseActor(actorCtx || (typeof categoryOrActorId === 'object' ? categoryOrActorId : undefined));
    if (ctx.userId && !ContractAccessService.canManageAttachments(contract, ctx.userId, ctx.permissions)) {
      throw new Error('Изменение приложений заблокировано или недоступно');
    }

    if (['sent', 'partially_confirmed', 'confirmed', 'superseded', 'cancelled', 'completed'].includes(contract.status)) {
      throw new Error('Нельзя изменять приложения у зафиксированного договора');
    }

    let name = '';
    let type = '';
    let content = '';

    if (typeof titleOrObj === 'object') {
      name = titleOrObj.name;
      type = titleOrObj.type;
      content = titleOrObj.content;
    } else {
      name = titleOrObj;
      type = (typeof categoryOrActorId === 'string' ? categoryOrActorId : undefined) || 'general';
      content = contentArg || '';
    }

    const att: ContractAttachment = {
      id: generateUUID(),
      contractId,
      name,
      type,
      content,
      createdAt: new Date().toISOString()
    };

    if (!contract.attachments) contract.attachments = [];
    contract.attachments.push(att);

    await this.repo.saveAttachment(att);
    await this.repo.saveContract(contract);
    return contract;
  }

  async removeAttachment(
    contractId: string, 
    attachmentId: string,
    actor?: string | ContractActorContext,
    permissions?: string[]
  ): Promise<void> {
    const contract = await this.repo.getContract(contractId);
    if (!contract) throw new Error('Договор не найден');

    const ctx = parseActor(actor, permissions);
    if (ctx.userId && !ContractAccessService.canManageAttachments(contract, ctx.userId, ctx.permissions)) {
      throw new Error('Изменение приложений заблокировано или недоступно');
    }

    if (['sent', 'partially_confirmed', 'confirmed', 'superseded', 'cancelled', 'completed'].includes(contract.status)) {
      throw new Error('Нельзя изменять приложения у зафиксированного договора');
    }

    contract.attachments = (contract.attachments || []).filter(a => a.id !== attachmentId);
    await this.repo.removeAttachment(attachmentId);
    await this.repo.saveContract(contract);
  }

  async compareVersions(contractId: string, versionNumA: number, versionNumB: number): Promise<VersionDiffItem[]> {
    const versions = await this.repo.listContractVersions(contractId);
    const verA = versions.find(v => v.version === versionNumA);
    const verB = versions.find(v => v.version === versionNumB);

    if (!verA || !verB) return [];

    const contract = await this.repo.getContract(contractId);
    const tplVersion = contract?.templateVersionId 
      ? await this.repo.getTemplateVersion(contract.templateVersionId)
      : null;

    const labelMap: Record<string, string> = {
      client_name: 'Заказчик',
      contractor_name: 'Исполнитель',
      event_date: 'Дата проведения',
      event_time: 'Время начала',
      event_location: 'Адрес площадки',
      price: 'Итоговая стоимость',
      prepayment: 'Аванс',
      service_composition: 'Состав услуг',
      cancellation_policy: 'Условия отмены',
      reschedule_policy: 'Условия переноса',
      refund_policy: 'Порядок возврата средств',
      prepayment_due_rule: 'Срок внесения аванса',
      final_payment_rule: 'Окончательный расчет',
      hall_name: 'Название зала',
      rent_cost: 'Стоимость аренды',
      catering_cost: 'Стоимость питания',
      tech_cost: 'Стоимость оборудования'
    };

    if (tplVersion && tplVersion.variables) {
      for (const v of tplVersion.variables) {
        labelMap[v.key] = v.label;
      }
    }

    const keys = new Set([
      ...Object.keys(verA.variableValues || {}),
      ...Object.keys(verB.variableValues || {})
    ]);

    const diffs: VersionDiffItem[] = [];
    for (const k of keys) {
      const valA = verA.variableValues[k] || 'Условие не определено';
      const valB = verB.variableValues[k] || 'Условие не определено';
      if (valA !== valB) {
        diffs.push({
          key: k,
          label: labelMap[k] || k,
          oldValue: valA,
          newValue: valB,
          changedBy: verB.createdBy || 'Пользователь',
          changedAt: verB.createdAt,
          reason: verB.changeReason
        });
      }
    }

    return diffs;
  }

  async cancelContract(
    contractId: string,
    actor: string | ContractActorContext,
    reason: string,
    actorRoleOrPermissions?: string | string[],
    userPermissions?: string[]
  ): Promise<GeneratedContract> {
    const contract = await this.repo.getContract(contractId);
    if (!contract) throw new Error('Договор не найден');

    if (!reason || !reason.trim()) {
      throw new Error('Укажите причину отмены договора');
    }

    const perms = Array.isArray(actorRoleOrPermissions) ? actorRoleOrPermissions : userPermissions;
    const ctx = parseActor(actor, perms);

    if (!ContractAccessService.canCancel(contract, ctx.userId, ctx.permissions)) {
      throw new Error('У вас нет права отменять этот договор');
    }

    const isClient = contract.clientId === ctx.userId;
    const isContractor = contract.contractorId === ctx.userId;
    const isVenue = contract.venueId === ctx.userId;
    const isOrganizer = contract.organizerId === ctx.userId;

    ContractStateMachine.validateTransition(contract.status, 'cancelled');

    const prevStatus = contract.status;
    contract.status = 'cancelled';
    contract.updatedAt = new Date().toISOString();
    contract.auditLog.push({
      id: generateUUID(),
      contractId,
      actorId: ctx.userId,
      actorRole: isClient ? 'client' : isContractor ? 'contractor' : isVenue ? 'venue' : isOrganizer ? 'organizer' : 'user',
      action: 'CANCEL',
      timestamp: new Date().toISOString(),
      details: `Договор отменен из статуса "${prevStatus}". Причина: ${reason}`
    });

    await this.repo.saveContract(contract);
    return contract;
  }
}
