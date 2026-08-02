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
  ContractTemplateVersion,
  ExternalContractParty,
  ContractPartyOption
} from '../types';

import { generateUUID } from '../features/contracts/utils/uuid';

import {
  UserRepository,
  ContractorRepository,
  VenueRepository,
  EventRepository,
  LeadRepository,
  ClientRepository,
  CalendarRepository,
  OrderRepository,
  ContractPartyRepository,
  EventFilterOptions,
  OrderFilterOptions,
  ContractRepository,
  DocumentRepository,
  AnalyticsRepository,
  ScoringRepository,
  TariffRepository,
  NotificationRepository,
  DisputeRepository,
  AuditRepository
} from './interfaces';

import { getStorageNamespace } from '../services/storageNamespace';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const defaultLocalStorageAdapter: StorageAdapter = {
  getItem: (key: string) => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {}
  }
};

let activeStorageAdapter: StorageAdapter = defaultLocalStorageAdapter;

export function setStorageAdapter(adapter: StorageAdapter) {
  activeStorageAdapter = adapter;
}

export function getStorageKey(baseKey: string): string {
  const ns = getStorageNamespace();
  const cleanKey = baseKey.replace(/^nado_/, '');
  if (cleanKey === 'scoring_weights') {
    return `${ns}_scoring`;
  }
  return `${ns}_${cleanKey}`;
}

export function clearDemoNamespace(adapter: StorageAdapter = defaultLocalStorageAdapter) {
  if (typeof localStorage !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nado_prazdnik_demo_')) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      adapter.removeItem(key);
    }
  }
}

// Safely access localStorage with error boundaries
const storage = {
  getItem: (key: string): string | null => {
    return activeStorageAdapter.getItem(getStorageKey(key));
  },
  setItem: (key: string, value: string): void => {
    activeStorageAdapter.setItem(getStorageKey(key), value);
  },
  removeItem: (key: string): void => {
    activeStorageAdapter.removeItem(getStorageKey(key));
  }
};

// Fixtures for Seeding
export const defaultTariffs: Tariff[] = [
  { id: 't-free', name: 'FREE', price: 0, commissionPercent: 12, features: ['Каталог', 'Простые договора'], status: 'active' },
  { id: 't-pro', name: 'PRO', price: 4900, commissionPercent: 8, features: ['Каталог', 'Сниженная комиссия', 'NADO Календарь', 'Базовая CRM'], status: 'active' },
  { id: 't-biz', name: 'BUSINESS', price: 9900, commissionPercent: 5, features: ['Топ в каталоге', 'Минимальная комиссия', 'CRM PRO', 'Календарь ресурсов', 'Свой логотип'], status: 'active' }
];

export const defaultScoringWeights: ScoringRuleVersion = {
  id: 'sv-1',
  version: '2.0',
  status: 'published',
  createdAt: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
  author: 'Администратор Системы',
  changeReason: 'Обновление весов согласно NADO PR V2.0',
  rules: [
    { id: 'r1', metric: 'verification', label: 'Верификация профиля', weight: 30 },
    { id: 'r2', metric: 'completeness', label: 'Заполненность портфолио', weight: 15 },
    { id: 'r3', metric: 'response_rate', label: 'Процент ответов', weight: 15 },
    { id: 'r4', metric: 'response_speed', label: 'Скорость ответа (SLA)', weight: 15 },
    { id: 'r5', metric: 'calendar_accuracy', label: 'Актуальность календаря', weight: 15 },
    { id: 'r6', metric: 'reviews_score', label: 'Оценки клиентов', weight: 10 }
  ]
};

export const defaultLegalTemplates: ContractTemplate[] = [
  {
    id: 'tmpl-mixed-rent-services',
    name: 'Смешанный договор аренды и услуг (Площадка)',
    description: 'Комплексный договор аренды пространства, банкетного обслуживания и звукового сопровождения.',
    category: 'venue',
    subcategory: 'mixed',
    status: 'legal_review',
    partyRoles: ['venue', 'client'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    currentVersionId: 'tmpl-v-1'
  },
  {
    id: 'tmpl-services-contractor',
    name: 'Договор на оказание услуг (Исполнитель)',
    description: 'Стандартное соглашение об оказании праздничных услуг (ведущий, диджей, фотограф).',
    category: 'contractor',
    status: 'legal_review',
    partyRoles: ['contractor', 'client'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    currentVersionId: 'tmpl-v-2'
  }
];

export const defaultLegalDocuments: LegalDocument[] = [
  {
    id: 'doc-user-agreement',
    key: 'user-agreement',
    title: 'Пользовательское соглашение',
    currentVersionId: 'v-user-1',
    status: 'published',
    versions: [
      {
        id: 'v-user-1',
        documentId: 'doc-user-agreement',
        version: '1.2',
        title: 'Пользовательское соглашение NADO ПРАЗДНИК',
        content: 'Это официальное пользовательское соглашение для платформы Event OS NADO ПРАЗДНИК. Платформа предоставляет демонстрационные и организационные инструменты...',
        summary: 'Основные правила использования платформы, защита прав сторон.',
        publishedAt: '2026-01-15T12:00:00Z',
        effectiveAt: '2026-01-20T00:00:00Z',
        status: 'published',
        author: 'Юридический Департамент',
        changeReason: 'Добавление положений о защищенных сделках.'
      }
    ]
  }
];

export function seedDatabase(storageAdapter: StorageAdapter, scenario: string) {
  setStorageAdapter(storageAdapter);
  clearDemoNamespace(storageAdapter);

  // Prepopulate standard config tables first
  if (!storage.getItem('nado_tariffs')) {
    storage.setItem('nado_tariffs', JSON.stringify(defaultTariffs));
  }
  if (!storage.getItem('nado_scoring_weights')) {
    storage.setItem('nado_scoring_weights', JSON.stringify(defaultScoringWeights));
  }
  if (!storage.getItem('nado_legal_templates')) {
    storage.setItem('nado_legal_templates', JSON.stringify(defaultLegalTemplates));
  }
  if (!storage.getItem('nado_legal')) {
    storage.setItem('nado_legal', JSON.stringify(defaultLegalDocuments));
  }

  // Create standard user profile
  const user: CanonicalUser = {
    id: 'demo-user-id',
    displayName: 'Константин Праздничный',
    firstName: 'Константин',
    lastName: 'Праздничный',
    avatarUrl: '',
    primaryEmail: 'demo@nado.io',
    primaryPhone: '+7(999) 123-45-67',
    emailVerified: true,
    phoneVerified: true,
    status: 'active',
    roles: ['client', 'contractor', 'organizer', 'venue_manager', 'administrator'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  storage.setItem('nado_user', JSON.stringify(user));

  // Initialize data structures based on scenario
  let events: EventProject[] = [];
  let contractors: ContractorProfile[] = [];
  let leads: CRMLead[] = [];
  let clients: CRMClient[] = [];
  let resources: CalendarResource[] = [];
  let slots: AvailabilitySlot[] = [];
  let bookings: Booking[] = [];
  let contracts: GeneratedContract[] = [];
  let disputes: DisputeCase[] = [];
  let notifications: NotificationReceipt[] = [];
  let auditLogs: AuditLog[] = [];

  // Seed standard base Contractor profiles to browse
  const baseContractors: ContractorProfile[] = [
    {
      id: 'demo-c-venue-loft',
      userId: 'user-c-1',
      category: 'venue',
      displayName: 'Демо-Площадка Loft Hall Ленинский',
      legalStatus: 'company',
      city: 'Москва',
      serviceRegions: ['Москва', 'Московская область'],
      description: 'Премиальное панорамное пространство для современных свадеб и корпоративов. Панорамный вид, изысканный интерьер.',
      startingPrice: 150000,
      priceUnit: 'день',
      verificationStatus: 'verified',
      profileCompleteness: 95,
      responseMetrics: {
        receivedAt: new Date().toISOString(),
        responseRatePercent: 100,
        unansweredCount: 0,
        overdueCount: 0,
        currentSlaStatus: 'normal'
      },
      reputation: {
        rating: 4.9,
        reviewsCount: 38,
        completedOrdersCount: 142,
        cancellationsCount: 1,
        disputesCount: 0
      },
      services: [
        { id: 'vs-1', name: 'Аренда главного зала Loft-4', description: 'Полный день аренды пространства до 120 гостей', price: 150000, unit: 'день' },
        { id: 'vs-2', name: 'Фуршетное обслуживание', description: 'Ресторанный кейтеринг на человека', price: 4500, unit: 'гость' }
      ],
      portfolio: [],
      documents: [],
      calendarResourceIds: ['res-loft-main', 'res-loft-small'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      demo: true
    },
    {
      id: 'demo-c-host-sokolov',
      userId: 'user-c-2',
      category: 'host',
      displayName: 'Демо-Ведущий Алексей Соколов',
      legalStatus: 'self_employed',
      city: 'Москва',
      serviceRegions: ['Москва'],
      description: 'Интеллигентный юмор, современные интерактивные шоу без пошлости. 7 лет в event-индустрии.',
      startingPrice: 85000,
      priceUnit: 'вечер',
      verificationStatus: 'verified',
      profileCompleteness: 100,
      responseMetrics: {
        receivedAt: new Date().toISOString(),
        responseRatePercent: 98,
        unansweredCount: 0,
        overdueCount: 0,
        currentSlaStatus: 'normal'
      },
      reputation: {
        rating: 5.0,
        reviewsCount: 54,
        completedOrdersCount: 210,
        cancellationsCount: 0,
        disputesCount: 0
      },
      services: [
        { id: 'hs-1', name: 'Ведение свадьбы или юбилея', description: '6 часов работы ведущего + разработка сценария', price: 85000, unit: 'вечер' }
      ],
      portfolio: [],
      documents: [],
      calendarResourceIds: ['res-host-sokolov'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      demo: true
    },
    {
      id: 'demo-c-dj-max',
      userId: 'user-c-3',
      category: 'dj',
      displayName: 'Демо-Диджей DJ Max',
      legalStatus: 'individual',
      city: 'Москва',
      serviceRegions: ['Москва', 'Московская область'],
      description: 'Профессиональный свадебный и клубный DJ со своим топовым звуковым и световым оборудованием.',
      startingPrice: 45000,
      priceUnit: 'вечер',
      verificationStatus: 'verified',
      profileCompleteness: 85,
      responseMetrics: {
        receivedAt: new Date().toISOString(),
        responseRatePercent: 92,
        unansweredCount: 1,
        overdueCount: 0,
        currentSlaStatus: 'normal'
      },
      reputation: {
        rating: 4.8,
        reviewsCount: 22,
        completedOrdersCount: 89,
        cancellationsCount: 2,
        disputesCount: 1
      },
      services: [
        { id: 'ds-1', name: 'DJ Сет на мероприятие', description: 'Работа на вашем оборудовании, до 6 часов', price: 30000, unit: 'вечер' },
        { id: 'ds-2', name: 'DJ Сет со звуком и светом', description: 'Работа + аренда звука 2кВт и базового света', price: 45000, unit: 'вечер' }
      ],
      portfolio: [],
      documents: [],
      calendarResourceIds: ['res-dj-max'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      demo: true
    }
  ];

  contractors = [...baseContractors];

  // Specific scenario definitions
  if (scenario === 'empty_client') {
    // Keep events empty, simple clean slate
  } 
  else if (scenario === 'event_created') {
    // 2. "Клиент создаёт мероприятие" (Wedding, planning status, 0% progress)
    const projId = 'demo-proj-created';
    events = [{
      id: projId,
      name: 'Свадьба Константина и Натальи',
      eventType: 'Wedding',
      city: 'Москва',
      address: '',
      date: '2026-09-18',
      time: '16:00',
      dateUnknown: false,
      guestsCount: 60,
      budgetRange: '500k-1m',
      budgetTotal: 800000,
      budgetPaid: 0,
      style: 'Классическая неоклассика',
      alreadyHave: [],
      neededServices: ['venue', 'host', 'dj', 'photographer'],
      planItems: [
        { id: 'p1', category: 'venue', title: 'Выбрать площадку', description: 'Подобрать ресторан или загородный клуб', required: true, order: 1, status: 'in_progress', route: '/catalog/venue' },
        { id: 'p2', category: 'host', title: 'Найти ведущего', description: 'Ведущий вечера с подходящей программой', required: true, order: 2, status: 'not_started', route: '/catalog/host' },
        { id: 'p3', category: 'dj', title: 'Забронировать диджея', description: 'Музыкальное сопровождение праздника', required: true, order: 3, status: 'not_started', route: '/catalog/dj' }
      ],
      tasks: [
        { id: 't1', title: 'Составить списки гостей', dueDate: '2026-08-01', isCompleted: false, category: 'guests' },
        { id: 't2', title: 'Выбрать концепцию и декор', dueDate: '2026-08-15', isCompleted: false, category: 'decorator' }
      ],
      budgetItems: [
        { id: 'b1', name: 'Аренда площадки', allocated: 350000, spent: 0, isPaid: false },
        { id: 'b2', name: 'Ведущий и DJ', allocated: 150000, spent: 0, isPaid: false }
      ],
      team: [],
      contractorRequests: [],
      bookings: [],
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'planning',
      progressPercent: 0
    }];
  } 
  else if (scenario === 'event_in_progress') {
    // 3. "Мероприятие собирается"
    const projId = 'demo-proj-assembling';
    
    const b1: Booking = {
      id: 'demo-b-venue',
      contractorId: 'demo-c-venue-loft',
      contractorName: 'Демо-Площадка Loft Hall Ленинский',
      contractorImage: '',
      date: '2026-09-18',
      startTime: '15:00',
      duration: 8,
      address: 'Москва, Ленинский проспект, 49',
      eventType: 'Свадьба',
      selectedService: 'Аренда главного зала Loft-4',
      price: 150000,
      prepayment: 50000,
      extraCosts: 0,
      comment: 'Нужен ранний заезд для декораторов',
      clientStatus: 'confirmed',
      contractorStatus: 'confirmed',
      createdAt: new Date().toISOString()
    };

    bookings = [b1];

    events = [{
      id: projId,
      name: 'Юбилей Константина 35 лет',
      eventType: 'Birthday',
      city: 'Москва',
      address: 'Лофт Ленинский 49',
      date: '2026-09-18',
      time: '17:00',
      dateUnknown: false,
      guestsCount: 45,
      budgetRange: '300k-500k',
      budgetTotal: 450000,
      budgetPaid: 50000,
      style: 'Мужской стильный лофт',
      alreadyHave: ['venue'],
      neededServices: ['host', 'dj', 'catering'],
      planItems: [
        { id: 'p1', category: 'venue', title: 'Выбрать площадку', description: 'Площадка забронирована', required: true, order: 1, status: 'booked', route: '/catalog/venue', bookingId: 'demo-b-venue' },
        { id: 'p2', category: 'host', title: 'Найти ведущего', description: 'Ведущий рассматривает запрос', required: true, order: 2, status: 'request_sent', route: '/catalog/host' },
        { id: 'p3', category: 'dj', title: 'Выбрать DJ', description: 'DJ не выбран', required: true, order: 3, status: 'not_started', route: '/catalog/dj' }
      ],
      tasks: [
        { id: 't1', title: 'Составить меню кейтеринга', dueDate: '2026-08-10', isCompleted: true, category: 'catering' },
        { id: 't2', title: 'Обсудить плейлист с DJ', dueDate: '2026-09-01', isCompleted: false, category: 'dj' }
      ],
      budgetItems: [
        { id: 'b1', name: 'Площадка Loft Hall', allocated: 250000, spent: 50000, isPaid: true },
        { id: 'b2', name: 'Кейтеринг на 45 человек', allocated: 120000, spent: 0, isPaid: false }
      ],
      team: ['demo-c-venue-loft'],
      contractorRequests: [{ id: 'req-host', contractorId: 'demo-c-host-sokolov', contractorName: 'Алексей Соколов', status: 'pending', sentAt: new Date().toISOString() }],
      bookings: [b1],
      messages: [{ id: 'm1', sender: 'system', senderName: 'Система', text: 'Заявка отправлена ведущему Алексею Соколову', timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'planning',
      progressPercent: 33
    }];
  } 
  else if (scenario === 'event_ready') {
    // 4. "Мероприятие почти готово" (90% progress, drinks saved, booked team)
    const projId = 'demo-proj-ready';
    
    const b1: Booking = {
      id: 'demo-b-venue',
      contractorId: 'demo-c-venue-loft',
      contractorName: 'Демо-Площадка Loft Hall Ленинский',
      contractorImage: '',
      date: '2026-09-18',
      startTime: '15:00',
      duration: 8,
      address: 'Москва, Ленинский проспект, 49',
      eventType: 'Wedding',
      selectedService: 'Аренда главного зала Loft-4',
      price: 150000,
      prepayment: 150000,
      extraCosts: 0,
      comment: '',
      clientStatus: 'confirmed',
      contractorStatus: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const b2: Booking = {
      id: 'demo-b-host',
      contractorId: 'demo-c-host-sokolov',
      contractorName: 'Демо-Ведущий Алексей Соколов',
      contractorImage: '',
      date: '2026-09-18',
      startTime: '17:00',
      duration: 6,
      address: 'Лофт Ленинский 49',
      eventType: 'Wedding',
      selectedService: 'Ведение свадьбы или юбилея',
      price: 85000,
      prepayment: 85000,
      extraCosts: 0,
      comment: '',
      clientStatus: 'confirmed',
      contractorStatus: 'confirmed',
      createdAt: new Date().toISOString()
    };

    bookings = [b1, b2];

    events = [{
      id: projId,
      name: 'Свадьба Константина и Натальи',
      eventType: 'Wedding',
      city: 'Москва',
      address: 'Лофт Ленинский 49',
      date: '2026-09-18',
      time: '16:00',
      dateUnknown: false,
      guestsCount: 50,
      budgetRange: '500k-1m',
      budgetTotal: 750000,
      budgetPaid: 235000,
      style: 'Рустик шик',
      alreadyHave: ['venue', 'host'],
      neededServices: [],
      planItems: [
        { id: 'p1', category: 'venue', title: 'Выбрать площадку', description: 'Площадка забронирована', required: true, order: 1, status: 'booked', route: '/catalog/venue', bookingId: 'demo-b-venue' },
        { id: 'p2', category: 'host', title: 'Найти ведущего', description: 'Алексей Соколов подтвержден', required: true, order: 2, status: 'booked', route: '/catalog/host', bookingId: 'demo-b-host' },
        { id: 'p3', category: 'drinks', title: 'Рассчитать напитки', description: 'Алкоголь и соки рассчитаны', required: true, order: 3, status: 'completed', route: '/drinks-calculator' }
      ],
      tasks: [
        { id: 't1', title: 'Отправить тайминги подрядчикам', dueDate: '2026-09-10', isCompleted: false, category: 'timeline' },
        { id: 't2', title: 'Подготовить схему рассадки гостей', dueDate: '2026-09-12', isCompleted: true, category: 'seating' }
      ],
      budgetItems: [
        { id: 'b1', name: 'Площадка Loft Hall', allocated: 250000, spent: 150000, isPaid: true },
        { id: 'b2', name: 'Ведущий Алексей Соколов', allocated: 85000, spent: 85000, isPaid: true },
        { id: 'b3', name: 'Калькуляция алкоголя', allocated: 60000, spent: 0, isPaid: false }
      ],
      team: ['demo-c-venue-loft', 'demo-c-host-sokolov'],
      contractorRequests: [],
      bookings: [b1, b2],
      drinksCalculation: {
        totalPrice: 42000,
        corkFeeTotal: 0,
        totalWithCork: 42000,
        savedDrinksList: [
          { id: 'd1', name: 'Красное вино сухое', category: 'wine', bottles: 25, liters: 18.75 },
          { id: 'd2', name: 'Водка', category: 'strong', bottles: 12, liters: 6 },
          { id: 'd3', name: 'Вода без газа', category: 'soft', bottles: 40, liters: 20 }
        ]
      },
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      progressPercent: 90
    }];
  } 
  else if (scenario === 'contractor') {
    // 5. "Исполнитель с новыми заявками" (SLA countdown)
    const leadId = 'lead-new-sla';
    const now = new Date();
    
    leads = [
      {
        id: leadId,
        eventType: 'Свадьба',
        eventDate: '2026-10-12',
        city: 'Москва',
        guestsCount: 70,
        budget: 120000,
        requestedCategory: 'host',
        clientName: 'Наталья Котова',
        maskedContact: 'Ната*** +7(916)***-**-33',
        source: 'Каталог NADO',
        readiness: 'high',
        urgency: 'hot',
        requirements: 'Нужна современная программа без стихов, интеллигентное ведение, легкий юмор.',
        createdAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        pipelineStage: 'needs_reply',
        probability: 70,
        tags: ['Свадьба', 'Премиум']
      }
    ];

    clients = [
      {
        id: 'client-natalia',
        name: 'Наталья Котова',
        phone: '+7(916) 111-22-33',
        email: 'nat@mail.ru',
        contactChannel: 'Telegram',
        projectsCount: 1,
        totalSpent: 0,
        activeDisputesCount: 0,
        createdAt: new Date().toISOString(),
        notes: 'Очень требовательный клиент, любит внимание к деталям.',
        tags: ['Новый', 'Wedding']
      }
    ];

    // Calendar blocks for Contractor
    resources = [
      { id: 'res-host-sokolov', ownerId: 'demo-user-id', name: 'Алексей Соколов (Основной)', type: 'staff' }
    ];

    slots = [
      {
        id: 'slot-b-1',
        ownerId: 'demo-user-id',
        resourceId: 'res-host-sokolov',
        startAt: '2026-10-12',
        endAt: '2026-10-12',
        status: 'hold',
        source: 'system',
        holdExpiresAt: new Date(now.getTime() + 35 * 60 * 1000).toISOString(), // Hold expires in 35 min
        notes: 'Бронь по SLA-заявке Наталья Котова',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  } 
  else if (scenario === 'contractor_expired') {
    // 6. "Исполнитель с просроченным ответом"
    const leadId = 'lead-expired-sla';
    const now = new Date();
    
    leads = [
      {
        id: leadId,
        eventType: 'Корпоратив',
        eventDate: '2026-09-05',
        city: 'Москва',
        guestsCount: 120,
        budget: 150000,
        requestedCategory: 'host',
        clientName: 'Игорь Петрович (HR)',
        maskedContact: 'Иго*** +7(903)***-**-88',
        source: 'Форма сайта',
        readiness: 'medium',
        urgency: 'cold',
        requirements: 'Корпоративное мероприятие ИТ-компании, 10 лет на рынке.',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (SLA expired)
        firstViewedAt: new Date(now.getTime() - 110 * 60 * 1000).toISOString(),
        pipelineStage: 'needs_reply',
        probability: 30,
        tags: ['Корпоратив']
      }
    ];
  } 
  else if (scenario === 'contractor_high_score') {
    // 7. "Исполнитель с высоким скорингом"
    const scoreBreakdown = {
      verificationScore: 30,
      profileCompletenessScore: 15,
      availabilityAccuracyScore: 15,
      responseSpeedScore: 15,
      responseRateScore: 15,
      completionRateScore: 10,
      cancellationScore: 0,
      disputeScore: 0,
      reviewScore: 10,
      documentScore: 10,
      finalScore: 98,
      calculatedAt: new Date().toISOString(),
      scoringVersionId: 'sv-1'
    };

    storage.setItem('nado_contractor_score_demo-c-host-sokolov', JSON.stringify({
      contractorId: 'demo-c-host-sokolov',
      finalScore: 98,
      breakdown: scoreBreakdown,
      rankingWeight: 1.2
    }));
  } 
  else if (scenario === 'contractor_low_calendar') {
    // 8. "Исполнитель с низкой актуальностью календаря" (penalty)
    const scoreBreakdown = {
      verificationScore: 30,
      profileCompletenessScore: 12,
      availabilityAccuracyScore: 3, // penalty due to double bookings or low accuracy
      responseSpeedScore: 11,
      responseRateScore: 10,
      completionRateScore: 8,
      cancellationScore: -10, // Cancellation penalty
      disputeScore: -5, // Dispute penalty
      reviewScore: 7,
      documentScore: 5,
      finalScore: 61,
      calculatedAt: new Date().toISOString(),
      scoringVersionId: 'sv-1'
    };

    storage.setItem('nado_contractor_score_demo-c-dj-max', JSON.stringify({
      contractorId: 'demo-c-dj-max',
      finalScore: 61,
      breakdown: scoreBreakdown,
      rankingWeight: 0.7
    }));
  } 
  else if (scenario === 'organizer') {
    // 9. "Организатор с несколькими проектами"
    events = [
      {
        id: 'org-proj-1',
        name: 'Свадьба Павла и Анны',
        eventType: 'Wedding',
        city: 'Москва',
        address: 'Усадьба Роден',
        date: '2026-08-20',
        time: '16:00',
        dateUnknown: false,
        guestsCount: 80,
        budgetRange: '1.5m-3m',
        budgetTotal: 2000000,
        budgetPaid: 1500000,
        style: 'Бохо шик',
        alreadyHave: [],
        neededServices: [],
        planItems: [],
        tasks: [],
        budgetItems: [],
        team: [],
        contractorRequests: [],
        bookings: [],
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        progressPercent: 75
      },
      {
        id: 'org-proj-2',
        name: 'Новый год Газпромбанк',
        eventType: 'Corporate',
        city: 'Москва',
        address: 'Крокус Сити Холл',
        date: '2026-12-25',
        time: '19:00',
        dateUnknown: false,
        guestsCount: 400,
        budgetRange: '5m+',
        budgetTotal: 8000000,
        budgetPaid: 4000000,
        style: 'Киберпанк сказка',
        alreadyHave: [],
        neededServices: [],
        planItems: [],
        tasks: [],
        budgetItems: [],
        team: [],
        contractorRequests: [],
        bookings: [],
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'planning',
        progressPercent: 30
      }
    ];
  } 
  else if (scenario === 'venue') {
    // 10. "Площадка с несколькими залами"
    resources = [
      { id: 'res-loft-main', ownerId: 'demo-user-id', name: 'Главный зал Loft-1', type: 'space', capacity: 150 },
      { id: 'res-loft-small', ownerId: 'demo-user-id', name: 'Малый лофт Loft-2', type: 'space', capacity: 45 }
    ];

    slots = [
      {
        id: 'v-slot-1',
        ownerId: 'demo-user-id',
        resourceId: 'res-loft-main',
        startAt: '2026-09-18',
        endAt: '2026-09-18',
        status: 'booked',
        source: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'v-slot-2',
        ownerId: 'demo-user-id',
        resourceId: 'res-loft-small',
        startAt: '2026-09-19',
        endAt: '2026-09-19',
        status: 'hold',
        source: 'system',
        holdExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        notes: 'Бронь на День Рождения Марины',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  } 
  else if (scenario === 'venue_conflict') {
    // 11. "Площадка с конфликтом дат"
    resources = [
      { id: 'res-loft-main', ownerId: 'demo-user-id', name: 'Главный зал Loft-1', type: 'space', capacity: 150 }
    ];

    slots = [
      {
        id: 'v-conflict-1',
        ownerId: 'demo-user-id',
        resourceId: 'res-loft-main',
        startAt: '2026-09-18',
        endAt: '2026-09-18',
        status: 'booked',
        source: 'system',
        notes: 'Подтвержденный банкет Свадьба Михаила',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'v-conflict-2',
        ownerId: 'demo-user-id',
        resourceId: 'res-loft-main',
        startAt: '2026-09-18',
        endAt: '2026-09-18',
        status: 'tentative',
        source: 'direct',
        notes: 'Резервная заявка Корпоратив Яндекс',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  } 
  else if (scenario === 'admin_scoring') {
    // 12. "Администратор скоринга" (weights & history logs)
    auditLogs = [
      {
        id: 'audit-1',
        actorId: 'demo-user-id',
        actorRole: 'administrator',
        action: 'UPDATE_SCORING_WEIGHTS',
        entityType: 'scoring',
        entityId: 'sv-1',
        oldValue: 'weight_response_speed: 10',
        newValue: 'weight_response_speed: 15',
        reason: 'Приоритет быстрого SLA для заявок',
        createdAt: new Date().toISOString()
      }
    ];
  } 
  else if (scenario === 'admin_contracts') {
    // 13. "Администратор договоров" (legal templates & versions)
    auditLogs = [
      {
        id: 'audit-2',
        actorId: 'demo-user-id',
        actorRole: 'administrator',
        action: 'APPROVE_CONTRACT_TEMPLATE',
        entityType: 'contract',
        entityId: 'tmpl-services-contractor',
        oldValue: 'status: legal_review',
        newValue: 'status: approved',
        reason: 'Юридический анализ завершен успешно',
        createdAt: new Date().toISOString()
      }
    ];
  } 
  else if (scenario === 'order_dispute') {
    // 14. "Спор по заказу"
    const orderId = 'demo-b-disputed';
    bookings = [
      {
        id: orderId,
        contractorId: 'demo-c-dj-max',
        contractorName: 'Демо-Диджей DJ Max',
        contractorImage: '',
        date: '2026-07-05',
        startTime: '18:00',
        duration: 5,
        address: 'Ресторан Чайка',
        eventType: 'Выпускной',
        selectedService: 'DJ Сет со звуком и светом',
        price: 45000,
        prepayment: 15000,
        extraCosts: 0,
        comment: '',
        clientStatus: 'confirmed',
        contractorStatus: 'confirmed',
        createdAt: new Date().toISOString()
      }
    ];

    disputes = [
      {
        id: 'dispute-1',
        orderId: orderId,
        bookingId: orderId,
        type: 'quality_dispute',
        reason: 'Диджей опоздал на 2 часа и не привез световое оборудование',
        description: 'Мероприятие началось в 18:00, музыка заиграла только в 20:15. Световых приборов не было вообще. Требуем полный возврат предоплаты.',
        desiredResolution: 'Полный возврат предоплаты 15 000 руб и компенсация морального вреда.',
        files: ['check_receipt.png', 'photo_empty_stage.jpg'],
        status: 'under_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  } 
  else if (scenario === 'contract_versions') {
    // 15. "Новая версия договора" (comparison of prices)
    const contractId = 'c-versioned-demo';
    contracts = [
      {
        id: contractId,
        templateId: 'tmpl-services-contractor',
        templateName: 'Договор на оказание услуг (Исполнитель)',
        orderId: 'demo-b-host',
        clientId: 'demo-user-id',
        clientName: 'Константин Праздничный',
        contractorId: 'demo-c-host-sokolov',
        contractorName: 'Демо-Ведущий Алексей Соколов',
        status: 'ready_for_review',
        currentVersion: 2,
        variableValues: {
          'client_name': 'Константин Праздничный',
          'contractor_name': 'Алексей Соколов',
          'price': '85000',
          'prepayment': '45000',
          'cancellation_terms': 'Бесплатно за 14 дней'
        },
        fullText: 'ДОГОВОР №109\nИсполнитель Алексей Соколов обязуется провести мероприятие Свадьба. Стоимость услуг составляет 85 000 рублей. Предоплата составляет 45 000 рублей.',
        attachments: [],
        confirmations: [],
        auditLog: [
          { id: 'ca-1', contractId, actorId: 'demo-c-host-sokolov', actorRole: 'contractor', action: 'CREATE_VERSION', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), details: 'Создание черновика договора с базовой стоимостью 80 000 руб.' },
          { id: 'ca-2', contractId, actorId: 'demo-c-host-sokolov', actorRole: 'contractor', action: 'UPDATE_VERSION', timestamp: new Date().toISOString(), details: 'Повышение стоимости до 85 000 руб в связи с добавлением блока викторины.' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  // Persist structured mock database to localStorage
  storage.setItem('nado_events', JSON.stringify(events));
  storage.setItem('nado_contractors', JSON.stringify(contractors));
  storage.setItem('nado_leads', JSON.stringify(leads));
  storage.setItem('nado_clients', JSON.stringify(clients));
  storage.setItem('nado_calendar_resources', JSON.stringify(resources));
  storage.setItem('nado_calendar_slots', JSON.stringify(slots));
  storage.setItem('nado_orders', JSON.stringify(bookings));
  storage.setItem('nado_contracts', JSON.stringify(contracts));
  storage.setItem('nado_disputes', JSON.stringify(disputes));
  storage.setItem('nado_notifications', JSON.stringify(notifications));
  storage.setItem('nado_audit_logs', JSON.stringify(auditLogs));
}

// Helper to load collection safely
function loadCollection<T>(key: string): T[] {
  const data = storage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Helper to save collection safely
function saveCollection<T>(key: string, data: T[]): void {
  storage.setItem(key, JSON.stringify(data));
}

// -------------------------------------------------------------
// IMPLEMENTATIONS
// -------------------------------------------------------------

export class DemoUserRepository implements UserRepository {
  async getUser(id: string): Promise<CanonicalUser | null> {
    const user = storage.getItem('nado_user');
    return user ? JSON.parse(user) : null;
  }
  async saveUser(user: CanonicalUser): Promise<void> {
    storage.setItem('nado_user', JSON.stringify(user));
  }
  async getCurrentUser(): Promise<CanonicalUser | null> {
    return this.getUser('demo-user-id');
  }
}

export class DemoContractorRepository implements ContractorRepository {
  async getProfile(id: string): Promise<ContractorProfile | null> {
    const list = loadCollection<ContractorProfile>('nado_contractors');
    return list.find(c => c.id === id) || null;
  }
  async getProfileByUserId(userId: string): Promise<ContractorProfile | null> {
    const list = loadCollection<ContractorProfile>('nado_contractors');
    return list.find(c => c.userId === userId) || null;
  }
  async saveProfile(profile: ContractorProfile): Promise<void> {
    const list = loadCollection<ContractorProfile>('nado_contractors');
    const index = list.findIndex(c => c.id === profile.id);
    if (index >= 0) {
      list[index] = profile;
    } else {
      list.push(profile);
    }
    saveCollection('nado_contractors', list);
  }
  async listProfiles(category?: string, city?: string): Promise<ContractorProfile[]> {
    let list = loadCollection<ContractorProfile>('nado_contractors');
    if (category) {
      list = list.filter(c => c.category === category);
    }
    if (city) {
      list = list.filter(c => c.city.toLowerCase() === city.toLowerCase());
    }
    return list;
  }
}

export class DemoVenueRepository implements VenueRepository {
  async getVenueSpaces(venueId: string): Promise<any[]> {
    const allResources = loadCollection<CalendarResource>('nado_calendar_resources');
    return allResources.filter(r => r.ownerId === venueId && r.type === 'space');
  }
  async getVenuePackages(venueId: string): Promise<any[]> {
    const profile = await new DemoContractorRepository().getProfile(venueId);
    return profile?.services ?? [];
  }
  async saveVenueSpace(venueId: string, space: any): Promise<void> {
    const allResources = loadCollection<CalendarResource>('nado_calendar_resources');
    const existingIndex = allResources.findIndex(r => r.id === space.id);
    const resource: CalendarResource = {
      id: space.id || `res-${Date.now()}`,
      ownerId: venueId,
      name: space.name,
      type: 'space',
      capacity: space.capacity
    };
    if (existingIndex >= 0) {
      allResources[existingIndex] = resource;
    } else {
      allResources.push(resource);
    }
    saveCollection('nado_calendar_resources', allResources);
  }
  async saveVenuePackage(venueId: string, pkg: any): Promise<void> {
    const repo = new DemoContractorRepository();
    const profile = await repo.getProfile(venueId);
    if (profile) {
      const services = profile.services ?? [];
      profile.services = services;
      const idx = profile.services.findIndex(s => s.id === pkg.id);
      if (idx >= 0) {
        profile.services[idx] = pkg;
      } else {
        profile.services.push(pkg);
      }
      await repo.saveProfile(profile);
    }
  }
}

export class DemoEventRepository implements EventRepository {
  async getEvent(id: string): Promise<EventProject | null> {
    const list = loadCollection<EventProject>('nado_events');
    return list.find(e => e.id === id) || null;
  }
  async listEvents(filter?: EventFilterOptions): Promise<EventProject[]> {
    let list = loadCollection<EventProject>('nado_events');
    if (filter) {
      if (filter.ownerUserId) {
        list = list.filter(e => e.ownerUserId === filter.ownerUserId || e.team?.includes(filter.ownerUserId!));
      }
      if (filter.clientId) {
        list = list.filter(e => e.clientId === filter.clientId);
      }
      if (filter.status) {
        list = list.filter(e => e.status === filter.status);
      }
    }
    return list;
  }
  async saveEvent(event: EventProject): Promise<void> {
    const list = loadCollection<EventProject>('nado_events');
    const index = list.findIndex(e => e.id === event.id);
    if (index >= 0) {
      list[index] = event;
    } else {
      list.push(event);
    }
    saveCollection('nado_events', list);
  }
  async deleteEvent(id: string): Promise<void> {
    const list = loadCollection<EventProject>('nado_events');
    const filtered = list.filter(e => e.id !== id);
    saveCollection('nado_events', filtered);
  }
}

export class DemoLeadRepository implements LeadRepository {
  async getLead(id: string): Promise<CRMLead | null> {
    const list = loadCollection<CRMLead>('nado_leads');
    return list.find(l => l.id === id) || null;
  }
  async listLeads(contractorId: string): Promise<CRMLead[]> {
    return loadCollection<CRMLead>('nado_leads');
  }
  async saveLead(lead: CRMLead): Promise<void> {
    const list = loadCollection<CRMLead>('nado_leads');
    const index = list.findIndex(l => l.id === lead.id);
    if (index >= 0) {
      list[index] = lead;
    } else {
      list.push(lead);
    }
    saveCollection('nado_leads', list);
  }
}

export class DemoClientRepository implements ClientRepository {
  async getClient(id: string): Promise<CRMClient | null> {
    const list = loadCollection<CRMClient>('nado_clients');
    return list.find(c => c.id === id) || null;
  }
  async listClients(contractorId: string): Promise<CRMClient[]> {
    return loadCollection<CRMClient>('nado_clients');
  }
  async saveClient(client: CRMClient): Promise<void> {
    const list = loadCollection<CRMClient>('nado_clients');
    const index = list.findIndex(c => c.id === client.id);
    if (index >= 0) {
      list[index] = client;
    } else {
      list.push(client);
    }
    saveCollection('nado_clients', list);
  }
}

export class DemoCalendarRepository implements CalendarRepository {
  async getResources(ownerId: string): Promise<CalendarResource[]> {
    const list = loadCollection<CalendarResource>('nado_calendar_resources');
    return list.filter(r => r.ownerId === ownerId);
  }
  async saveResource(resource: CalendarResource): Promise<void> {
    const list = loadCollection<CalendarResource>('nado_calendar_resources');
    const index = list.findIndex(r => r.id === resource.id);
    if (index >= 0) {
      list[index] = resource;
    } else {
      list.push(resource);
    }
    saveCollection('nado_calendar_resources', list);
  }
  async getSlots(resourceId: string): Promise<AvailabilitySlot[]> {
    const list = loadCollection<AvailabilitySlot>('nado_calendar_slots');
    return list.filter(s => s.resourceId === resourceId);
  }
  async getAllSlots(ownerId: string): Promise<AvailabilitySlot[]> {
    const list = loadCollection<AvailabilitySlot>('nado_calendar_slots');
    return list.filter(s => s.ownerId === ownerId);
  }
  async saveSlot(slot: AvailabilitySlot): Promise<void> {
    const list = loadCollection<AvailabilitySlot>('nado_calendar_slots');
    const index = list.findIndex(s => s.id === slot.id);
    if (index >= 0) {
      list[index] = slot;
    } else {
      list.push(slot);
    }
    saveCollection('nado_calendar_slots', list);
  }
  async deleteSlot(id: string): Promise<void> {
    const list = loadCollection<AvailabilitySlot>('nado_calendar_slots');
    const filtered = list.filter(s => s.id !== id);
    saveCollection('nado_calendar_slots', filtered);
  }
}

export class DemoOrderRepository implements OrderRepository {
  async getOrder(id: string): Promise<Booking | null> {
    const list = loadCollection<Booking>('nado_orders');
    return list.find(o => o.id === id) || null;
  }
  async listOrders(filter?: OrderFilterOptions): Promise<Booking[]> {
    let list = loadCollection<Booking>('nado_orders');
    if (filter) {
      if (filter.userId) {
        list = list.filter(o => o.contractorId === filter.userId || o.clientId === filter.userId);
      }
      if (filter.eventId) {
        list = list.filter(o => o.eventId === filter.eventId);
      }
      if (filter.contractorId) {
        list = list.filter(o => o.contractorId === filter.contractorId);
      }
      if (filter.status) {
        list = list.filter(o => o.clientStatus === filter.status || o.contractorStatus === filter.status);
      }
    }
    return list;
  }
  async saveOrder(order: Booking): Promise<void> {
    const list = loadCollection<Booking>('nado_orders');
    const index = list.findIndex(o => o.id === order.id);
    if (index >= 0) {
      list[index] = order;
    } else {
      list.push(order);
    }
    saveCollection('nado_orders', list);
  }
}

const inMemoryExternalParties: ExternalContractParty[] = [];

export class DemoPartyRepository implements ContractPartyRepository {
  async listClients(): Promise<ContractPartyOption[]> {
    const externalList = loadCollection<ExternalContractParty>('nado_external_parties');
    const extClients: ContractPartyOption[] = externalList
      .filter(p => p.role === 'client')
      .map(p => ({
        id: p.id,
        name: p.name,
        partyId: p.id,
        userId: undefined,
        entityId: p.id,
        displayName: p.displayName || p.name,
        role: 'client',
        isExternal: true,
        legalStatus: p.legalStatus || 'individual',
        email: p.email,
        phone: p.phone,
        taxId: p.taxId,
        requisites: p.requisites
      }));

    return [
      { id: 'demo-client-user', name: 'Демонстрационный клиент', partyId: 'demo-client-user', userId: 'demo-client-user', entityId: 'demo-client-user', displayName: 'Демонстрационный клиент', role: 'client', isExternal: false, email: 'client@demo.nado.ru', phone: '+7 (999) 000-00-01' },
      { id: 'usr-client-1', name: 'Демонстрационный заказчик #2', partyId: 'usr-client-1', userId: 'usr-client-1', entityId: 'usr-client-1', displayName: 'Демонстрационный заказчик #2', role: 'client', isExternal: false, email: 'client2@example.com', phone: '+7 (999) 111-22-33' },
      ...extClients
    ];
  }

  async listContractors(): Promise<ContractPartyOption[]> {
    const externalList = loadCollection<ExternalContractParty>('nado_external_parties');
    const extContractors: ContractPartyOption[] = externalList
      .filter(p => p.role === 'contractor')
      .map(p => ({
        id: p.id,
        name: p.name,
        partyId: p.id,
        userId: undefined,
        entityId: p.id,
        displayName: p.displayName || p.name,
        role: 'contractor',
        isExternal: true,
        legalStatus: p.legalStatus,
        email: p.email,
        phone: p.phone,
        taxId: p.taxId,
        bankDetails: p.bankDetails,
        contactPerson: p.contactPerson,
        requisites: p.requisites
      }));

    return [
      { id: 'demo-contractor-host', name: 'Демо-Ведущий Алексей Соколов', partyId: 'demo-contractor-host', userId: 'demo-contractor-host', entityId: 'demo-c-host-sokolov', displayName: 'Демо-Ведущий Алексей Соколов', role: 'contractor', isExternal: false, email: 'host@demo.nado.ru', phone: '+7 (999) 222-33-44' },
      { id: 'demo-contractor-dj', name: 'Демо-Диджей DJ Max', partyId: 'demo-contractor-dj', userId: 'demo-contractor-dj', entityId: 'demo-c-dj-max', displayName: 'Демо-Диджей DJ Max', role: 'contractor', isExternal: false, email: 'dj@demo.nado.ru', phone: '+7 (999) 333-44-55' },
      { id: 'demo-c-host-kava', name: 'MC KAVA (Ведущий)', partyId: 'demo-contractor-host', userId: 'demo-contractor-host', entityId: 'demo-c-host-kava', displayName: 'MC KAVA (Ведущий)', role: 'contractor', isExternal: false, email: 'kava@demo.nado.ru' },
      ...extContractors
    ];
  }

  async listVenues(): Promise<ContractPartyOption[]> {
    const externalList = loadCollection<ExternalContractParty>('nado_external_parties');
    const extVenues: ContractPartyOption[] = externalList
      .filter(p => p.role === 'venue')
      .map(p => ({
        id: p.id,
        name: p.name,
        partyId: p.id,
        userId: undefined,
        entityId: p.id,
        displayName: p.displayName || p.name,
        role: 'venue',
        isExternal: true,
        legalStatus: p.legalStatus,
        email: p.email,
        phone: p.phone,
        taxId: p.taxId,
        bankDetails: p.bankDetails,
        contactPerson: p.contactPerson,
        requisites: p.requisites
      }));

    return [
      { id: 'demo-venue-user', name: 'ООО "Лофт Ленинский"', partyId: 'demo-venue-user', userId: 'demo-venue-user', entityId: 'demo-c-venue-loft', displayName: 'ООО "Лофт Ленинский"', role: 'venue', isExternal: false, email: 'venue@demo.nado.ru' },
      { id: 'demo-v-roden', name: 'Усадьба Роден', partyId: 'demo-venue-user', userId: 'demo-venue-user', entityId: 'demo-v-roden', displayName: 'Усадьба Роден', role: 'venue', isExternal: false, email: 'roden@demo.nado.ru' },
      ...extVenues
    ];
  }

  async listOrganizers(): Promise<ContractPartyOption[]> {
    const externalList = loadCollection<ExternalContractParty>('nado_external_parties');
    const extOrganizers: ContractPartyOption[] = externalList
      .filter(p => p.role === 'organizer')
      .map(p => ({
        id: p.id,
        name: p.name,
        partyId: p.id,
        userId: undefined,
        entityId: p.id,
        displayName: p.displayName || p.name,
        role: 'organizer',
        isExternal: true,
        legalStatus: p.legalStatus,
        email: p.email,
        phone: p.phone,
        taxId: p.taxId,
        bankDetails: p.bankDetails,
        contactPerson: p.contactPerson,
        requisites: p.requisites
      }));

    return [
      { id: 'demo-organizer-user', name: 'Демонстрационный организатор', partyId: 'demo-organizer-user', userId: 'demo-organizer-user', entityId: 'usr-organizer-1', displayName: 'Демонстрационный организатор', role: 'organizer', isExternal: false, email: 'organizer@demo.nado.ru' },
      ...extOrganizers
    ];
  }

  async getParty(id: string): Promise<ContractPartyOption | null> {
    const externalList = loadCollection<ExternalContractParty>('nado_external_parties');
    const ext = externalList.find(p => p.id === id) || inMemoryExternalParties.find(p => p.id === id);
    if (ext) {
      return { id: ext.id, name: ext.name, partyId: ext.id, userId: undefined, entityId: ext.id, displayName: ext.displayName || ext.name, role: ext.role, isExternal: true, legalStatus: ext.legalStatus, email: ext.email, phone: ext.phone, taxId: ext.taxId, bankDetails: ext.bankDetails, contactPerson: ext.contactPerson, requisites: ext.requisites };
    }
    const clients = await this.listClients();
    const client = clients.find(c => c.id === id || c.partyId === id);
    if (client) return client;

    const contractors = await this.listContractors();
    const contractor = contractors.find(c => c.id === id || c.partyId === id);
    if (contractor) return contractor;

    const venues = await this.listVenues();
    const venue = venues.find(v => v.id === id || v.partyId === id);
    if (venue) return venue;

    const organizers = await this.listOrganizers();
    const organizer = organizers.find(o => o.id === id || o.partyId === id);
    if (organizer) return organizer;

    return null;
  }

  async createExternalParty(party: Partial<ExternalContractParty> & { name: string; role: 'client' | 'contractor' | 'venue' | 'organizer' }): Promise<ContractPartyOption> {
    const externalList = loadCollection<ExternalContractParty>('nado_external_parties');
    const newId = generateUUID();
    const newParty: ExternalContractParty = {
      id: party.id || newId,
      name: party.name,
      displayName: party.displayName || party.name,
      role: party.role,
      legalStatus: party.legalStatus || 'individual',
      taxId: party.taxId,
      legalAddress: party.legalAddress,
      bankDetails: party.bankDetails,
      requisites: party.requisites,
      email: party.email,
      phone: party.phone,
      contactPerson: party.contactPerson,
      isExternal: true,
      createdAt: party.createdAt || new Date().toISOString()
    };
    externalList.push(newParty);
    saveCollection('nado_external_parties', externalList);
    inMemoryExternalParties.push(newParty);

    return {
      id: newParty.id,
      name: newParty.name,
      partyId: newParty.id,
      userId: undefined,
      entityId: newParty.id,
      displayName: newParty.displayName || newParty.name,
      role: newParty.role,
      isExternal: true,
      legalStatus: newParty.legalStatus,
      email: newParty.email,
      phone: newParty.phone,
      taxId: newParty.taxId,
      bankDetails: newParty.bankDetails,
      contactPerson: newParty.contactPerson,
      requisites: newParty.requisites
    };
  }
}

import { DemoContractRepository } from '../features/contracts/repositories/DemoContractRepository';
export { DemoContractRepository };

export class DemoDocumentRepository implements DocumentRepository {
  async getLegalDocument(key: string): Promise<LegalDocument | null> {
    const list = loadCollection<LegalDocument>('nado_legal');
    return list.find(d => d.key === key) || null;
  }
  async listLegalDocuments(): Promise<LegalDocument[]> {
    return loadCollection<LegalDocument>('nado_legal');
  }
  async saveLegalDocument(doc: LegalDocument): Promise<void> {
    const list = loadCollection<LegalDocument>('nado_legal');
    const idx = list.findIndex(d => d.id === doc.id);
    if (idx >= 0) {
      list[idx] = doc;
    } else {
      list.push(doc);
    }
    saveCollection('nado_legal', list);
  }
}

export class DemoAnalyticsRepository implements AnalyticsRepository {
  async getContractorAnalytics(contractorId: string): Promise<any> {
    return {
      revenueTotal: 340000,
      revenuePending: 85000,
      viewsCount: 1420,
      conversionRatePercent: 8.4,
      leadsCount: 34,
      dealsClosedCount: 12,
      responseSpeedSeconds: 1080 // 18 minutes average
    };
  }
  async getVenueAnalytics(venueId: string): Promise<any> {
    return {
      occupancyPercent: 68,
      revenueTotal: 1250000,
      averageTicket: 180000,
      inquiriesCount: 110,
      bookingsCount: 24
    };
  }
  async getPlatformAnalytics(): Promise<any> {
    return {
      usersCount: 840,
      contractorsCount: 124,
      eventsCount: 310,
      volumeTotal: 8400000,
      commissionsTotal: 620000,
      disputesActiveCount: 1
    };
  }
}

export class DemoScoringRepository implements ScoringRepository {
  async getScoringWeights(): Promise<ScoringRuleVersion | null> {
    const data = storage.getItem('nado_scoring_weights');
    return data ? JSON.parse(data) : null;
  }
  async saveScoringWeights(weights: ScoringRuleVersion): Promise<void> {
    storage.setItem('nado_scoring_weights', JSON.stringify(weights));
  }
  async getScoringWeightsHistory(): Promise<ScoringRuleVersion[]> {
    const current = await this.getScoringWeights();
    return current ? [current] : [];
  }
  async getContractorScore(contractorId: string): Promise<ContractorScore | null> {
    const custom = storage.getItem(`nado_contractor_score_${contractorId}`);
    if (custom) return JSON.parse(custom);

    // Dynamic calc or default high
    return {
      contractorId,
      finalScore: 92,
      breakdown: {
        verificationScore: 30,
        profileCompletenessScore: 14,
        availabilityAccuracyScore: 15,
        responseSpeedScore: 13,
        responseRateScore: 13,
        completionRateScore: 10,
        cancellationScore: 0,
        disputeScore: 0,
        reviewScore: 9,
        documentScore: 8,
        finalScore: 92,
        calculatedAt: new Date().toISOString(),
        scoringVersionId: 'sv-1'
      },
      rankingWeight: 1.1
    };
  }
  async saveContractorScore(score: ContractorScore): Promise<void> {
    storage.setItem(`nado_contractor_score_${score.contractorId}`, JSON.stringify(score));
  }
  async getScoreHistory(contractorId: string): Promise<any[]> {
    return [
      { id: 'sh-1', contractorId, oldScore: 88, newScore: 92, reason: 'Подтверждено портфолио', timestamp: new Date().toISOString() }
    ];
  }
  async addScoreHistory(entry: any): Promise<void> {
    // Demo placeholder
  }
}

export class DemoTariffRepository implements TariffRepository {
  async getTariffs(): Promise<Tariff[]> {
    return loadCollection<Tariff>('nado_tariffs');
  }
  async getTariffAssignment(userId: string): Promise<TariffAssignment | null> {
    const data = storage.getItem(`nado_tariff_assign_${userId}`);
    return data ? JSON.parse(data) : {
      id: 'ta-pro',
      userId,
      tariffId: 't-pro',
      tariffName: 'PRO',
      activatedAt: new Date().toISOString(),
      status: 'active'
    };
  }
  async assignTariff(userId: string, tariffId: string): Promise<TariffAssignment> {
    const tariffs = await this.getTariffs();
    const tariff = tariffs.find(t => t.id === tariffId) || tariffs[0];
    const assign: TariffAssignment = {
      id: `ta-${Date.now()}`,
      userId,
      tariffId: tariff.id,
      tariffName: tariff.name,
      activatedAt: new Date().toISOString(),
      status: 'active'
    };
    storage.setItem(`nado_tariff_assign_${userId}`, JSON.stringify(assign));
    return assign;
  }
  async saveTariffConfig(tariffs: Tariff[]): Promise<void> {
    saveCollection('nado_tariffs', tariffs);
  }
}

export class DemoNotificationRepository implements NotificationRepository {
  async getNotifications(userId: string): Promise<NotificationReceipt[]> {
    return loadCollection<NotificationReceipt>('nado_notifications');
  }
  async saveNotification(notification: NotificationReceipt): Promise<void> {
    const list = loadCollection<NotificationReceipt>('nado_notifications');
    list.push(notification);
    saveCollection('nado_notifications', list);
  }
  async markAsRead(id: string): Promise<void> {
    const list = loadCollection<NotificationReceipt>('nado_notifications');
    const item = list.find(n => n.id === id);
    if (item) {
      item.openedAt = new Date().toISOString();
      saveCollection('nado_notifications', list);
    }
  }
}

export class DemoDisputeRepository implements DisputeRepository {
  async getDispute(id: string): Promise<DisputeCase | null> {
    const list = loadCollection<DisputeCase>('nado_disputes');
    return list.find(d => d.id === id) || null;
  }
  async listDisputes(_userId?: string): Promise<DisputeCase[]> {
    return loadCollection<DisputeCase>('nado_disputes');
  }
  async saveDispute(dispute: DisputeCase): Promise<void> {
    const list = loadCollection<DisputeCase>('nado_disputes');
    const index = list.findIndex(d => d.id === dispute.id);
    if (index >= 0) {
      list[index] = dispute;
    } else {
      list.push(dispute);
    }
    saveCollection('nado_disputes', list);
  }
}

export class DemoAuditRepository implements AuditRepository {
  async getLogs(): Promise<AuditLog[]> {
    return loadCollection<AuditLog>('nado_audit_logs');
  }
  async addLog(log: AuditLog): Promise<void> {
    const list = loadCollection<AuditLog>('nado_audit_logs');
    list.push(log);
    saveCollection('nado_audit_logs', list);
  }
}

// -------------------------------------------------------------
// EXPORTS AS SINGLETON REPOSITORIES
// -------------------------------------------------------------
export const userRepository: UserRepository = new DemoUserRepository();
export const contractorRepository: ContractorRepository = new DemoContractorRepository();
export const venueRepository: VenueRepository = new DemoVenueRepository();
export const eventRepository: EventRepository = new DemoEventRepository();
export const leadRepository: LeadRepository = new DemoLeadRepository();
export const clientRepository: ClientRepository = new DemoClientRepository();
export const calendarRepository: CalendarRepository = new DemoCalendarRepository();
export const orderRepository: OrderRepository = new DemoOrderRepository();
export const contractRepository: ContractRepository = new DemoContractRepository();
export const documentRepository: DocumentRepository = new DemoDocumentRepository();
export const analyticsRepository: AnalyticsRepository = new DemoAnalyticsRepository();
export const scoringRepository: ScoringRepository = new DemoScoringRepository();
export const tariffRepository: TariffRepository = new DemoTariffRepository();
export const notificationRepository: NotificationRepository = new DemoNotificationRepository();
export const disputeRepository: DisputeRepository = new DemoDisputeRepository();
export const auditRepository: AuditRepository = new DemoAuditRepository();
