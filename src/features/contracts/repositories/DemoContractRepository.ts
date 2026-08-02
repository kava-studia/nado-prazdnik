import { ContractRepository, ContractFilterOptions } from './ContractRepository';
import { 
  ContractTemplate, 
  ContractTemplateVersion, 
  GeneratedContract, 
  GeneratedContractVersion, 
  ContractAttachment, 
  ContractConfirmation 
} from '../types';
import { defaultTemplates } from '../templates/defaultTemplates';
import { getStorageNamespace } from '../../../services/storageNamespace';

// In-memory fallback when running in Node.js test environment without DOM
const inMemoryStore = new Map<string, string>();

function getStorageKey(keyName: string): string {
  const ns = getStorageNamespace();
  return `${ns}_contracts_${keyName}`;
}

export class DemoContractRepository implements ContractRepository {
  private getItem<T>(keyName: string, fallback: T): T {
    try {
      const fullKey = getStorageKey(keyName);
      let raw: string | null = null;
      if (typeof localStorage !== 'undefined') {
        raw = localStorage.getItem(fullKey);
      } else {
        raw = inMemoryStore.get(fullKey) || null;
      }
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(keyName: string, value: T): void {
    try {
      const fullKey = getStorageKey(keyName);
      const str = JSON.stringify(value);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(fullKey, str);
      } else {
        inMemoryStore.set(fullKey, str);
      }
    } catch (e) {
      console.error('Failed to set contract storage', e);
    }
  }

  private initDefaults(): void {
    const templatesKey = getStorageKey('templates');
    const existing = typeof localStorage !== 'undefined' ? localStorage.getItem(templatesKey) : inMemoryStore.get(templatesKey);
    if (!existing) {
      const templates = defaultTemplates.map(t => t.template);
      const versions = defaultTemplates.map(t => t.version);
      this.setItem('templates', templates);
      this.setItem('template_versions', versions);
    }

    const contractsKey = getStorageKey('list');
    const existingList = typeof localStorage !== 'undefined' ? localStorage.getItem(contractsKey) : inMemoryStore.get(contractsKey);
    if (!existingList) {
      this.setItem('list', []);
    }
  }

  async listTemplates(): Promise<ContractTemplate[]> {
    this.initDefaults();
    const list = this.getItem<ContractTemplate[]>('templates', []);
    return list.map(t => ({
      ...t,
      applicableLegalStatuses: t.applicableLegalStatuses || ['individual', 'self_employed', 'ip', 'llc']
    }));
  }

  async getTemplate(id: string): Promise<ContractTemplate | null> {
    const list = await this.listTemplates();
    return list.find(t => t.id === id) || null;
  }

  async saveTemplate(template: ContractTemplate): Promise<void> {
    const list = await this.listTemplates();
    const idx = list.findIndex(t => t.id === template.id);
    if (idx >= 0) list[idx] = template;
    else list.push(template);
    this.setItem('templates', list);
  }

  async listTemplateVersions(templateId: string): Promise<ContractTemplateVersion[]> {
    this.initDefaults();
    const versions = this.getItem<ContractTemplateVersion[]>('template_versions', []);
    return versions.filter(v => v.templateId === templateId);
  }

  async getTemplateVersion(id: string): Promise<ContractTemplateVersion | null> {
    this.initDefaults();
    const versions = this.getItem<ContractTemplateVersion[]>('template_versions', []);
    return versions.find(v => v.id === id) || null;
  }

  async saveTemplateVersion(version: ContractTemplateVersion): Promise<void> {
    this.initDefaults();
    const versions = this.getItem<ContractTemplateVersion[]>('template_versions', []);
    const idx = versions.findIndex(v => v.id === version.id);
    if (idx >= 0) versions[idx] = version;
    else versions.push(version);
    this.setItem('template_versions', versions);
  }

  async listContracts(filter?: ContractFilterOptions): Promise<GeneratedContract[]> {
    this.initDefaults();
    let list = this.getItem<GeneratedContract[]>('list', []);
    let hasMigrated = false;
    list = list.map(c => {
      if ((c.status as string) === 'client_confirmed' || (c.status as string) === 'contractor_confirmed') {
        hasMigrated = true;
        return { ...c, status: 'partially_confirmed' as const };
      }
      return c;
    });
    if (hasMigrated) {
      this.setItem('list', list);
    }

    if (filter) {
      const hasViewAll = filter.permissions?.includes('contracts.view_all');
      const hasEditCreated = filter.permissions?.includes('contracts.edit_created_draft');
      const targetUserId = filter.currentUserId || filter.userId;

      if (!hasViewAll && targetUserId) {
        list = list.filter(c => {
          const isParty =
            c.clientId === targetUserId ||
            c.contractorId === targetUserId ||
            c.venueId === targetUserId ||
            c.organizerId === targetUserId;
          if (isParty) return true;
          if (
            c.createdByUserId === targetUserId &&
            hasEditCreated &&
            ['draft', 'data_required', 'revision_required'].includes(c.status)
          ) {
            return true;
          }
          return false;
        });
      }

      if (filter.clientId) {
        list = list.filter(c => c.clientId === filter.clientId);
      }
      if (filter.contractorId) {
        list = list.filter(c => c.contractorId === filter.contractorId);
      }
      if (filter.venueId) {
        list = list.filter(c => c.venueId === filter.venueId);
      }
      if (filter.organizerId) {
        list = list.filter(c => c.organizerId === filter.organizerId);
      }
      if (filter.category) {
        list = list.filter(c => c.category === filter.category || c.templateId?.includes(filter.category!));
      }
      if (filter.documentKind) {
        list = list.filter(c => c.documentKind === filter.documentKind);
      }
      if (filter.status) {
        list = list.filter(c => c.status === filter.status);
      }
      if (filter.eventId) {
        list = list.filter(c => c.eventId === filter.eventId);
      }
    }

    return list;
  }

  async getContract(id: string): Promise<GeneratedContract | null> {
    const list = await this.listContracts();
    return list.find(c => c.id === id) || null;
  }

  async saveContract(contract: GeneratedContract): Promise<void> {
    const list = await this.listContracts();
    const idx = list.findIndex(c => c.id === contract.id);
    if (idx >= 0) list[idx] = contract;
    else list.push(contract);
    this.setItem('list', list);
  }

  async listContractVersions(contractId: string): Promise<GeneratedContractVersion[]> {
    this.initDefaults();
    const versions = this.getItem<GeneratedContractVersion[]>(`versions_${contractId}`, []);
    return versions;
  }

  async getContractVersion(id: string): Promise<GeneratedContractVersion | null> {
    this.initDefaults();
    const all = this.getItem<GeneratedContractVersion[]>('all_contract_versions', []);
    return all.find(v => v.id === id) || null;
  }

  async saveContractVersion(version: GeneratedContractVersion): Promise<void> {
    this.initDefaults();
    const key = `versions_${version.contractId}`;
    const list = this.getItem<GeneratedContractVersion[]>(key, []);
    const idx = list.findIndex(v => v.id === version.id);
    if (idx >= 0) list[idx] = version;
    else list.push(version);
    this.setItem(key, list);

    // Save to global list
    const all = this.getItem<GeneratedContractVersion[]>('all_contract_versions', []);
    const gIdx = all.findIndex(v => v.id === version.id);
    if (gIdx >= 0) all[gIdx] = version;
    else all.push(version);
    this.setItem('all_contract_versions', all);
  }

  async listAttachments(contractId: string): Promise<ContractAttachment[]> {
    const contract = await this.getContract(contractId);
    return contract?.attachments || [];
  }

  async saveAttachment(attachment: ContractAttachment): Promise<void> {
    const contract = await this.getContract(attachment.contractId);
    if (!contract) return;
    const attachments = contract.attachments || [];
    const idx = attachments.findIndex(a => a.id === attachment.id);
    if (idx >= 0) attachments[idx] = attachment;
    else attachments.push(attachment);
    contract.attachments = attachments;
    await this.saveContract(contract);
  }

  async removeAttachment(attachmentId: string): Promise<void> {
    const list = await this.listContracts();
    for (const contract of list) {
      if (contract.attachments && contract.attachments.some(a => a.id === attachmentId)) {
        contract.attachments = contract.attachments.filter(a => a.id !== attachmentId);
        await this.saveContract(contract);
        break;
      }
    }
  }

  async listConfirmations(contractId: string): Promise<ContractConfirmation[]> {
    const contract = await this.getContract(contractId);
    return contract?.confirmations || [];
  }

  async saveConfirmation(confirmation: ContractConfirmation): Promise<void> {
    const contract = await this.getContract(confirmation.contractId);
    if (!contract) return;
    const confirmations = contract.confirmations || [];
    const targetVersionId = confirmation.contractVersionId;
    if (!targetVersionId) {
      throw new Error('contractVersionId обязателен для записи подтверждения');
    }
    const exists = confirmations.some(c =>
      c.contractId === confirmation.contractId &&
      c.contractVersionId === targetVersionId &&
      c.partyId === confirmation.partyId &&
      c.role === confirmation.role
    );
    if (exists) {
      // Idempotent return without throwing to prevent double submission crashes
      return;
    }
    confirmations.push(confirmation);
    contract.confirmations = confirmations;
    await this.saveContract(contract);
  }
}
