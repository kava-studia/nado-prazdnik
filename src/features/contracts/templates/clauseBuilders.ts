import { ContractClause } from '../types';

export const LEGAL_REVIEW_NOTICE = "Шаблон является рабочим черновиком и должен быть проверен юристом перед публикацией";

export function createClausesWithOverrides(
  standardClauses: ContractClause[],
  customClauses: Partial<ContractClause>[] = []
): ContractClause[] {
  const result: ContractClause[] = [];
  const processedCustomKeys = new Set<string>();

  // 1 & 2: Process standard clauses and apply overrides by sectionKey, id, or title
  for (const std of standardClauses) {
    const override = customClauses.find(c => 
      (c.sectionKey && c.sectionKey === std.sectionKey) ||
      (c.id && c.id === std.id) ||
      (c.title && c.title === std.title)
    );

    if (override) {
      if (override.sectionKey) processedCustomKeys.add(override.sectionKey);
      if (override.id) processedCustomKeys.add(override.id);
      if (override.title) processedCustomKeys.add(override.title);

      result.push({
        id: std.id,
        sectionKey: std.sectionKey,
        title: override.title || std.title,
        order: result.length + 1,
        body: override.body || std.body,
        required: override.required ?? std.required,
        visibilityCondition: override.visibilityCondition ?? std.visibilityCondition,
        legalReviewNote: LEGAL_REVIEW_NOTICE
      });
    } else {
      result.push({
        ...std,
        order: result.length + 1,
        legalReviewNote: LEGAL_REVIEW_NOTICE
      });
    }
  }

  // 3: Append additional clauses not present in standard set
  for (const cust of customClauses) {
    const keyUsed = (cust.sectionKey && processedCustomKeys.has(cust.sectionKey)) ||
                    (cust.id && processedCustomKeys.has(cust.id)) ||
                    (cust.title && processedCustomKeys.has(cust.title));

    if (!keyUsed && (cust.title || cust.body)) {
      result.push({
        id: cust.id || `cl-custom-${result.length + 1}`,
        sectionKey: cust.sectionKey || `custom_${result.length + 1}`,
        title: cust.title || 'Дополнительный раздел',
        order: result.length + 1,
        body: cust.body || '',
        required: cust.required ?? true,
        visibilityCondition: cust.visibilityCondition,
        legalReviewNote: LEGAL_REVIEW_NOTICE
      });
    }
  }

  // 4: Recalculate order
  return result.map((c, i) => ({ ...c, order: i + 1 }));
}

// -------------------------------------------------------------
// CATEGORY BUILDERS (10 INDIVIDUAL PLATFORM POLICY BUILDERS)
// -------------------------------------------------------------

export function createPlatformClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  return createUserAgreementClauses(custom);
}

export function createUserAgreementClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-ua-1', sectionKey: 'parties', title: 'Стороны соглашения', order: 1, body: 'Настоящее Пользовательское соглашение определяет условия использования сервиса Пользователем ({{data_subject_name}}). Оператор Платформы: {{data_operator_name}}.', required: true },
    { id: 'cl-ua-2', sectionKey: 'subject', title: 'Предмет соглашения', order: 2, body: 'Платформа предоставляет Пользователю доступ к функционалу поиска, планирования и создания договоров праздничных мероприятий.', required: true },
    { id: 'cl-ua-3', sectionKey: 'rules', title: 'Правила использования', order: 3, body: 'Пользователь обязуется предоставлять достоверные данные и соблюдать условия регламента Платформы.', required: true },
    { id: 'cl-ua-4', sectionKey: 'liability', title: 'Ответственность сторон', order: 4, body: 'Платформа предоставляет доступ к сервису "как есть" и не несёт ответственности за действия третьих лиц.', required: true },
    { id: 'cl-ua-5', sectionKey: 'term', title: 'Срок действия', order: 5, body: 'Соглашение вступает в силу с момента акцепта и действует до момента отзыва или удаления аккаунта.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createContractorPlatformAgreementClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-cpa-1', sectionKey: 'parties', title: 'Стороны соглашения', order: 1, body: 'Настоящее соглашение определяет порядок размещения услуг Исполнителя на Платформе (Оператор: {{data_operator_name}}).', required: true },
    { id: 'cl-cpa-2', sectionKey: 'subject', title: 'Предмет соглашения', order: 2, body: 'Исполнитель размещает портфолио и предложения услуг, а Платформа обеспечивает лидогенерацию и инфраструктуру договоров.', required: true },
    { id: 'cl-cpa-3', sectionKey: 'quality', title: 'Стандарты качества', order: 3, body: 'Исполнитель обязуется своевременно отвечать на заявки Заказчиков и выполнять согласованные обязательства.', required: true },
    { id: 'cl-cpa-4', sectionKey: 'commission', title: 'Комиссия платформы', order: 4, body: 'За сервисные услуги Платформы удерживается комиссия согласно выбранному тарифному плану.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createVenuePlatformAgreementClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-vpa-1', sectionKey: 'parties', title: 'Стороны соглашения', order: 1, body: 'Настоящее соглашение регулирует сотрудничество Площадки и Платформы (Оператор: {{data_operator_name}}).', required: true },
    { id: 'cl-vpa-2', sectionKey: 'subject', title: 'Предмет соглашения', order: 2, body: 'Площадка предоставляется для онлайн-бронирования и заключения смешанных договоров аренды пространства.', required: true },
    { id: 'cl-vpa-3', sectionKey: 'booking_rules', title: 'Синхронизация занятости', order: 3, body: 'Площадка обязуется поддерживать актуальность свободного календаря и условий аренды.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createListingRulesClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-lr-1', sectionKey: 'general', title: 'Правила карточки услуги', order: 1, body: 'Все публикуемые карточки услуг проходят модерацию Платформой ({{data_operator_name}}).', required: true },
    { id: 'cl-lr-2', sectionKey: 'content', title: 'Требования к контенту', order: 2, body: 'Запрещается публикация недостоверных цен, чужого портфолио или контактных данных в обход системы.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createCommissionRulesClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-cr-1', sectionKey: 'subject', title: 'Порядок применения комиссий', order: 1, body: 'Настоящие Правила устанавливают размер, сроки и порядок удержания сервисных сборов и агентских комиссий Платформы ({{data_operator_name}}).', required: true },
    { id: 'cl-cr-2', sectionKey: 'rates', title: 'Тарифная сетка', order: 2, body: 'Комиссия рассчитывается как процент от суммы заключенного через платформу договора.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createBookingRulesClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-br-1', sectionKey: 'process', title: 'Процесс бронирования', order: 1, body: 'Бронирование даты считается подтверждённым после получения аванса и смены статуса договора.', required: true },
    { id: 'cl-br-2', sectionKey: 'hold', title: 'Временный холдинг слота', order: 2, body: 'Слот времени задерживается за Заказчиком на время согласования проекта договора.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createCancellationRulesClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-cnr-1', sectionKey: 'terms', title: 'Условия отмены', order: 1, body: 'Правила отмены и расчёт суммы возврата зависят от сроков уведомления и фактически понесенных расходов.', required: true },
    { id: 'cl-cnr-2', sectionKey: 'refunds', title: 'Порядок возврата', order: 2, body: 'Возврат денежных средств производится тем же способом, которым была совершена оплата.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createDisputeRulesClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-dr-1', sectionKey: 'procedure', title: 'Порядок подачи претензий', order: 1, body: 'Все споры между Заказчиком и Исполнителем направляются в арбитраж Платформы ({{data_operator_name}}).', required: true },
    { id: 'cl-dr-2', sectionKey: 'decisions', title: 'Решения арбитража', order: 2, body: 'Арбитражная комиссия рассматривает доказательства сторон в течение 5 рабочих дней.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createScoringRulesClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-sr-1', sectionKey: 'metrics', title: 'Метрики рейтинга', order: 1, body: 'Рейтинг специалиста формируется на основе отзывов, процента выполнения заказов и скорости ответов.', required: true },
    { id: 'cl-sr-2', sectionKey: 'transparency', title: 'Прозрачность оценки', order: 2, body: 'Платформа категорически запрещает накрутку отзывов и попытки искажения скоринга.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createAdvertisingRulesClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-ar-1', sectionKey: 'placement', title: 'Рекламные опции', order: 1, body: 'Условия подсвечивания карточек и поднятия в каталоге регулируются правилами промо-пакетов.', required: true },
    { id: 'cl-ar-2', sectionKey: 'disclaimer', title: 'Пометка рекламы', order: 2, body: 'Все платное продвижение маркируется соответствующим значком согласно законодательству.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createPrivacyPolicyClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-pp-1', sectionKey: 'general', title: 'Общие положения', order: 1, body: 'Политика конфиденциальности определяет порядок обработки персональных данных Пользователей. Оператор: {{data_operator_name}}.', required: true },
    { id: 'cl-pp-2', sectionKey: 'purposes', title: 'Цели сбора данных', order: 2, body: 'Персональные данные обрабатываются для оказания услуг, авторизации и исполнения договоров.', required: true },
    { id: 'cl-pp-3', sectionKey: 'protection', title: 'Защита сведений', order: 3, body: 'Оператор принимает технические и организационные меры для защиты персональных данных.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createAgencyAgreementClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-ag-1', sectionKey: 'subject', title: 'Предмет агентского соглашения', order: 1, body: 'Агент (Платформа {{data_operator_name}}) совершает по поручению Принципала действия по привлечению клиентов и оформлению сделок.', required: true },
    { id: 'cl-ag-2', sectionKey: 'remuneration', title: 'Агентское вознаграждение', order: 2, body: 'Размер вознаграждения Агента определяется согласно установленным правилам тарифов и комиссий.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createSecurityPolicyClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-sp-1', sectionKey: 'general', title: 'Стандарты безопасности', order: 1, body: 'Политика безопасности устанавливает требования к защите данных, двухфакторной аутентификации и предотвращению фрода.', required: true },
    { id: 'cl-sp-2', sectionKey: 'audit', title: 'Аудит и протоколирование', order: 2, body: 'Все юридически значимые действия пользователей фиксируются в журнале аудита Платформы.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createConsentClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const std: ContractClause[] = [
    { id: 'cl-c-1', sectionKey: 'subject', title: 'Субъект и оператор персональных данных', order: 1, body: 'Субъект персональных данных: {{data_subject_name}} (идентификатор: {{data_subject_identifier}}).\nОператор персональных данных: {{data_operator_name}} (реквизиты: {{data_operator_requisites}}).', required: true },
    { id: 'cl-c-2', sectionKey: 'purpose', title: 'Цели обработки персональных данных', order: 2, body: 'Настоящее согласие дается на обработку персональных данных в целях: {{consent_purpose}}.', required: true },
    { id: 'cl-c-3', sectionKey: 'data_scope', title: 'Перечень обрабатываемых данных и действий', order: 3, body: 'Разрешенные действия с персональными данными: {{consent_actions}}.\nПередача третьим лицам: {{consent_third_parties}}.', required: true },
    { id: 'cl-c-4', sectionKey: 'term_revocation', title: 'Срок действия и порядок отзыва согласия', order: 4, body: 'Настоящее согласие действует в течение срока: {{consent_term}}. Порядок отзыва согласия: {{consent_withdrawal_procedure}}. Дата предоставления: {{consent_date}}.', required: true }
  ];
  return createClausesWithOverrides(std, custom);
}

export function createCommonServiceClauses(): ContractClause[] {
  return [
    { id: 'cl-s-1', sectionKey: 'parties', title: 'Термины и стороны', order: 1, body: 'Заказчик: {{client_name}}. Исполнитель: {{contractor_name}}.', required: true },
    { id: 'cl-s-2', sectionKey: 'subject', title: 'Предмет договора', order: 2, body: 'Исполнитель обязуется оказать услуги: {{service_composition}}, а Заказчик обязуется принять и оплатить их.', required: true },
    { id: 'cl-s-3', sectionKey: 'date_location', title: 'Дата и место проведения', order: 3, body: 'Дата проведения: {{event_date}}, время начала: {{event_time}}. Место: {{event_location}}.', required: true },
    { id: 'cl-s-4', sectionKey: 'price', title: 'Стоимость и порядок расчетов', order: 4, body: 'Общая стоимость услуг: {{price}} руб. Аванс: {{prepayment}} руб. Срок внесения аванса: {{prepayment_due_rule}}. Окончательный расчет: {{final_payment_rule}}.', required: true },
    { id: 'cl-s-5', sectionKey: 'cancellation', title: 'Порядок отмены', order: 5, body: 'Условие отмены: {{cancellation_policy}}. Возврат средств: {{refund_policy}}. Фактически понесенные расходы: {{non_refundable_costs}}.', required: true },
    { id: 'cl-s-6', sectionKey: 'reschedule', title: 'Порядок переноса даты', order: 6, body: 'Правило переноса даты мероприятия: {{reschedule_policy}}.', required: true },
    { id: 'cl-s-7', sectionKey: 'force_majeure', title: 'Форс-мажор', order: 7, body: 'Политика непреодолимой силы: {{force_majeure_policy}}.', required: true },
    { id: 'cl-s-8', sectionKey: 'confirmations', title: 'Подтверждение и подписи', order: 8, body: 'Стороны фиксируют согласование условий средствами платформы. Юридический способ заключения и подписания определяется применимым договорным сценарием и подключённым сервисом электронной подписи.', required: true }
  ];
}

export function createVenueRentClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'subject', title: 'Предмет договора аренды площадки', body: 'Площадка предоставляет во временное пользование Заказчику пространство (зал): {{hall_name}}.' },
    { sectionKey: 'price', title: 'Стоимость аренды и залог', body: 'Стоимость аренды: {{rent_cost}} руб. Обеспечительный залог за имущество: {{security_deposit}} руб.' },
    { sectionKey: 'venue_restrictions', title: 'Ограничения и правила площадки', body: 'Запрет шума после {{quiet_hours}}. Использование конфетти и открытого огня: {{fire_rules}}.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createVenueServicesClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'subject', title: 'Предмет договора обслуживания площадки', body: 'Площадка оказывает комплекс услуг банкетного обслуживания на {{guests_count}} гостей.' },
    { sectionKey: 'price', title: 'Стоимость питания и обслуживания', body: 'Стоимость меню: {{catering_cost}} руб. Пробковый сбор: {{cork_fee}} руб. Общая сумма: {{price}} руб.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createVenueMixedClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'subject', title: 'Предмет смешанного договора площадки', body: 'Площадка предоставляет аренду зала {{hall_name}}, банкетное обслуживание и техническое сопровождение.' },
    { sectionKey: 'price', title: 'Состав стоимости смешанного договора', body: 'Аренда: {{rent_cost}} руб. Питание: {{catering_cost}} руб. Оборудование: {{tech_cost}} руб. Итоговая стоимость: {{price}} руб.' },
    { sectionKey: 'venue_restrictions', title: 'Правила пространства и алкоголь', body: 'Пробковый сбор: {{cork_fee}} руб. Ограничения шума: {{quiet_hours}}.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createHostClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'service_scope', title: 'Программа ведущего', body: 'Ведущий проводит программу длительностью {{duration}} часов по авторскому сценарию ({{script}}).' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createDjClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'service_scope', title: 'Музыкальное сопровождение', body: 'Диджей обеспечивает звуковое сопровождение согласно музыкальному брифу ({{music_brief}}). Стоп-лист: {{do_not_play_list}}.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createPhotoVideoClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'service_scope', title: 'Съемка и передача материалов', body: 'Исполнитель производит съемку и передает готовый материал в количестве {{photo_count}} шт. в течение {{delivery_days}} дней.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createDecoratorClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'service_scope', title: 'Оформление и демонтаж', body: 'Декоратор осуществляет монтаж декораций до {{setup_deadline}} и демонтаж после окончания мероприятия.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createCateringClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'service_scope', title: 'Выездное питание', body: 'Кейтеринг обеспечивает обслуживание на {{guests_count}} человек по согласованному меню.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createEquipmentClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'service_scope', title: 'Технический райдер и оборудование', body: 'Доставка, монтаж и звукорежиссура комплекта оборудования согласно спецификации.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createArtistClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'service_scope', title: 'Выступление артиста и райдер', body: 'Выступление артиста длительностью {{performance_duration}} мин. Выполнение бытового и технического райдера.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createTransportClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'service_scope', title: 'Транспортные услуги', body: 'Подача транспортного средства ({{vehicle_type}}) по маршруту: {{route_details}}.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function createOrganizerClauses(custom: Partial<ContractClause>[] = []): ContractClause[] {
  const base = createCommonServiceClauses();
  const overrides: Partial<ContractClause>[] = [
    { sectionKey: 'service_scope', title: 'Организация и координация', body: 'Организатор осуществляет разработку тайминга, подбор команды и полную координацию в день события.' }
  ];
  return createClausesWithOverrides(base, [...overrides, ...custom]);
}

export function buildPlatformPolicy(params: {
  id: string;
  title: string;
  code: string;
  description: string;
  operatorName?: string;
  terms?: string;
}) {
  return {
    id: params.id,
    title: params.title,
    code: params.code,
    description: params.description,
    category: 'platform' as const,
    documentKind: 'platform_policy' as const,
    partyRoles: ['platform' as const],
    currentVersionId: `${params.id}-v1`,
    versions: [
      {
        id: `${params.id}-v1`,
        templateId: params.id,
        version: '1.0.0',
        status: 'legal_review' as const,
        changeReason: 'Инициализация платформенного регламента',
        clauses: createPlatformClauses([
          { sectionKey: 'parties', body: `Оператор Платформы: ${params.operatorName || '{{platform_operator_name}}'}` },
          { sectionKey: 'subject', body: params.terms || 'Регламент работы сервиса' }
        ]),
        createdAt: new Date().toISOString()
      }
    ]
  };
}

export function buildConsentDocument(params: {
  id: string;
  title: string;
  code: string;
  description: string;
  operatorName?: string;
  purpose?: string;
}) {
  return {
    id: params.id,
    title: params.title,
    code: params.code,
    description: params.description,
    category: 'platform' as const,
    documentKind: 'consent' as const,
    partyRoles: ['client' as const],
    currentVersionId: `${params.id}-v1`,
    versions: [
      {
        id: `${params.id}-v1`,
        templateId: params.id,
        version: '1.0.0',
        status: 'legal_review' as const,
        changeReason: 'Инициализация согласия на обработку ПДн',
        clauses: createConsentClauses([
          { sectionKey: 'subject', body: `Оператор персональных данных: ${params.operatorName || '{{data_operator_name}}'}` },
          { sectionKey: 'purpose', body: `Настоящее согласие дается на обработку персональных данных в целях: ${params.purpose || '{{consent_purpose}}'}` }
        ]),
        createdAt: new Date().toISOString()
      }
    ]
  };
}
