import { 
  LegalDocument, 
  LegalDocumentVersion, 
  ConsentRecord, 
  LegalDocumentStatus 
} from '../types';
import { legalEntityConfig, isLegalEntityConfigured } from '../config/legalEntity';

const LEGAL_DOCS_KEY = 'nado_holiday_legal_documents';
const CONSENTS_KEY = 'nado_holiday_consents';

// Initial seed documents
const SEED_DOCUMENTS: any[] = [
  {
    id: 'doc-user-agreement',
    key: 'user-agreement',
    title: 'Пользовательское соглашение',
    currentVersionId: 'ver-ua-100',
    versions: [
      {
        id: 'ver-ua-100',
        documentId: 'doc-user-agreement',
        version: '1.0.0',
        title: 'Пользовательское соглашение NADO ПРАЗДНИК',
        summary: 'Это соглашение регулирует правила использования сайта и платформы NADO ПРАЗДНИК. Платформа является связующим звеном между заказчиками и исполнителями.',
        content: `1. ОБЩИЕ ПОЛОЖЕНИЯ
1.1. Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между владельцем платформы NADO ПРАЗДНИК и пользователем.
1.2. Платформа NADO ПРАЗДНИК предоставляет пользователям доступ к интерактивным инструментам планирования мероприятий, расчету напитков, сметам и каталогу подрядчиков.
1.3. Использование платформы означает полное и безоговорочное принятие условий настоящего Соглашения.

2. РОЛЬ ПЛАТФОРМЫ И ОТВЕТСТВЕННОСТЬ
2.1. NADO ПРАЗДНИК помогает клиенту и исполнителю найти друг друга, согласовать условия и сохранить договоренности. Услугу оказывает выбранный исполнитель. Договор оказания услуги заключается напрямую между клиентом и исполнителем.
2.2. Ответственность сторон определяется договором, правилами сервиса и применимым законодательством.
2.3. Платформа не является стороной сделки по оказанию услуг подрядчиками.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Юридический отдел NADO',
        changeReason: 'Первоначальная публикация'
      }
    ]
  },
  {
    id: 'doc-privacy-policy',
    key: 'privacy-policy',
    title: 'Политика конфиденциальности',
    currentVersionId: 'ver-pp-100',
    versions: [
      {
        id: 'ver-pp-100',
        documentId: 'doc-privacy-policy',
        version: '1.0.0',
        title: 'Политика конфиденциальности NADO ПРАЗДНИК',
        summary: 'Мы собираем и обрабатываем только те данные, которые необходимы для планирования вашего мероприятия и связи с подрядчиками.',
        content: `1. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ
1.1. Мы собираем ваше имя, телефон, адрес электронной почты, а также параметры планируемого мероприятия (дата, город, количество гостей).
1.2. Мы используем файлы cookie для сохранения ваших сессий и настроек калькулятора.

2. ЦЕЛИ ОБРАБОТКИ
2.1. Предоставление услуг по планированию мероприятий и связи с подрядчиками.
2.2. Улучшение работы интерфейсов и расчетных алгоритмов.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Юридический отдел NADO',
        changeReason: 'Первоначальная версия политики безопасности'
      }
    ]
  },
  {
    id: 'doc-personal-data-consent',
    key: 'personal-data-consent',
    title: 'Согласие на обработку персональных данных',
    currentVersionId: 'ver-[#FFB800]-100',
    versions: [
      {
        id: 'ver-[#FFB800]-100',
        documentId: 'doc-personal-data-consent',
        version: '1.0.0',
        title: 'Согласие на обработку персональных данных',
        summary: 'Давая это согласие, вы разрешаете NADO ПРАЗДНИК обрабатывать введенные контакты для организации звонков и передачи заявок исполнителям.',
        content: `Настоящим я даю согласие на обработку моих персональных данных (имя, телефон, электронная почта, город планирования) для целей обеспечения связи с подрядчиками и формирования планов подготовки на платформе NADO ПРАЗДНИК. Обработка осуществляется в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Юридический отдел NADO',
        changeReason: 'Соответствие закону о персональных данных'
      }
    ]
  },
  {
    id: 'doc-platform-rules',
    key: 'platform-rules',
    title: 'Правила использования платформы',
    currentVersionId: 'ver-pr-100',
    versions: [
      {
        id: 'ver-pr-100',
        documentId: 'doc-platform-rules',
        version: '1.0.0',
        title: 'Правила использования платформы NADO ПРАЗДНИК',
        summary: 'Правила поведения на платформе, запрет на публикацию спама, оскорблений и использование фальшивых параметров.',
        content: `1. ПРАВИЛА ПОВЕДЕНИЯ
1.1. Запрещено размещение оскорбительного контента в чатах и профилях.
1.2. Пользователи обязуются предоставлять достоверные параметры мероприятий (количество гостей, дата) для корректных расчетов.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Администрация NADO',
        changeReason: 'Первая редакция правил сообщества'
      }
    ]
  },
  {
    id: 'doc-booking-rules',
    key: 'booking-rules',
    title: 'Правила бронирования',
    currentVersionId: 'ver-br-100',
    versions: [
      {
        id: 'ver-br-100',
        documentId: 'doc-booking-rules',
        version: '1.0.0',
        title: 'Правила бронирования исполнителей',
        summary: 'Бронирование подрядчиков считается подтвержденным только после согласования условий обеими сторонами.',
        content: `1. ПРОЦЕСС БРОНИРОВАНИЯ
1.1. Клиент отправляет запрос исполнителю через платформу NADO ПРАЗДНИК.
1.2. Бронирование считается согласованным только после взаимного подтверждения условий заказа (OrderTermsSnapshot) и клиентом, и исполнителем.
1.3. До подтверждения со стороны исполнителя заказ имеет статус ожидания.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Отдел бронирования NADO',
        changeReason: 'Первоначальная версия правил бронирования'
      }
    ]
  },
  {
    id: 'doc-cancellation-refunds',
    key: 'cancellation-refunds',
    title: 'Правила отмены и возвратов',
    currentVersionId: 'ver-cr-100',
    versions: [
      {
        id: 'ver-cr-100',
        documentId: 'doc-cancellation-refunds',
        version: '1.0.0',
        title: 'Правила отмены заказов и возврата средств',
        summary: 'Определяют условия аннулирования броней, удержание невозвратных авансов и сроки возвратов.',
        content: `1. ОТМЕНА ЗАКАЗА КЛИЕНТОМ
1.1. Клиент имеет право отменить заказ в личном кабинете.
1.2. Возврат предоплаты регулируется условиями конкретного исполнителя, зафиксированными в согласованных Условиях заказа на момент бронирования.
1.3. Изменения правил не применяются задним числом к ранее совершенным заказам.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Финансовый отдел NADO',
        changeReason: 'Регулирование возвратов'
      }
    ]
  },
  {
    id: 'doc-disputes',
    key: 'disputes',
    title: 'Правила разрешения споров',
    currentVersionId: 'ver-di-100',
    versions: [
      {
        id: 'ver-di-100',
        documentId: 'doc-disputes',
        version: '1.0.0',
        title: 'Правила рассмотрения споров и жалоб',
        summary: 'Если услуга оказана частично или возник спор по оплате, пользователи могут обратиться за помощью к медиаторам платформы.',
        content: `1. ПОРЯДОК СПОРОВ И ЖАЛОБ
1.1. При возникновении разногласий любая сторона может инициировать обсуждение спорного вопроса в разделе /disputes.
1.2. К обращению необходимо приложить заключенный договор, материалы и переписку.
1.3. Наша команда содействует мирной медиации сторон в соответствии с действующим законодательством РФ.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Медиация NADO',
        changeReason: 'Создание отдела медиации'
      }
    ]
  },
  {
    id: 'doc-contractor-agreement',
    key: 'contractor-agreement',
    title: 'Условия для исполнителей',
    currentVersionId: 'ver-ca-100',
    versions: [
      {
        id: 'ver-ca-100',
        documentId: 'doc-contractor-agreement',
        version: '1.0.0',
        title: 'Условия работы для исполнителей и подрядчиков',
        summary: 'Обязательства подрядчиков по качеству услуг, заполнению реквизитов и уплате комиссий.',
        content: `1. СТАТУС ИСПОЛНИТЕЛЯ
1.1. Исполнитель обязан указать свой налоговый статус (Физическое лицо, Самозанятый, ИП или ООО) и реквизиты.
1.2. Исполнитель несет полную юридическую ответственность за качество оказываемых им услуг перед конечным клиентом.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Юридический отдел NADO',
        changeReason: 'Регулирование подрядчиков'
      }
    ]
  },
  {
    id: 'doc-listing-rules',
    key: 'listing-rules',
    title: 'Правила размещения услуг',
    currentVersionId: 'ver-lr-100',
    versions: [
      {
        id: 'ver-lr-100',
        documentId: 'doc-listing-rules',
        version: '1.0.0',
        title: 'Правила размещения в каталоге NADO ПРАЗДНИК',
        summary: 'Требования к фотографиям, портфолио, прайс-листам и отзывам подрядчиков.',
        content: `1. ТРЕБОВАНИЯ К ОПИСАНИЮ
1.1. Фотографии портфолио должны быть реальными и принадлежать автору профиля.
1.2. Цены на услуги в каталоге должны соответствовать действительности. Искусственное занижение цен для привлечения заявок запрещено.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Модерация NADO',
        changeReason: 'Контроль качества каталога'
      }
    ]
  },
  {
    id: 'doc-tariffs',
    key: 'tariffs',
    title: 'Правила комиссий и тарифов',
    currentVersionId: 'ver-ta-100',
    versions: [
      {
        id: 'ver-ta-100',
        documentId: 'doc-tariffs',
        version: '1.0.0',
        title: 'Тарифы и комиссии сервиса NADO ПРАЗДНИК',
        summary: 'Информация о комиссионных сборах, стоимости откликов и продвижения на платформе.',
        content: `1. КОМИССИОННЫЙ СБОР
1.1. Сервисный сбор платформы фиксируется на момент отправки заявки и подтверждения Условий заказа.
1.2. Все изменения тарифов публикуются заблаговременно и не влияют на уже подтвержденные сделки.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Финансовый отдел NADO',
        changeReason: 'Фиксация тарифов на 2026 год'
      }
    ]
  },
  {
    id: 'doc-protected-payment',
    key: 'protected-payment',
    title: 'Правила безопасного расчёта',
    currentVersionId: 'ver-ppay-100',
    versions: [
      {
        id: 'ver-ppay-100',
        documentId: 'doc-protected-payment',
        version: '1.0.0',
        title: 'Правила проведения безопасных расчетов',
        summary: 'Информация о заморозке средств, онлайн-оплате через лицензированных партнеров после интеграции.',
        content: `1. БЕЗОПАСНЫЙ РАСЧЕТ
1.1. До интеграции с лицензированным платежным провайдером все финансовые операции не производятся на платформе напрямую.
1.2. Онлайн-оплата и резервирование станут доступны после подключения платежного партнера. Вся информация в системе носит справочный характер финансового журнала.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Финансовый отдел NADO',
        changeReason: 'Описание механизмов расчетов'
      }
    ]
  },
  {
    id: 'doc-advertising',
    key: 'advertising',
    title: 'Правила рекламы и продвижения',
    currentVersionId: 'ver-ad-100',
    versions: [
      {
        id: 'ver-ad-100',
        documentId: 'doc-advertising',
        version: '1.0.0',
        title: 'Правила рекламы на платформе NADO ПРАЗДНИК',
        summary: 'Обязательная маркировка рекламных объявлений и продвигаемых профилей.',
        content: `1. МАРКИРОВКА РЕКЛАМЫ
1.1. Любой платный рекламный контент или продвигаемый профиль в каталоге получает обязательную пометку «Реклама» или «Продвигается».
1.2. Профили с пометкой «Выбор NADO» ранжируются на основании экспертной оценки создателей платформы и не являются оплаченной рекламой.`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Отдел маркетинга NADO',
        changeReason: 'Прозрачное ранжирование'
      }
    ]
  },
  {
    id: 'doc-versions',
    key: 'versions',
    title: 'История версий документов',
    currentVersionId: 'ver-v-100',
    versions: [
      {
        id: 'ver-v-100',
        documentId: 'doc-versions',
        version: '1.0.0',
        title: 'Журнал изменений юридических документов',
        summary: 'История публикаций, дат вступления в силу и авторов изменений.',
        content: `Список документов:
- Пользовательское соглашение v1.0.0 от 01.01.2026 (Статус: действующий)
- Политика конфиденциальности v1.0.0 от 01.01.2026 (Статус: действующий)
- Правила бронирования v1.0.0 от 01.01.2026 (Статус: действующий)
- Правила отмены и возвратов v1.0.0 от 01.01.2026 (Статус: действующий)`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        effectiveAt: '2026-01-01T00:00:00.000Z',
        author: 'Юридический отдел NADO',
        changeReason: 'Инициализация истории версий'
      }
    ]
  }
];

export function getLegalDocuments(): LegalDocument[] {
  // Always recalculate status based on current LegalEntity configuration state
  const isConfigured = isLegalEntityConfigured();
  const currentStatus: LegalDocumentStatus = isConfigured ? 'published' : 'draft';

  try {
    const saved = localStorage.getItem(LEGAL_DOCS_KEY);
    if (saved) {
      const parsedDocs: LegalDocument[] = JSON.parse(saved);
      // Map to ensure statuses are correct and matches legalEntityConfig
      return parsedDocs.map(doc => ({
        ...doc,
        status: currentStatus,
        versions: (doc.versions || []).map(v => ({
          ...v,
          status: 'published' as const
        }))
      }));
    }
  } catch (e) {
    console.error('Failed to parse legal documents', e);
  }

  // Seed default if empty
  const seededDocs: LegalDocument[] = SEED_DOCUMENTS.map(doc => ({
    ...doc,
    status: currentStatus,
    versions: (doc.versions || []).map((v: any) => ({
      ...v,
      status: 'published' as const
    }))
  }));
  localStorage.setItem(LEGAL_DOCS_KEY, JSON.stringify(seededDocs));
  return seededDocs;
}

export function getPublishedLegalDocument(key: string): LegalDocument | null {
  const docs = getLegalDocuments();
  const found = docs.find(d => d.key === key);
  return found || null;
}

export function getLegalDocumentVersions(documentId: string): LegalDocumentVersion[] {
  const docs = getLegalDocuments();
  const doc = docs.find(d => d.id === documentId);
  return doc ? doc.versions : [];
}

export function getUserConsents(userId: string = 'current_user'): ConsentRecord[] {
  try {
    const saved = localStorage.getItem(CONSENTS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse consents', e);
  }
  return [];
}

export function recordConsent(
  documentKey: string, 
  acceptanceMethod: 'checkbox_click' | 'profile_save' | 'implicit' = 'checkbox_click',
  userId: string = 'current_user'
): ConsentRecord {
  const doc = getPublishedLegalDocument(documentKey);
  if (!doc) {
    throw new Error(`Legal document with key ${documentKey} not found.`);
  }

  const consents = getUserConsents(userId);
  
  // Check if consent already exists for this version
  const existingIndex = consents.findIndex(
    c => c.userId === userId && 
         c.documentId === doc.id && 
         c.documentVersionId === doc.currentVersionId &&
         !c.revokedAt
  );

  if (existingIndex >= 0) {
    return consents[existingIndex];
  }

  const newRecord: ConsentRecord = {
    id: `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    documentId: doc.id,
    documentVersionId: doc.currentVersionId,
    acceptedAt: new Date().toISOString(),
    acceptanceMethod,
    technicalMetadata: `Browser: ${navigator.userAgent}, Screen: ${window.screen.width}x${window.screen.height}`
  };

  consents.push(newRecord);
  localStorage.setItem(CONSENTS_KEY, JSON.stringify(consents));
  return newRecord;
}

export function hasAcceptedRequiredDocuments(userId: string = 'current_user'): {
  userAgreement: boolean;
  privacyPolicy: boolean;
  personalDataConsent: boolean;
  bookingRules: boolean;
} {
  const consents = getUserConsents(userId);
  
  const hasConsent = (key: string) => {
    const doc = getPublishedLegalDocument(key);
    if (!doc) return false;
    return consents.some(c => c.documentId === doc.id && c.documentVersionId === doc.currentVersionId && !c.revokedAt);
  };

  return {
    userAgreement: hasConsent('user-agreement'),
    privacyPolicy: hasConsent('privacy-policy'),
    personalDataConsent: hasConsent('personal-data-consent'),
    bookingRules: hasConsent('booking-rules')
  };
}

export function revokeOptionalConsent(documentKey: string, userId: string = 'current_user'): boolean {
  // Only optional consents can be revoked as per guidelines
  if (['user-agreement', 'privacy-policy', 'personal-data-consent', 'booking-rules'].includes(documentKey)) {
    console.warn(`Attempted to revoke required legal document: ${documentKey}. Action blocked.`);
    return false;
  }

  const doc = getPublishedLegalDocument(documentKey);
  if (!doc) return false;

  const consents = getUserConsents(userId);
  let updated = false;

  const newConsents = consents.map(c => {
    if (c.userId === userId && c.documentId === doc.id && !c.revokedAt) {
      updated = true;
      return { ...c, revokedAt: new Date().toISOString() };
    }
    return c;
  });

  if (updated) {
    localStorage.setItem(CONSENTS_KEY, JSON.stringify(newConsents));
  }
  return updated;
}
