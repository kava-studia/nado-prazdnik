import { GeneratedContract } from '../types';

export class ContractAccessService {
  static isParty(contract: GeneratedContract, userId: string): boolean {
    if (!userId) return false;
    return (
      contract.clientId === userId ||
      contract.contractorId === userId ||
      contract.venueId === userId ||
      contract.organizerId === userId
    );
  }

  static canViewContract(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    if (!userId) return false;
    if (userPermissions?.includes('contracts.view_all')) {
      return true;
    }
    if (this.isParty(contract, userId)) {
      return true;
    }
    if (
      contract.createdByUserId === userId &&
      userPermissions?.includes('contracts.edit_created_draft') &&
      ['draft', 'data_required', 'revision_required'].includes(contract.status)
    ) {
      return true;
    }
    return false;
  }

  static canEditDraft(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    if (!userId) return false;
    if (!['draft', 'data_required', 'revision_required'].includes(contract.status)) return false;
    if (this.isParty(contract, userId)) return true;
    if (contract.createdByUserId === userId && userPermissions?.includes('contracts.edit_created_draft')) {
      return true;
    }
    return false;
  }

  static canSendForReview(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    return this.canEditDraft(contract, userId, userPermissions);
  }

  static canConfirm(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    if (!userId) return false;
    if (contract.status !== 'sent' && contract.status !== 'partially_confirmed') return false;
    // Strictly specific party ONLY. Admin cannot confirm on behalf of party unless they are that party.
    return this.isParty(contract, userId);
  }

  static canRequestRevision(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    if (!userId) return false;
    if (!['sent', 'partially_confirmed', 'confirmed'].includes(contract.status)) return false;
    return this.isParty(contract, userId);
  }

  static canCancel(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    if (!userId) return false;
    if (['cancelled', 'completed', 'superseded'].includes(contract.status)) return false;
    if (userPermissions?.includes('contracts.cancel_any')) return true;
    return this.isParty(contract, userId);
  }

  static canCreateNewVersion(contract: GeneratedContract, userId: string): boolean {
    if (!userId) return false;
    if (!['revision_required', 'confirmed'].includes(contract.status)) return false;
    return this.isParty(contract, userId);
  }

  static getAvailableActions(contract: GeneratedContract, userId: string, userPermissions?: string[]) {
    return {
      canEdit: this.canEditDraft(contract, userId, userPermissions),
      canSend: this.canSendForReview(contract, userId, userPermissions),
      canConfirm: this.canConfirm(contract, userId, userPermissions),
      canRequestRevision: this.canRequestRevision(contract, userId, userPermissions),
      canCancel: this.canCancel(contract, userId, userPermissions),
      canCreateNewVersion: this.canCreateNewVersion(contract, userId),
      canViewAttachments: this.canViewAttachments(contract, userId, userPermissions),
      canManageAttachments: this.canManageAttachments(contract, userId, userPermissions),
    };
  }

  static canViewAttachments(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    return this.canViewContract(contract, userId, userPermissions);
  }

  static canManageAttachments(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    if (!['draft', 'data_required', 'revision_required'].includes(contract.status)) return false;
    return this.canEditDraft(contract, userId, userPermissions);
  }

  static canViewVersions(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    return this.canViewContract(contract, userId, userPermissions);
  }

  static canViewConfirmations(contract: GeneratedContract, userId: string, userPermissions?: string[]): boolean {
    return this.canViewContract(contract, userId, userPermissions);
  }
}
