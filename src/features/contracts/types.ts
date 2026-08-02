import { 
  ContractTemplate, 
  ContractTemplateVersion, 
  ContractClause, 
  ContractVariable, 
  GeneratedContract, 
  GeneratedContractVersion, 
  ContractAttachment, 
  ContractConfirmation, 
  ContractAuditEntry,
  ContractDocumentKind,
  DocumentKind,
  ContractStatus,
  VisibilityCondition,
  ExternalContractParty,
  ContractPartyOption,
  UserPermission
} from '../../types';

export type {
  ContractTemplate,
  ContractTemplateVersion,
  ContractClause,
  ContractVariable,
  GeneratedContract,
  GeneratedContractVersion,
  ContractAttachment,
  ContractConfirmation,
  ContractAuditEntry,
  ContractDocumentKind,
  DocumentKind,
  ContractStatus,
  VisibilityCondition,
  ExternalContractParty,
  ContractPartyOption,
  UserPermission
};

export function getContractPartyOptionKey(party: ContractPartyOption): string {
  return `${party.role}:${party.partyId}:${party.entityId || 'external'}`;
}

export interface AttachmentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultContent: string;
  variables: ContractVariable[];
  visibilityCondition?: VisibilityCondition;
}

export type VenueOperationModel = 'rent' | 'services' | 'mixed' | 'unspecified';

export interface PlatformDocumentTemplate extends ContractTemplate {
  category: 'platform';
  documentKind: 'platform_policy';
  targetAudience: 'all' | 'client' | 'contractor' | 'venue' | 'organizer';
}

export interface ConsentTemplate extends ContractTemplate {
  category: 'platform';
  documentKind: 'consent';
  subject: string;
  dataOperator: string;
  purpose: string;
  dataCategories: string[];
  processingActions: string[];
  term: string;
  revocationMethod: string;
}

export interface ServiceContractTemplate extends ContractTemplate {
  category: 'contractor' | 'venue' | 'organizer';
  documentKind: 'service_contract' | 'venue_contract';
  supportedAttachments: string[];
}

export interface VersionDiffItem {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface ContractValidationResult {
  isValid: boolean;
  missingFields: { key: string; label: string; step: number }[];
}

export interface ContractFilterOptions {
  userId?: string;
  currentUserId?: string;
  manageAll?: boolean;
  permissions?: string[];
  clientId?: string;
  contractorId?: string;
  venueId?: string;
  organizerId?: string;
  category?: string;
  documentKind?: string;
  status?: string;
  eventId?: string;
}

