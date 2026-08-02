import React, { createContext, useContext, useState, useEffect } from 'react';
import { CanonicalUser, UserRole } from '../types';
import { seedDatabase, defaultLocalStorageAdapter } from '../repositories/demoRepositories';

export type DemoScenario =
  | 'empty_client'
  | 'event_created'
  | 'event_in_progress'
  | 'event_ready'
  | 'contractor'
  | 'contractor_expired'
  | 'contractor_high_score'
  | 'contractor_low_calendar'
  | 'organizer'
  | 'venue'
  | 'venue_conflict'
  | 'admin_scoring'
  | 'admin_contracts'
  | 'order_dispute'
  | 'contract_versions';

export interface DemoModeContextType {
  isDemoMode: boolean;
  demoUser: CanonicalUser | null;
  demoScenario: DemoScenario;
  demoRole: UserRole;
  demoPartyId: string;
  startDemoMode: (scenario?: DemoScenario) => void;
  exitDemoMode: () => void;
  resetDemoData: () => void;
  setDemoScenario: (scenario: DemoScenario) => void;
  setDemoRole: (role: UserRole) => void;
  setDemoPartyId: (partyId: string) => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DEMO_PARTIES: Record<string, CanonicalUser> = {
  'demo-client-user': {
    id: 'demo-client-user',
    displayName: 'Демонстрационный клиент',
    firstName: 'Демонстрационный',
    lastName: 'Клиент',
    avatarUrl: '',
    primaryEmail: 'client@demo.nado.ru',
    primaryPhone: '+7 (999) 000-00-01',
    emailVerified: true,
    phoneVerified: true,
    status: 'active',
    roles: ['client'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  'demo-contractor-host': {
    id: 'demo-contractor-host',
    displayName: 'Ведущий Алексей',
    firstName: 'Алексей',
    lastName: 'Ведущий',
    avatarUrl: '',
    primaryEmail: 'host@demo.nado.ru',
    primaryPhone: '+7 (999) 000-00-02',
    emailVerified: true,
    phoneVerified: true,
    status: 'active',
    roles: ['contractor'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  'demo-contractor-dj': {
    id: 'demo-contractor-dj',
    displayName: 'DJ Сергей',
    firstName: 'Сергей',
    lastName: 'DJ',
    avatarUrl: '',
    primaryEmail: 'dj@demo.nado.ru',
    primaryPhone: '+7 (999) 000-00-03',
    emailVerified: true,
    phoneVerified: true,
    status: 'active',
    roles: ['contractor'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  'demo-venue-user': {
    id: 'demo-venue-user',
    displayName: 'Локация Loft Hall',
    firstName: 'Loft',
    lastName: 'Hall',
    avatarUrl: '',
    primaryEmail: 'venue@demo.nado.ru',
    primaryPhone: '+7 (999) 000-00-04',
    emailVerified: true,
    phoneVerified: true,
    status: 'active',
    roles: ['venue_manager'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  'demo-organizer-user': {
    id: 'demo-organizer-user',
    displayName: 'Демонстрационный организатор',
    firstName: 'Демо',
    lastName: 'Организатор',
    avatarUrl: '',
    primaryEmail: 'organizer@demo.nado.ru',
    primaryPhone: '+7 (999) 000-00-05',
    emailVerified: true,
    phoneVerified: true,
    status: 'active',
    roles: ['organizer'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  'demo-administrator-user': {
    id: 'demo-administrator-user',
    displayName: 'Демонстрационный администратор',
    firstName: 'Демо',
    lastName: 'Администратор',
    avatarUrl: '',
    primaryEmail: 'admin@demo.nado.ru',
    primaryPhone: '+7 (999) 000-00-00',
    emailVerified: true,
    phoneVerified: true,
    status: 'active',
    roles: ['administrator'],
    permissions: [
      'contracts.view_all',
      'contracts.manage_templates',
      'contracts.cancel_any',
      'contracts.edit_created_draft',
      'disputes.view_all',
      'disputes.manage',
      'disputes.approve_financial',
      'security.view',
      'security.manage',
      'users.manage_access',
      'audit.view',
      'system.admin'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  }
};

export const CANONICAL_DEMO_USER: CanonicalUser = DEMO_PARTIES['demo-client-user'];

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('nado_prazdnik_demo_session');
  });

  const [demoScenario, setDemoScenarioState] = useState<DemoScenario>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('nado_prazdnik_demo_scenario') as DemoScenario;
      if (saved) return saved;
    }
    return 'event_created';
  });

  const [demoRole, setDemoRoleState] = useState<UserRole>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('nado_prazdnik_demo_role') as UserRole;
      if (saved) return saved;
    }
    return 'client';
  });

  const [demoPartyId, setDemoPartyIdState] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('nado_prazdnik_demo_party_id');
      if (saved && DEMO_PARTIES[saved]) return saved;
    }
    return 'demo-client-user';
  });

  const setDemoPartyId = (partyId: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nado_prazdnik_demo_party_id', partyId);
    }
    setDemoPartyIdState(partyId);
    const partyUser = DEMO_PARTIES[partyId];
    if (partyUser && partyUser.roles && partyUser.roles[0]) {
      setDemoRoleState(partyUser.roles[0]);
    }
    window.dispatchEvent(new Event('demo-state-changed'));
  };

  // Re-sync state when sessionStorage changes manually/externally
  useEffect(() => {
    const handleStorageChange = () => {
      const active = !!sessionStorage.getItem('nado_prazdnik_demo_session');
      setIsDemoMode(active);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const populateScenarioData = (scenario: DemoScenario) => {
    seedDatabase(defaultLocalStorageAdapter, scenario);
  };

  const startDemoMode = (scenario: DemoScenario = 'event_created') => {
    sessionStorage.setItem('nado_prazdnik_demo_session', 'active');
    localStorage.setItem('nado_prazdnik_demo_scenario', scenario);
    
    // Determine default role for the scenario
    let defaultRole: UserRole = 'client';
    let defaultPartyId = 'demo-client-user';

    if (scenario === 'contractor' || scenario === 'contractor_expired' || scenario === 'contractor_high_score' || scenario === 'contractor_low_calendar' || scenario === 'contract_versions') {
      defaultRole = 'contractor';
      defaultPartyId = 'demo-contractor-host';
    } else if (scenario === 'organizer') {
      defaultRole = 'organizer';
      defaultPartyId = 'demo-organizer-user';
    } else if (scenario === 'venue' || scenario === 'venue_conflict') {
      defaultRole = 'venue_manager';
      defaultPartyId = 'demo-venue-user';
    } else if (scenario === 'admin_scoring' || scenario === 'admin_contracts') {
      defaultRole = 'administrator';
      defaultPartyId = 'demo-administrator-user';
    }

    localStorage.setItem('nado_prazdnik_demo_role', defaultRole);
    localStorage.setItem('nado_prazdnik_demo_party_id', defaultPartyId);

    setDemoScenarioState(scenario);
    setDemoRoleState(defaultRole);
    setDemoPartyIdState(defaultPartyId);
    populateScenarioData(scenario);
    setIsDemoMode(true);
    
    // Broadcast state change
    window.dispatchEvent(new Event('demo-state-changed'));
  };

  const setDemoScenario = (scenario: DemoScenario) => {
    localStorage.setItem('nado_prazdnik_demo_scenario', scenario);
    
    let defaultRole: UserRole = 'client';
    let defaultPartyId = 'demo-client-user';

    if (scenario === 'contractor' || scenario === 'contractor_expired' || scenario === 'contractor_high_score' || scenario === 'contractor_low_calendar' || scenario === 'contract_versions') {
      defaultRole = 'contractor';
      defaultPartyId = 'demo-contractor-host';
    } else if (scenario === 'organizer') {
      defaultRole = 'organizer';
      defaultPartyId = 'demo-organizer-user';
    } else if (scenario === 'venue' || scenario === 'venue_conflict') {
      defaultRole = 'venue_manager';
      defaultPartyId = 'demo-venue-user';
    } else if (scenario === 'admin_scoring' || scenario === 'admin_contracts') {
      defaultRole = 'administrator';
      defaultPartyId = 'demo-administrator-user';
    }

    localStorage.setItem('nado_prazdnik_demo_role', defaultRole);
    localStorage.setItem('nado_prazdnik_demo_party_id', defaultPartyId);

    setDemoScenarioState(scenario);
    setDemoRoleState(defaultRole);
    setDemoPartyIdState(defaultPartyId);
    populateScenarioData(scenario);

    // Broadcast state change
    window.dispatchEvent(new Event('demo-state-changed'));
  };

  const setDemoRole = (role: UserRole) => {
    localStorage.setItem('nado_prazdnik_demo_role', role);
    setDemoRoleState(role);
    window.dispatchEvent(new Event('demo-state-changed'));
  };

  const exitDemoMode = () => {
    sessionStorage.removeItem('nado_prazdnik_demo_session');
    setIsDemoMode(false);
    window.dispatchEvent(new Event('demo-state-changed'));
  };

  const resetDemoData = () => {
    populateScenarioData(demoScenario);
    window.dispatchEvent(new Event('demo-state-changed'));
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        demoUser: isDemoMode ? (DEMO_PARTIES[demoPartyId] || DEMO_PARTIES['demo-client-user']) : null,
        demoScenario,
        demoRole,
        demoPartyId,
        startDemoMode,
        exitDemoMode,
        resetDemoData,
        setDemoScenario,
        setDemoRole,
        setDemoPartyId
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
