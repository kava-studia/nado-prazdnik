import { ContractTemplate, ContractTemplateVersion, ContractVariable } from '../types';
import { legalEntityConfig } from '../../../config/legalEntity';
import { 
  createUserAgreementClauses,
  createContractorPlatformAgreementClauses,
  createVenuePlatformAgreementClauses,
  createListingRulesClauses,
  createCommissionRulesClauses,
  createBookingRulesClauses,
  createCancellationRulesClauses,
  createDisputeRulesClauses,
  createScoringRulesClauses,
  createAdvertisingRulesClauses,
  createConsentClauses, 
  createVenueRentClauses, 
  createVenueServicesClauses, 
  createVenueMixedClauses, 
  createHostClauses, 
  createDjClauses, 
  createPhotoVideoClauses, 
  createDecoratorClauses, 
  createCateringClauses, 
  createEquipmentClauses, 
  createArtistClauses, 
  createTransportClauses, 
  createOrganizerClauses,
  createCommonServiceClauses,
  LEGAL_REVIEW_NOTICE
} from './clauseBuilders';
import { commonServiceVariables } from './policyVariables';

export { LEGAL_REVIEW_NOTICE };
export const DEMO_CONFIRMATION_NOTICE = "Демонстрационное подтверждение не является электронной подписью (ЭЦП, КЭП, ПЭП, Госключ)";
export const DEMO_ELECTRONIC_SIGNATURE_NOTICE = "Фиксация согласия в демо-режиме используется только для проверки пользовательских сценариев и бизнес-логики платформы.";

const TEMPLATE_AUTHOR = "Рабочий шаблон NADO";

const getPlatformOperatorName = () => legalEntityConfig?.legalName || '';
const getPlatformOperatorRequisites = () => legalEntityConfig?.inn ? `ИНН: ${legalEntityConfig.inn}` : '';

const platformItems = [
  { id: 'tpl-pl-1', name: 'Пользовательское соглашение клиента', desc: 'Условия использования сервиса NADO ПРАЗДНИК для заказчиков', builder: createUserAgreementClauses },
  { id: 'tpl-pl-2', name: 'Соглашение исполнителя с платформой', desc: 'Правила работы подрядчиков на платформе NADO ПРАЗДНИК', builder: createContractorPlatformAgreementClauses },
  { id: 'tpl-pl-3', name: 'Соглашение площадки с платформой', desc: 'Правила взаимодействия площадок с платформой', builder: createVenuePlatformAgreementClauses },
  { id: 'tpl-pl-4', name: 'Правила размещения услуг', desc: 'Требования к модерации и заполнению карточек услуг', builder: createListingRulesClauses },
  { id: 'tpl-pl-5', name: 'Правила комиссий и тарифов', desc: 'Регламент расчета агентских и сервисных сборов', builder: createCommissionRulesClauses },
  { id: 'tpl-pl-6', name: 'Правила бронирования', desc: 'Порядок подтверждения дат и защиты слотов', builder: createBookingRulesClauses },
  { id: 'tpl-pl-7', name: 'Правила отмены и возвратов', desc: 'Регламент возврата средств при отмене заказов', builder: createCancellationRulesClauses },
  { id: 'tpl-pl-8', name: 'Правила рассмотрения споров', desc: 'Порядок обращения и досудебного урегулирования', builder: createDisputeRulesClauses },
  { id: 'tpl-pl-9', name: 'Правила рейтинга и скоринга', desc: 'Алгоритм расчета индекса надежности специалистов', builder: createScoringRulesClauses },
  { id: 'tpl-pl-10', name: 'Правила рекламы и продвижения', desc: 'Условия подсвечивания профилей и приоритетной выдачи', builder: createAdvertisingRulesClauses }
];

const consentVariablesList: ContractVariable[] = [
  { key: 'data_subject_name', label: 'ФИО субъекта персональных данных', description: 'ФИО заявителя', type: 'text', required: true, source: 'client', group: 'Субъект' },
  { key: 'data_subject_identifier', label: 'Идентификатор субъекта', description: 'Паспортные данные или иной подтверждённый идентификатор', type: 'text', required: true, source: 'client', group: 'Субъект' },
  { key: 'data_operator_name', label: 'Наименование оператора ПДн', description: 'Юридическое лицо оператора', type: 'text', required: true, source: 'platform', group: 'Оператор', defaultValue: getPlatformOperatorName() },
  { key: 'data_operator_requisites', label: 'Реквизиты оператора ПДн', description: 'ИНН, ОГРН, адрес оператора', type: 'textarea', required: true, source: 'platform', group: 'Оператор', defaultValue: getPlatformOperatorRequisites() },
  { key: 'processing_purpose', label: 'Цель обработки персональных данных', description: 'Конкретная цель обработки', type: 'textarea', required: true, source: 'client', group: 'Условия' },
  { key: 'data_categories', label: 'Категории персональных данных', description: 'Перечень обрабатываемых категорий данных', type: 'textarea', required: true, source: 'client', group: 'Условия' },
  { key: 'consent_actions', label: 'Перечень разрешенных действий', description: 'Сбор, запись, систематизация и др.', type: 'textarea', required: true, source: 'platform', group: 'Условия' },
  { key: 'consent_third_parties', label: 'Передача третьим лицам', description: 'Условия и получатели данных', type: 'textarea', required: true, source: 'platform', group: 'Условия' },
  { key: 'consent_term', label: 'Срок действия согласия', description: 'Период действия', type: 'text', required: true, source: 'platform', group: 'Условия' },
  { key: 'consent_withdrawal_procedure', label: 'Порядок отзыва', description: 'Порядок направления отзыва', type: 'textarea', required: true, source: 'platform', group: 'Условия' },
  { key: 'consent_date', label: 'Дата предоставления', description: 'Дата составления/согласия', type: 'date', required: true, source: 'platform', group: 'Документ' }
];

export const defaultTemplates: { template: ContractTemplate; version: ContractTemplateVersion }[] = [
  // 1-10 Platform Documents
  ...platformItems.map((item) => ({
    template: {
      id: item.id,
      name: item.name,
      description: item.desc,
      category: 'platform' as const,
      documentKind: 'platform_policy' as const,
      partyRoles: ['platform', 'user'],
      status: 'legal_review' as const,
      currentVersionId: `${item.id}-v1`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: `${item.id}-v1`,
      templateId: item.id,
      version: '1.0.0',
      title: item.name,
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: item.builder(),
      variables: [
        { key: 'client_name', label: 'ФИО / Наименование Пользователя', description: 'Полные данные', type: 'text', required: true, source: 'client', group: 'Стороны' },
        { key: 'data_operator_name', label: 'Наименование Оператора Платформы', description: 'Юридическое лицо оператора', type: 'text', required: true, source: 'platform', group: 'Оператор', defaultValue: getPlatformOperatorName() }
      ] as ContractVariable[],
      status: 'legal_review' as const,
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  })),

  // 11-13 Consent Documents
  ...[
    { id: 'tpl-pl-11', name: 'Согласие на обработку персональных данных', desc: 'Правовые основания обработки ПДн клиентов и подрядчиков' },
    { id: 'tpl-pl-12', name: 'Согласие на публикацию профиля', desc: 'Разрешение на демонстрацию портфолио и отзывов' },
    { id: 'tpl-pl-13', name: 'Согласие на рекламные сообщения', desc: 'Подтверждение получения сервисных и маркетинговых уведомлений' }
  ].map((item) => ({
    template: {
      id: item.id,
      name: item.name,
      description: item.desc,
      category: 'platform' as const,
      documentKind: 'consent' as const,
      partyRoles: ['platform', 'user'],
      status: 'legal_review' as const,
      currentVersionId: `${item.id}-v1`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: `${item.id}-v1`,
      templateId: item.id,
      version: '1.0.0',
      title: item.name,
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createConsentClauses(),
      variables: consentVariablesList,
      status: 'legal_review' as const,
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  })),

  // 14-28 Direct Client-Contractor Contracts
  {
    template: {
      id: 'tpl-cnt-host',
      name: 'Договор с ведущим',
      description: 'Соглашение на проведение шоу-программы и интерактивов',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-host-v1',
      supportedAttachments: ['att-tpl-tech-rider', 'att-tpl-timing', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-host-v1',
      templateId: 'tpl-cnt-host',
      version: '1.0.0',
      title: 'Договор оказания услуг ведущего',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createHostClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'duration', label: 'Продолжительность (часов)', description: 'Время ведения программы', type: 'number', required: true, source: 'service', group: 'Специфика ведущего' },
        { key: 'script', label: 'Статус сценария', description: 'Утверждение концепции', type: 'text', required: false, source: 'service', group: 'Специфика ведущего' },
        { key: 'dj_included', label: 'Диджей в комплекте', description: 'Входит ли работа диджея в стоимость ведущего', type: 'boolean', required: true, source: 'service', group: 'Специфика ведущего' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-dj',
      name: 'Договор с диджеем',
      description: 'Соглашение на музыкальное и звуковое сопровождение события',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-dj-v1',
      supportedAttachments: ['att-tpl-tech-rider', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-dj-v1',
      templateId: 'tpl-cnt-dj',
      version: '1.0.0',
      title: 'Договор оказания услуг диджея',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createDjClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'music_brief', label: 'Музыкальный бриф', description: 'Предпочтения по жанрам и стилю', type: 'textarea', required: true, source: 'service', group: 'Специфика DJ' },
        { key: 'do_not_play_list', label: 'Стоп-лист треков', description: 'Запрещенные композиции', type: 'textarea', required: false, source: 'service', group: 'Специфика DJ' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-photo',
      name: 'Договор с фотографом',
      description: 'Соглашение на проведение фотосъемки и обработку кадров',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-photo-v1',
      supportedAttachments: ['att-tpl-shotlist', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-photo-v1',
      templateId: 'tpl-cnt-photo',
      version: '1.0.0',
      title: 'Договор на оказание услуг фотосъемки',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createPhotoVideoClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'photo_count', label: 'Количество итоговых кадров', description: 'Минимальное число обрабатываемых снимков', type: 'number', required: true, source: 'service', group: 'Фотосъемка' },
        { key: 'delivery_days', label: 'Срок готовности (дней)', description: 'Максимальный срок готовых фото', type: 'number', required: true, source: 'service', group: 'Фотосъемка' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-video',
      name: 'Договор с видеографом',
      description: 'Соглашение на видеосъемку, монтаж фильма и тизера',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-video-v1',
      supportedAttachments: ['att-tpl-shotlist', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-video-v1',
      templateId: 'tpl-cnt-video',
      version: '1.0.0',
      title: 'Договор на оказание услуг видеосъемки',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createPhotoVideoClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'photo_count', label: 'Хронометраж клипа (мин)', description: 'Длительность итогового фильма', type: 'number', required: true, source: 'service', group: 'Видео' },
        { key: 'delivery_days', label: 'Срок сдачи (дней)', description: 'Срок передачи готовых видеофайлов', type: 'number', required: true, source: 'service', group: 'Видео' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-decorator',
      name: 'Договор с декоратором',
      description: 'Соглашение на оформление пространства и президиума',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-decorator-v1',
      supportedAttachments: ['att-tpl-decor-sketch', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-decorator-v1',
      templateId: 'tpl-cnt-decorator',
      version: '1.0.0',
      title: 'Договор оказания услуг декора и флористики',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createDecoratorClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'setup_deadline', label: 'Время окончания монтажа', description: 'Готовность декораций', type: 'time', required: true, source: 'service', group: 'Декор' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-florist',
      name: 'Договор с флористом',
      description: 'Соглашение на поставку и сборку живых цветов и букетов',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-florist-v1',
      supportedAttachments: ['att-tpl-decor-sketch', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-florist-v1',
      templateId: 'tpl-cnt-florist',
      version: '1.0.0',
      title: 'Договор на поставку флористического оформления',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createDecoratorClauses(),
      variables: commonServiceVariables,
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-catering',
      name: 'Договор с кейтерингом',
      description: 'Соглашение на выездное ресторанное обслуживание и банкет',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-catering-v1',
      supportedAttachments: ['att-tpl-menu', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-catering-v1',
      templateId: 'tpl-cnt-catering',
      version: '1.0.0',
      title: 'Договор выездного ресторанного обслуживания (Кейтеринг)',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createCateringClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'guests_count', label: 'Количество гостей', description: 'Расчетное число участников', type: 'number', required: true, source: 'event', group: 'Кейтеринг' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-eq-rent',
      name: 'Договор аренды оборудования',
      description: 'Аренда звуковых, световых и сценических комплектов',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-eq-rent-v1',
      supportedAttachments: ['att-tpl-tech-rider', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-eq-rent-v1',
      templateId: 'tpl-cnt-eq-rent',
      version: '1.0.0',
      title: 'Договор аренды движимого имущества и оборудования',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createEquipmentClauses(),
      variables: commonServiceVariables,
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-tech',
      name: 'Договор технического обеспечения',
      description: 'Комплексное техническое сопровождение инженерами и светооператорами',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-tech-v1',
      supportedAttachments: ['att-tpl-tech-rider', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-tech-v1',
      templateId: 'tpl-cnt-tech',
      version: '1.0.0',
      title: 'Договор технического обеспечения события',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createEquipmentClauses(),
      variables: commonServiceVariables,
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-artist',
      name: 'Договор с артистом или шоу-программой',
      description: 'Соглашение на выступление музыкальных групп, танцоров и шоу',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-artist-v1',
      supportedAttachments: ['att-tpl-tech-rider', 'att-tpl-timing'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-artist-v1',
      templateId: 'tpl-cnt-artist',
      version: '1.0.0',
      title: 'Договор на концертное выступление артистов',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createArtistClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'performance_duration', label: 'Длительность выступления (мин)', description: 'Время на сцене', type: 'number', required: true, source: 'service', group: 'Шоу' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-transport',
      name: 'Договор транспортного обслуживания',
      description: 'Пассажирские перевозки, трансфер и кортеж',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-transport-v1',
      supportedAttachments: ['att-tpl-timing', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-transport-v1',
      templateId: 'tpl-cnt-transport',
      version: '1.0.0',
      title: 'Договор транспортного обслуживания и аренды авто',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createTransportClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'vehicle_type', label: 'Марка и тип автомобиля', description: 'Класс автотранспорта', type: 'text', required: true, source: 'service', group: 'Транспорт' },
        { key: 'route_details', label: 'Маршрут и точки посадки', description: 'Адреса и время', type: 'textarea', required: true, source: 'service', group: 'Транспорт' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-organizer',
      name: 'Договор с организатором',
      description: 'Комплексная организация и менеджмент мероприятия «под ключ»',
      category: 'organizer',
      documentKind: 'service_contract',
      partyRoles: ['client', 'organizer'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-organizer-v1',
      supportedAttachments: ['att-tpl-timing', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-organizer-v1',
      templateId: 'tpl-cnt-organizer',
      version: '1.0.0',
      title: 'Договор на комплексную организацию мероприятия',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createOrganizerClauses(),
      variables: commonServiceVariables,
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-coordinator',
      name: 'Договор с координатором',
      description: 'Координация логистики и артистов в день проведения',
      category: 'organizer',
      documentKind: 'service_contract',
      partyRoles: ['client', 'organizer'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-coordinator-v1',
      supportedAttachments: ['att-tpl-timing'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-coordinator-v1',
      templateId: 'tpl-cnt-coordinator',
      version: '1.0.0',
      title: 'Договор оказания услуг координатора площадки',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createOrganizerClauses(),
      variables: commonServiceVariables,
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-lodging',
      name: 'Договор размещения и проживания',
      description: 'Бронирование номеров и коттеджей для гостей и молодоженов',
      category: 'venue',
      documentKind: 'venue_contract',
      partyRoles: ['client', 'venue'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-lodging-v1',
      supportedAttachments: ['att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-lodging-v1',
      templateId: 'tpl-cnt-lodging',
      version: '1.0.0',
      title: 'Договор временного проживания и размещения',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createVenueRentClauses(),
      variables: commonServiceVariables,
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-cnt-universal',
      name: 'Универсальный договор оказания event-услуги',
      description: 'Базовое соглашение для любых услуг сферы праздников',
      category: 'contractor',
      documentKind: 'service_contract',
      partyRoles: ['client', 'contractor'],
      status: 'legal_review',
      currentVersionId: 'tpl-cnt-universal-v1',
      supportedAttachments: ['att-tpl-tz', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-cnt-universal-v1',
      templateId: 'tpl-cnt-universal',
      version: '1.0.0',
      title: 'Универсальный договор оказания event-услуг',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createCommonServiceClauses(),
      variables: commonServiceVariables,
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },

  // 29-31 Venue Contracts (3 models)
  {
    template: {
      id: 'tpl-ven-rent',
      name: 'Договор аренды площадки',
      description: 'Модель 1: Передача пространств и помещений в аренду без общепита',
      category: 'venue',
      subcategory: 'rent',
      documentKind: 'venue_contract',
      partyRoles: ['client', 'venue'],
      status: 'legal_review',
      currentVersionId: 'tpl-ven-rent-v1',
      supportedAttachments: ['att-tpl-venue-rules', 'att-tpl-equipment-act', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-ven-rent-v1',
      templateId: 'tpl-ven-rent',
      version: '1.0.0',
      title: 'Договор аренды пространства для мероприятия',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createVenueRentClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'hall_name', label: 'Название зала / территории', description: 'Конкретный зал или шатёр', type: 'text', required: true, source: 'venue', group: 'Площадка' },
        { key: 'rent_cost', label: 'Стоимость аренды (руб)', description: 'Арендная плата', type: 'money', required: true, source: 'venue', group: 'Финансы' },
        { key: 'security_deposit', label: 'Обеспечительный залог (руб)', description: 'Залог за сохранность имущества', type: 'money', required: false, source: 'venue', group: 'Финансы' },
        { key: 'quiet_hours', label: 'Ограничения по шуму', description: 'Время соблюдения тишины', type: 'text', required: false, source: 'venue', group: 'Условия площадки' },
        { key: 'fire_rules', label: 'Правила открытого огня и пиротехники', description: 'Разрешение свечей, салютов и тяжелого дыма', type: 'text', required: false, source: 'venue', group: 'Условия площадки' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-ven-service',
      name: 'Договор оказания услуг площадки',
      description: 'Модель 2: Комплекс ресторанного и банкетного обслуживания без отдельной платы за аренду',
      category: 'venue',
      subcategory: 'services',
      documentKind: 'venue_contract',
      partyRoles: ['client', 'venue'],
      status: 'legal_review',
      currentVersionId: 'tpl-ven-service-v1',
      supportedAttachments: ['att-tpl-menu', 'att-tpl-venue-rules', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-ven-service-v1',
      templateId: 'tpl-ven-service',
      version: '1.0.0',
      title: 'Договор оказания услуг банкетного обслуживания',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createVenueServicesClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'hall_name', label: 'Название зала', description: 'Банкетный зал', type: 'text', required: true, source: 'venue', group: 'Площадка' },
        { key: 'guests_count', label: 'Количество гостей', description: 'Число участников', type: 'number', required: true, source: 'event', group: 'Услуги' },
        { key: 'catering_cost', label: 'Стоимость меню и обслуживания (руб)', description: 'Сумма банкетного обслуживания', type: 'money', required: true, source: 'venue', group: 'Услуги' },
        { key: 'cork_fee', label: 'Пробковый сбор (руб/чел)', description: 'Сбор за свои напитки', type: 'money', required: false, source: 'venue', group: 'Услуги' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-ven-mixed',
      name: 'Смешанный договор площадки',
      description: 'Модель 3: Раздельная аренда пространства и комплекс дополнительных банкетных услуг',
      category: 'venue',
      subcategory: 'mixed',
      documentKind: 'venue_contract',
      partyRoles: ['client', 'venue'],
      status: 'legal_review',
      currentVersionId: 'tpl-ven-mixed-v1',
      supportedAttachments: ['att-tpl-menu', 'att-tpl-venue-rules', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-ven-mixed-v1',
      templateId: 'tpl-ven-mixed',
      version: '1.0.0',
      title: 'Смешанный договор аренды и оказания услуг площадки',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createVenueMixedClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'hall_name', label: 'Название зала', description: 'Выбранное пространство', type: 'text', required: true, source: 'venue', group: 'Площадка' },
        { key: 'rent_cost', label: 'Стоимость аренды зала (руб)', description: 'Арендная ставка за пространство', type: 'money', required: true, source: 'venue', group: 'Раздельные суммы' },
        { key: 'catering_cost', label: 'Стоимость услуг питания (руб)', description: 'Банкет, кухня, обслуживание', type: 'money', required: true, source: 'venue', group: 'Раздельные суммы' },
        { key: 'tech_cost', label: 'Стоимость тех. оборудования (руб)', description: 'Звук, свет, сцены', type: 'money', required: true, source: 'venue', group: 'Раздельные суммы' },
        { key: 'cork_fee', label: 'Пробковый сбор (руб/чел)', description: 'За привозной алкоголь', type: 'money', required: false, source: 'venue', group: 'Условия площадки' },
        { key: 'quiet_hours', label: 'Ограничения по шуму', description: 'Время соблюдения тишины', type: 'text', required: false, source: 'venue', group: 'Условия площадки' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  },
  {
    template: {
      id: 'tpl-vne-rental',
      name: 'Трёхсторонний договор площадки и организатора',
      description: 'Аренда площадки с участием заказчика, площадки и организатора мероприятия',
      category: 'venue',
      subcategory: 'rent',
      documentKind: 'venue_contract',
      partyRoles: ['client', 'venue', 'organizer'],
      status: 'legal_review',
      currentVersionId: 'tpl-vne-rental-v1',
      supportedAttachments: ['att-tpl-venue-rules', 'att-tpl-equipment-act', 'att-tpl-estimate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    version: {
      id: 'tpl-vne-rental-v1',
      templateId: 'tpl-vne-rental',
      version: '1.0.0',
      title: 'Трёхсторонний договор аренды пространства для мероприятия',
      introduction: LEGAL_REVIEW_NOTICE,
      clauses: createVenueRentClauses(),
      variables: [
        ...commonServiceVariables,
        { key: 'organizer_name', label: 'Организатор', description: 'ФИО или наименование организатора', type: 'text', required: false, source: 'organizer', group: 'Стороны' },
        { key: 'hall_name', label: 'Название зала / территории', description: 'Конкретный зал или территория', type: 'text', required: false, source: 'venue', group: 'Площадка' },
        { key: 'rent_cost', label: 'Стоимость аренды (руб)', description: 'Арендная плата', type: 'money', required: false, source: 'venue', group: 'Финансы' }
      ] as ContractVariable[],
      status: 'legal_review',
      createdAt: new Date().toISOString(),
      author: TEMPLATE_AUTHOR
    }
  }
];
