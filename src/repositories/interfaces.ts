import {
  CanonicalUser,
  ContractorProfile,
  EventProject,
  CRMLead,
  CRMClient,
  CalendarResource,
  AvailabilitySlot,
  Booking,
  GeneratedContract,
  ContractTemplate,
  LegalDocument,
  Tariff,
  TariffAssignment,
  DisputeCase,
  NotificationReceipt,
  ContractorScore,
  ScoringRuleVersion,
  AuditLog,
  ExternalContractParty,
  ContractPartyOption
} from '../types';

export type { ContractPartyOption };

export interface EventFilterOptions {
  ownerUserId?: string;
  clientId?: string;
  organizerId?: string;
  status?: string;
}

export interface OrderFilterOptions {
  userId?: string;
  role?: 'client' | 'contractor' | string;
  eventId?: string;
  contractorId?: string;
  status?: string;
}

export interface ContractPartyRepository {
  listClients(): Promise<ContractPartyOption[]>;
  listContractors(): Promise<ContractPartyOption[]>;
  listVenues(): Promise<ContractPartyOption[]>;
  listOrganizers(): Promise<ContractPartyOption[]>;
  getParty(partyId: string): Promise<ContractPartyOption | null>;
  createExternalParty(party: Partial<ExternalContractParty> & { name?: string; displayName?: string; role: 'client' | 'contractor' | 'venue' | 'organizer' }): Promise<ContractPartyOption>;
}

export interface UserRepository {
  getUser(id: string): Promise<CanonicalUser | null>;
  saveUser(user: CanonicalUser): Promise<void>;
  getCurrentUser(): Promise<CanonicalUser | null>;
}

export interface ContractorRepository {
  getProfile(id: string): Promise<ContractorProfile | null>;
  getProfileByUserId(userId: string): Promise<ContractorProfile | null>;
  saveProfile(profile: ContractorProfile): Promise<void>;
  listProfiles(category?: string, city?: string): Promise<ContractorProfile[]>;
}

export interface VenueRepository {
  getVenueSpaces(venueId: string): Promise<any[]>;
  getVenuePackages(venueId: string): Promise<any[]>;
  saveVenueSpace(venueId: string, space: any): Promise<void>;
  saveVenuePackage(venueId: string, pkg: any): Promise<void>;
}

export interface EventRepository {
  getEvent(id: string): Promise<EventProject | null>;
  listEvents(filter?: EventFilterOptions): Promise<EventProject[]>;
  saveEvent(event: EventProject): Promise<void>;
  deleteEvent(id: string): Promise<void>;
}

export interface LeadRepository {
  getLead(id: string): Promise<CRMLead | null>;
  listLeads(contractorId: string): Promise<CRMLead[]>;
  saveLead(lead: CRMLead): Promise<void>;
}

export interface ClientRepository {
  getClient(id: string): Promise<CRMClient | null>;
  listClients(contractorId: string): Promise<CRMClient[]>;
  saveClient(client: CRMClient): Promise<void>;
}

export interface CalendarRepository {
  getResources(ownerId: string): Promise<CalendarResource[]>;
  saveResource(resource: CalendarResource): Promise<void>;
  getSlots(resourceId: string): Promise<AvailabilitySlot[]>;
  getAllSlots(ownerId: string): Promise<AvailabilitySlot[]>;
  saveSlot(slot: AvailabilitySlot): Promise<void>;
  deleteSlot(id: string): Promise<void>;
}

export interface OrderRepository {
  getOrder(id: string): Promise<Booking | null>;
  listOrders(filter?: OrderFilterOptions): Promise<Booking[]>;
  saveOrder(order: Booking): Promise<void>;
}

import { ContractRepository } from '../features/contracts/repositories/ContractRepository';
export type { ContractRepository };

export interface DocumentRepository {
  getLegalDocument(key: string): Promise<LegalDocument | null>;
  listLegalDocuments(): Promise<LegalDocument[]>;
  saveLegalDocument(doc: LegalDocument): Promise<void>;
}

export interface AnalyticsRepository {
  getContractorAnalytics(contractorId: string): Promise<any>;
  getVenueAnalytics(venueId: string): Promise<any>;
  getPlatformAnalytics(): Promise<any>;
}

export interface ScoringRepository {
  getScoringWeights(): Promise<ScoringRuleVersion | null>;
  saveScoringWeights(weights: ScoringRuleVersion): Promise<void>;
  getScoringWeightsHistory(): Promise<ScoringRuleVersion[]>;
  getContractorScore(contractorId: string): Promise<ContractorScore | null>;
  saveContractorScore(score: ContractorScore): Promise<void>;
  getScoreHistory(contractorId: string): Promise<any[]>;
  addScoreHistory(entry: any): Promise<void>;
}

export interface TariffRepository {
  getTariffs(): Promise<Tariff[]>;
  getTariffAssignment(userId: string): Promise<TariffAssignment | null>;
  assignTariff(userId: string, tariffId: string): Promise<TariffAssignment>;
  saveTariffConfig(tariffs: Tariff[]): Promise<void>;
}

export interface NotificationRepository {
  getNotifications(userId: string): Promise<NotificationReceipt[]>;
  saveNotification(notification: NotificationReceipt): Promise<void>;
  markAsRead(id: string): Promise<void>;
}

export interface DisputeRepository {
  getDispute(id: string): Promise<DisputeCase | null>;
  listDisputes(userId?: string): Promise<DisputeCase[]>;
  saveDispute(dispute: DisputeCase): Promise<void>;
}

export interface AuditRepository {
  getLogs(): Promise<AuditLog[]>;
  addLog(log: AuditLog): Promise<void>;
}
