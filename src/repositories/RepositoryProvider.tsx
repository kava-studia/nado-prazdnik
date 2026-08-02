import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserRepository,
  ContractorRepository,
  VenueRepository,
  EventRepository,
  LeadRepository,
  ClientRepository,
  CalendarRepository,
  OrderRepository,
  ContractRepository,
  DocumentRepository,
  AnalyticsRepository,
  ScoringRepository,
  TariffRepository,
  NotificationRepository,
  DisputeRepository,
  AuditRepository,
  ContractPartyRepository,
  ContractPartyOption
} from './interfaces';
import { ExternalContractParty } from '../types';

import {
  DemoUserRepository,
  DemoContractorRepository,
  DemoVenueRepository,
  DemoEventRepository,
  DemoLeadRepository,
  DemoClientRepository,
  DemoCalendarRepository,
  DemoOrderRepository,
  DemoContractRepository,
  DemoDocumentRepository,
  DemoAnalyticsRepository,
  DemoScoringRepository,
  DemoTariffRepository,
  DemoNotificationRepository,
  DemoDisputeRepository,
  DemoAuditRepository,
  DemoPartyRepository
} from './demoRepositories';

interface RepositoryContextType {
  userRepository: UserRepository;
  contractorRepository: ContractorRepository;
  venueRepository: VenueRepository;
  eventRepository: EventRepository;
  leadRepository: LeadRepository;
  clientRepository: ClientRepository;
  calendarRepository: CalendarRepository;
  orderRepository: OrderRepository;
  contractRepository: ContractRepository;
  partyRepository: ContractPartyRepository;
  documentRepository: DocumentRepository;
  analyticsRepository: AnalyticsRepository;
  scoringRepository: ScoringRepository;
  tariffRepository: TariffRepository;
  notificationRepository: NotificationRepository;
  disputeRepository: DisputeRepository;
  auditRepository: AuditRepository;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

// -----------------------------------------------------------------
// EMPTY REPOSITORIES (for unauthenticated auth mode)
// -----------------------------------------------------------------
class EmptyUserRepository implements UserRepository {
  async getUser() { return null; }
  async saveUser() {}
  async getCurrentUser() { return null; }
}

class EmptyContractorRepository implements ContractorRepository {
  async getProfile() { return null; }
  async getProfileByUserId() { return null; }
  async saveProfile() {}
  async listProfiles() { return []; }
}

class EmptyVenueRepository implements VenueRepository {
  async getVenueSpaces() { return []; }
  async getVenuePackages() { return []; }
  async saveVenueSpace() {}
  async saveVenuePackage() {}
}

class EmptyEventRepository implements EventRepository {
  async getEvent() { return null; }
  async listEvents() { return []; }
  async saveEvent() {}
  async deleteEvent() {}
}

class EmptyLeadRepository implements LeadRepository {
  async getLead() { return null; }
  async listLeads() { return []; }
  async saveLead() {}
}

class EmptyClientRepository implements ClientRepository {
  async getClient() { return null; }
  async listClients() { return []; }
  async saveClient() {}
}

class EmptyCalendarRepository implements CalendarRepository {
  async getResources() { return []; }
  async saveResource() {}
  async getSlots() { return []; }
  async getAllSlots() { return []; }
  async saveSlot() {}
  async deleteSlot() {}
}

class EmptyOrderRepository implements OrderRepository {
  async getOrder() { return null; }
  async listOrders() { return []; }
  async saveOrder() {}
}

class EmptyContractRepository implements ContractRepository {
  async listTemplates() { return []; }
  async getTemplate() { return null; }
  async saveTemplate() { throw new Error('Необходим вход в аккаунт'); }
  async listTemplateVersions() { return []; }
  async getTemplateVersion() { return null; }
  async saveTemplateVersion() { throw new Error('Необходим вход в аккаунт'); }
  async listContracts() { return []; }
  async getContract() { return null; }
  async saveContract() { throw new Error('Необходим вход в аккаунт'); }
  async listContractVersions() { return []; }
  async getContractVersion() { return null; }
  async saveContractVersion() { throw new Error('Необходим вход в аккаунт'); }
  async listAttachments() { return []; }
  async saveAttachment() { throw new Error('Необходим вход в аккаунт'); }
  async removeAttachment() { throw new Error('Необходим вход в аккаунт'); }
  async listConfirmations() { return []; }
  async saveConfirmation() { throw new Error('Необходим вход в аккаунт'); }
}

class EmptyDocumentRepository implements DocumentRepository {
  async getLegalDocument() { return null; }
  async listLegalDocuments() { return []; }
  async saveLegalDocument() {}
}

class EmptyAnalyticsRepository implements AnalyticsRepository {
  async getContractorAnalytics() { return {}; }
  async getVenueAnalytics() { return {}; }
  async getPlatformAnalytics() { return {}; }
}

class EmptyScoringRepository implements ScoringRepository {
  async getScoringWeights() { return null; }
  async saveScoringWeights() {}
  async getScoringWeightsHistory() { return []; }
  async getContractorScore() { return null; }
  async saveContractorScore() {}
  async getScoreHistory() { return []; }
  async addScoreHistory() {}
}

class EmptyTariffRepository implements TariffRepository {
  async getTariffs() { return []; }
  async getTariffAssignment() { return null; }
  async assignTariff(userId: string, tariffId: string): Promise<any> { throw new Error('Unauthenticated'); }
  async saveTariffConfig() {}
}

class EmptyNotificationRepository implements NotificationRepository {
  async getNotifications() { return []; }
  async saveNotification() {}
  async markAsRead() {}
}

class EmptyDisputeRepository implements DisputeRepository {
  async getDispute() { return null; }
  async listDisputes() { return []; }
  async saveDispute() {}
}

class EmptyAuditRepository implements AuditRepository {
  async getLogs() { return []; }
  async addLog() {}
}

class EmptyPartyRepository implements ContractPartyRepository {
  async listClients() { return []; }
  async listContractors() { return []; }
  async listVenues() { return []; }
  async listOrganizers() { return []; }
  async getParty() { return null; }
  async createExternalParty(p: any): Promise<ContractPartyOption> {
    const id = p.id || 'ext-empty';
    const name = p.displayName || p.name || 'External Party';
    return {
      id,
      name,
      partyId: id,
      displayName: name,
      role: p.role || 'client',
      isExternal: true,
      email: p.email,
      phone: p.phone,
      requisites: p.requisites
    };
  }
}

// Instantiate empty singletons
const emptyRepos: RepositoryContextType = {
  userRepository: new EmptyUserRepository(),
  contractorRepository: new EmptyContractorRepository(),
  venueRepository: new EmptyVenueRepository(),
  eventRepository: new EmptyEventRepository(),
  leadRepository: new EmptyLeadRepository(),
  clientRepository: new EmptyClientRepository(),
  calendarRepository: new EmptyCalendarRepository(),
  orderRepository: new EmptyOrderRepository(),
  contractRepository: new EmptyContractRepository(),
  partyRepository: new EmptyPartyRepository(),
  documentRepository: new EmptyDocumentRepository(),
  analyticsRepository: new EmptyAnalyticsRepository(),
  scoringRepository: new EmptyScoringRepository(),
  tariffRepository: new EmptyTariffRepository(),
  notificationRepository: new EmptyNotificationRepository(),
  disputeRepository: new EmptyDisputeRepository(),
  auditRepository: new EmptyAuditRepository(),
};

// Instantiate active implementations
const activeRepos: RepositoryContextType = {
  userRepository: new DemoUserRepository(),
  contractorRepository: new DemoContractorRepository(),
  venueRepository: new DemoVenueRepository(),
  eventRepository: new DemoEventRepository(),
  leadRepository: new DemoLeadRepository(),
  clientRepository: new DemoClientRepository(),
  calendarRepository: new DemoCalendarRepository(),
  orderRepository: new DemoOrderRepository(),
  contractRepository: new DemoContractRepository(),
  partyRepository: new DemoPartyRepository(),
  documentRepository: new DemoDocumentRepository(),
  analyticsRepository: new DemoAnalyticsRepository(),
  scoringRepository: new DemoScoringRepository(),
  tariffRepository: new DemoTariffRepository(),
  notificationRepository: new DemoNotificationRepository(),
  disputeRepository: new DemoDisputeRepository(),
  auditRepository: new DemoAuditRepository(),
};

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
  const { authMode } = useAuth();

  const repositories = useMemo(() => {
    if (authMode === 'unauthenticated' || authMode === 'loading') {
      return emptyRepos;
    }
    // In our client-side architecture, 'demo' and 'real' modes both map to our 
    // namespace-aware repository classes, which automatically switch storage 
    // targets (nado_prazdnik_demo_* vs nado_prazdnik_*) based on getStorageNamespace().
    return activeRepos;
  }, [authMode]);

  return (
    <RepositoryContext.Provider value={repositories}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositories() {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositories must be used within a RepositoryProvider');
  }
  return context;
}
