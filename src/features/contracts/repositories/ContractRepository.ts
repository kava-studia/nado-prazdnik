import { 
  ContractTemplate, 
  ContractTemplateVersion, 
  GeneratedContract, 
  GeneratedContractVersion, 
  ContractAttachment, 
  ContractConfirmation 
} from '../types';

export interface ContractFilterOptions {
  userId?: string;
  currentUserId?: string;
  clientId?: string;
  role?: 'client' | 'contractor' | 'organizer' | 'venue' | 'platform' | string;
  contractorId?: string;
  venueId?: string;
  organizerId?: string;
  eventId?: string;
  category?: string;
  documentKind?: string;
  status?: string;
  permissions?: string[];
}

export interface ContractRepository {
  listTemplates(): Promise<ContractTemplate[]>;
  getTemplate(id: string): Promise<ContractTemplate | null>;
  saveTemplate(template: ContractTemplate): Promise<void>;

  listTemplateVersions(templateId: string): Promise<ContractTemplateVersion[]>;
  getTemplateVersion(id: string): Promise<ContractTemplateVersion | null>;
  saveTemplateVersion(version: ContractTemplateVersion): Promise<void>;

  listContracts(filter?: ContractFilterOptions): Promise<GeneratedContract[]>;
  getContract(id: string): Promise<GeneratedContract | null>;
  saveContract(contract: GeneratedContract): Promise<void>;

  listContractVersions(contractId: string): Promise<GeneratedContractVersion[]>;
  getContractVersion(id: string): Promise<GeneratedContractVersion | null>;
  saveContractVersion(version: GeneratedContractVersion): Promise<void>;

  listAttachments(contractId: string): Promise<ContractAttachment[]>;
  saveAttachment(attachment: ContractAttachment): Promise<void>;
  removeAttachment(attachmentId: string): Promise<void>;

  listConfirmations(contractId: string): Promise<ContractConfirmation[]>;
  saveConfirmation(confirmation: ContractConfirmation): Promise<void>;
}
