import { ContractPartyOption } from '../types';

export function getContractPartyOptionKey(option: ContractPartyOption): string {
  return `${option.role}:${option.partyId}:${option.entityId || option.id}`;
}

