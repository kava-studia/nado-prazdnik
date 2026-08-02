import { ContractRepository } from '../repositories/ContractRepository';
import { ContractTemplate, ContractTemplateVersion } from '../types';
import { isLegalEntityConfigured } from '../../../config/legalEntity';
import { generateUUID } from '../utils/uuid';

export class TemplateReviewService {
  constructor(private repo: ContractRepository) {}

  async submitForLegalReview(params: {
    templateId: string;
    versionId: string;
    actorId: string;
    note?: string;
  }): Promise<ContractTemplate> {
    const { templateId, versionId, note } = params;
    const version = await this.repo.getTemplateVersion(versionId);
    if (!version) throw new Error(`Версия шаблона ${versionId} не найдена`);

    const template = await this.repo.getTemplate(templateId);
    if (!template) throw new Error(`Шаблон ${templateId} не найден`);

    if (version.templateId !== templateId) {
      throw new Error('Несоответствие templateId в версии и шаблоне');
    }

    if (template.status !== 'draft' || version.status !== 'draft') {
      throw new Error('Направление на юридическую проверку возможно только когда и шаблон, и версия находятся в статусе "Черновик" (draft)');
    }

    if (template.category === 'platform' || template.documentKind === 'platform_policy' || template.documentKind === 'consent') {
      if (!isLegalEntityConfigured()) {
        throw new Error('Отправка на юридическое одобрение заблокирована: юридическое лицо платформы не заполнено в legalEntityConfig');
      }
    }

    template.status = 'legal_review';
    version.status = 'legal_review';
    template.updatedAt = new Date().toISOString();
    if (note) version.introduction = note;

    await this.repo.saveTemplateVersion(version);
    await this.repo.saveTemplate(template);
    return template;
  }

  async requestRevision(params: {
    templateId: string;
    versionId: string;
    reviewerId: string;
    reviewerRole: string;
    reason: string;
  }): Promise<ContractTemplate> {
    const { templateId, versionId, reviewerId, reviewerRole, reason } = params;
    const version = await this.repo.getTemplateVersion(versionId);
    if (!version) throw new Error(`Версия шаблона ${versionId} не найдена`);

    const template = await this.repo.getTemplate(templateId);
    if (!template) throw new Error(`Шаблон ${templateId} не найден`);

    if (version.templateId !== templateId) {
      throw new Error('Несоответствие templateId в версии и шаблоне');
    }

    if (!reason || !reason.trim()) {
      throw new Error('Укажите причину отправки на доработку');
    }

    if (template.status !== 'legal_review' || version.status !== 'legal_review') {
      throw new Error('Возврат на доработку возможен только из статуса юридической проверки (legal_review)');
    }

    template.status = 'revision_required';
    version.status = 'revision_required';
    version.reviewComment = reason;
    version.reviewedBy = reviewerId;
    version.reviewerRole = reviewerRole;
    template.updatedAt = new Date().toISOString();

    await this.repo.saveTemplateVersion(version);
    await this.repo.saveTemplate(template);
    return template;
  }

  async approveVersion(params: {
    templateId: string;
    versionId: string;
    reviewerId: string;
    reviewerRole: string;
    reviewComment: string;
  }): Promise<ContractTemplate> {
    const { templateId, versionId, reviewerId, reviewerRole, reviewComment } = params;
    const version = await this.repo.getTemplateVersion(versionId);
    if (!version) throw new Error(`Версия шаблона ${versionId} не найдена`);

    const template = await this.repo.getTemplate(templateId);
    if (!template) throw new Error(`Шаблон ${templateId} не найден`);

    if (version.templateId !== templateId) {
      throw new Error('Несоответствие templateId в версии и шаблоне');
    }

    if (template.status !== 'legal_review' || version.status !== 'legal_review') {
      throw new Error('Одобрение версии возможно только когда и шаблон, и версия находятся в статусе юридической проверки (legal_review)');
    }

    const now = new Date().toISOString();
    const role = reviewerRole || 'contracts.manage_templates';

    // Update template metadata
    template.status = 'approved';
    template.reviewedBy = reviewerId;
    template.reviewerRole = role;
    template.reviewedAt = now;
    template.reviewComment = reviewComment;
    template.approvedVersionId = versionId;
    template.updatedAt = now;

    // Update version metadata
    version.status = 'approved';
    version.reviewedBy = reviewerId;
    version.reviewerRole = role;
    version.reviewedAt = now;
    version.reviewComment = reviewComment;
    version.approvedVersionId = versionId;

    await this.repo.saveTemplateVersion(version);
    await this.repo.saveTemplate(template);
    return template;
  }

  async schedulePublication(params: {
    templateId: string;
    versionId: string;
    actorId: string;
    effectiveAt: string;
  }): Promise<ContractTemplate> {
    const { templateId, versionId, effectiveAt } = params;
    const version = await this.repo.getTemplateVersion(versionId);
    if (!version) throw new Error(`Версия шаблона ${versionId} не найдена`);

    const template = await this.repo.getTemplate(templateId);
    if (!template) throw new Error(`Шаблон ${templateId} не найден`);

    if (version.templateId !== templateId) {
      throw new Error('Несоответствие templateId в версии и шаблоне');
    }

    if (template.status !== 'approved' || version.status !== 'approved') {
      throw new Error('Запланировать публикацию возможно только когда и шаблон, и версия находятся в статусе approved');
    }

    const now = new Date().toISOString();
    template.status = 'scheduled';
    template.updatedAt = now;

    version.status = 'scheduled';
    version.scheduledAt = effectiveAt;
    version.effectiveAt = effectiveAt;

    await this.repo.saveTemplateVersion(version);
    await this.repo.saveTemplate(template);
    return template;
  }

  async publishApprovedVersion(params: {
    templateId: string;
    versionId: string;
    actorId: string;
  }): Promise<ContractTemplate> {
    const { templateId, versionId } = params;
    const version = await this.repo.getTemplateVersion(versionId);
    if (!version) throw new Error(`Версия шаблона ${versionId} не найдена`);

    const template = await this.repo.getTemplate(templateId);
    if (!template) throw new Error(`Шаблон ${templateId} не найден`);

    if (version.templateId !== templateId) {
      throw new Error('Несоответствие templateId в версии и шаблоне');
    }

    const isBothApproved = template.status === 'approved' && version.status === 'approved';
    const isBothScheduled = template.status === 'scheduled' && version.status === 'scheduled';
    if (!isBothApproved && !isBothScheduled) {
      throw new Error('Публикация шаблона возможна только когда и шаблон, и версия одновременно находятся в статусе approved или scheduled');
    }

    const hasApprovalRecord = Boolean(
      (version.approvedVersionId || version.reviewedAt) &&
      (template.approvedVersionId || template.reviewedAt)
    );
    if (!hasApprovalRecord) {
      throw new Error('Публикация запрещена: отсутствует сохранённое юридическое согласование (review metadata)');
    }

    if (template.category === 'platform' || template.documentKind === 'platform_policy' || template.documentKind === 'consent') {
      if (!isLegalEntityConfigured()) {
        throw new Error('Публикация документа платформы невозможна: юридическое лицо платформы не заполнено в legalEntityConfig');
      }
    }

    const now = new Date().toISOString();
    template.status = 'published';
    template.currentVersionId = versionId;
    template.updatedAt = now;

    version.status = 'published';
    version.publishedAt = now;
    version.effectiveAt = now;

    await this.repo.saveTemplateVersion(version);
    await this.repo.saveTemplate(template);
    return template;
  }

  async archiveVersion(params: {
    templateId: string;
    versionId: string;
    actorId: string;
    reason: string;
  }): Promise<ContractTemplate> {
    const { templateId, versionId } = params;
    const version = await this.repo.getTemplateVersion(versionId);
    if (!version) throw new Error(`Версия шаблона ${versionId} не найдена`);

    const template = await this.repo.getTemplate(templateId);
    if (!template) throw new Error(`Шаблон ${templateId} не найден`);

    if (version.templateId !== templateId) {
      throw new Error('Несоответствие templateId в версии и шаблоне');
    }

    if (!['published', 'scheduled'].includes(template.status) || !['published', 'scheduled'].includes(version.status)) {
      throw new Error('Архивация разрешена только для опубликованного или запланированного документа');
    }

    if (template.currentVersionId === versionId) {
      throw new Error('Нельзя архивировать текущую активную версию шаблона');
    }

    const now = new Date().toISOString();
    version.status = 'archived';
    version.archivedAt = now;
    await this.repo.saveTemplateVersion(version);

    template.status = 'archived';
    template.updatedAt = now;
    await this.repo.saveTemplate(template);

    return template;
  }

  async createNewTemplateVersion(
    templateId: string,
    actorId: string,
    changeReason: string
  ): Promise<ContractTemplateVersion> {
    if (!changeReason || !changeReason.trim()) {
      throw new Error('Необходимо указать причину создания новой версии');
    }

    const template = await this.repo.getTemplate(templateId);
    if (!template) throw new Error(`Шаблон ${templateId} не найден`);

    const currentVer = await this.repo.getTemplateVersion(template.currentVersionId);
    if (!currentVer) throw new Error(`Текущая версия ${template.currentVersionId} не найдена`);

    const versionParts = currentVer.version.split('.').map(Number);
    const newVersionStr = `${versionParts[0] || 1}.${(versionParts[1] || 0) + 1}.0`;

    const newVersion: ContractTemplateVersion = {
      ...currentVer,
      id: generateUUID(),
      version: newVersionStr,
      status: 'draft',
      clauses: structuredClone(currentVer.clauses || []),
      variables: structuredClone(currentVer.variables || []),
      createdAt: new Date().toISOString(),
      author: actorId,
      changeReason,
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewerRole: undefined,
      reviewComment: undefined,
      approvedVersionId: undefined,
      publishedAt: undefined,
      effectiveAt: undefined
    };

    template.currentVersionId = newVersion.id;
    template.status = 'draft';
    template.updatedAt = new Date().toISOString();

    await this.repo.saveTemplateVersion(newVersion);
    await this.repo.saveTemplate(template);
    return newVersion;
  }

  async repairTemplateVersionState(params: {
    templateId: string;
    versionId: string;
    targetStatus: 'draft' | 'legal_review' | 'revision_required' | 'approved' | 'scheduled' | 'published' | 'archived';
    actorId: string;
    actorPermissions?: string[];
    reason: string;
  }): Promise<ContractTemplate> {
    const { templateId, versionId, targetStatus, actorId, actorPermissions, reason } = params;

    const isAdmin = actorPermissions?.includes('system.admin') || actorPermissions?.includes('contracts.manage_templates');
    if (!isAdmin) {
      throw new Error('Восстановление статуса доступно только системному администратору');
    }

    if (!reason || !reason.trim()) {
      throw new Error('Укажите причину исправления состояния шаблона');
    }

    const version = await this.repo.getTemplateVersion(versionId);
    if (!version) throw new Error(`Версия шаблона ${versionId} не найдена`);

    const template = await this.repo.getTemplate(templateId);
    if (!template) throw new Error(`Шаблон ${templateId} не найден`);

    const now = new Date().toISOString();
    version.status = targetStatus;
    template.status = targetStatus;
    template.updatedAt = now;

    if (version.changeReason) {
      version.changeReason += ` | [REPAIR by ${actorId}]: ${reason}`;
    } else {
      version.changeReason = `[REPAIR by ${actorId}]: ${reason}`;
    }

    await this.repo.saveTemplateVersion(version);
    await this.repo.saveTemplate(template);
    return template;
  }
}
