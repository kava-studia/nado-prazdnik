import { AttachmentTemplate } from '../types';

export const defaultAttachmentTemplates: AttachmentTemplate[] = [
  {
    id: 'att-tz',
    name: 'Техническое задание',
    category: 'general',
    description: 'Детальные требования к результату работы подрядчика',
    defaultContent: 'Техническое задание включает требования Заказчика по проведению мероприятия.',
    variables: []
  },
  {
    id: 'att-timing',
    name: 'Тайминг-план события',
    category: 'general',
    description: 'Почасовой график проведения программы и монтажа',
    defaultContent: 'Тайминг-план:\n17:00 — Сбор гостей\n18:00 — Начало программы\n23:00 — Завершение.',
    variables: []
  },
  {
    id: 'att-estimate',
    name: 'Детализированная смета',
    category: 'financial',
    description: 'Расчёт стоимости всех включенных позиций и оборудования',
    defaultContent: 'Смета услуг:\n1. Основные услуги: {{price}} руб.\n2. Предоплата: {{prepayment}} руб.',
    variables: []
  },
  {
    id: 'att-payment-schedule',
    name: 'График платежей',
    category: 'financial',
    description: 'Даты и суммы аванса и окончательного расчета',
    defaultContent: 'График уплаты:\n- Аванс: {{prepayment}} руб. в течение 3 дней\n- Доплата: оставшаяся сумма до начала события.',
    variables: []
  },
  {
    id: 'att-tech-rider',
    name: 'Технический райдер',
    category: 'technical',
    description: 'Перечень звукового, светового и сценического оборудования',
    defaultContent: 'Технические требования: наличие электропитания 220V 5кВт, ровная сценическая площадка.',
    variables: []
  },
  {
    id: 'att-hospitality-rider',
    name: 'Бытовой райдер',
    category: 'hospitality',
    description: 'Требования к гримёрке, питанию и трансферу команды',
    defaultContent: 'Бытовые условия: отдельная отапливаемая гримерка, минеральная вода, горячее питание при съемке более 5 часов.',
    variables: []
  },
  {
    id: 'att-shotlist',
    name: 'Шот-лист и список локаций',
    category: 'media',
    description: 'Перечень обязательных кадров для фотографа и видеографа',
    defaultContent: 'Обязательные кадры: сборы, встреча гостей, церемония, семейные портреты, первый танец, разрезание торта.',
    variables: []
  },
  {
    id: 'att-playlist',
    name: 'Плейлист и стоп-лист',
    category: 'dj',
    description: 'Музыкальные предпочтения и запрещенные композиции',
    defaultContent: 'Плейлист:\n- Любимые жанры: Pop, Lounge, House\n- Стоп-лист: шансон, частушки.',
    variables: []
  },
  {
    id: 'att-decor-sketch',
    name: 'Эскиз и экспликация декора',
    category: 'decorator',
    description: 'Цветовая гамма, список композиций и материалы',
    defaultContent: 'Палитра: пастельные тона, белые розы, эвкалипт. Зона президиума и фотозона.',
    variables: []
  },
  {
    id: 'att-menu',
    name: 'Банкетное меню',
    category: 'catering',
    description: 'Состав блюд, выход в граммах и карта напитков',
    defaultContent: 'Банкетное меню на {{guests_count}} гостей:\n- Холодные закуски: 350г/чел\n- Горячие блюда: 400г/чел.',
    variables: []
  },
  {
    id: 'att-route',
    name: 'Маршрутный лист автотранспорта',
    category: 'transport',
    description: 'Адреса подач, промежуточные остановки и контактные лица',
    defaultContent: 'Маршрут: {{route_details}}. Время подачи: {{event_time}}.',
    variables: []
  },
  {
    id: 'att-venue-rules',
    name: 'Правила площадки',
    category: 'venue',
    description: 'Правила заезда, проведения шума и требования безопасности',
    defaultContent: 'Правила площадки:\n1. Ограничение шума: {{quiet_hours}}.\n2. Использование открытого огня: {{fire_rules}}.',
    variables: []
  },
  {
    id: 'att-equipment-act',
    name: 'Акт приема-передачи оборудования',
    category: 'technical',
    description: 'Перечень передаваемой техники и проверка ее исправности',
    defaultContent: 'Оборудование передано в комплектном и исправном состоянии.',
    variables: []
  },
  {
    id: 'att-reconciliation-act',
    name: 'Акт сверки взаиморасчётов',
    category: 'financial',
    description: 'Подтверждение отсутствия задолженностей между сторонами',
    defaultContent: 'Задолженность между Заказчиком и Исполнителем отсутствует.',
    variables: []
  },
  {
    id: 'att-act-services',
    name: 'Акт оказанных услуг',
    category: 'documents',
    description: 'Двусторонний документ о полном и качественном исполнении',
    defaultContent: 'Услуги оказаны в полном объёме, претензий по качеству и срокам стороны не имеют.',
    variables: []
  },
  {
    id: 'att-act-acceptance',
    name: 'Акт приёма площадки',
    category: 'venue',
    description: 'Фиксация состояния зала и имущества при передаче арендатору',
    defaultContent: 'Зал {{hall_name}} передан в надлежащем состоянии.',
    variables: []
  },
  {
    id: 'att-act-return',
    name: 'Акт возврата площадки',
    category: 'venue',
    description: 'Фиксация состояния зала после завершения мероприятия',
    defaultContent: 'Зал {{hall_name}} возвращён в чистоте.',
    variables: [],
    visibilityCondition: { field: 'rent_cost', operator: 'exists' }
  },
  {
    id: 'att-act-damage',
    name: 'Акт повреждений имущества',
    category: 'venue',
    description: 'Протокол фиксации причиненного ущерба',
    defaultContent: 'Описание повреждений и расчёт стоимости ремонта: {{property_damage}}.',
    variables: [],
    visibilityCondition: { field: 'security_deposit', operator: 'exists' }
  },
  {
    id: 'att-supp-agreement',
    name: 'Дополнительное соглашение',
    category: 'documents',
    description: 'Соглашение об изменении условий, объема услуг или стоимости',
    defaultContent: 'Стороны пришли к соглашению изменить условия договора.',
    variables: []
  },
  {
    id: 'att-notice-cancel',
    name: 'Уведомление об отмене бронирования',
    category: 'documents',
    description: 'Официальное уведомление о расторжении договора',
    defaultContent: 'Уведомляем об отмене заказа по причине отмены события.',
    variables: []
  },
  {
    id: 'att-notice-reschedule',
    name: 'Уведомление о переносе даты',
    category: 'documents',
    description: 'Заявление о согласовании новой даты проведения',
    defaultContent: 'Запрос на перенос даты с {{event_date}} на новую согласованную дату.',
    variables: []
  },
  {
    id: 'att-pyro-safety',
    name: 'Акт соблюдения техники безопасности',
    category: 'technical',
    description: 'Инструктаж по противопожарной безопасности и использованию спецэффектов',
    defaultContent: 'Заказчик и Исполнитель ознакомлены с правилами техники безопасности при использовании спецэффектов.',
    variables: []
  },
  {
    id: 'att-copyright-release',
    name: 'Соглашение о передаче авторских прав',
    category: 'media',
    description: 'Передача неисключительных прав на использование фото и видеоматериалов',
    defaultContent: 'Исполнитель передает Заказчику права на использование созданных медиаматериалов в личных целях.',
    variables: []
  },
  {
    id: 'att-confidentiality-nda',
    name: 'Соглашение о конфиденциальности (NDA)',
    category: 'general',
    description: 'Защита персональных данных гостей и условий приватных мероприятий',
    defaultContent: 'Стороны обязуются не разглашать конфиденциальные сведения о мероприятии и его участниках.',
    variables: []
  },
  {
    id: 'att-deposit-receipt',
    name: 'Расписка в получении обеспечительного платежа',
    category: 'financial',
    description: 'Документ о получении и условиях возврата страхового депозита',
    defaultContent: 'Подтверждается получение обеспечительного платежа в размере {{security_deposit}} руб.',
    variables: []
  }
];

export function getAttachmentsForCategory(
  category: string,
  _subcategory?: string,
  variableValues: Record<string, string> = {}
): AttachmentTemplate[] {
  return defaultAttachmentTemplates.filter(att => {
    const categoryMatches = 
      att.category === 'general' ||
      att.category === 'financial' ||
      att.category === 'documents' ||
      att.category === category ||
      (category === 'venue' && att.category === 'venue') ||
      (category === 'contractor' && (att.category === 'media' || att.category === 'dj' || att.category === 'technical' || att.category === 'decorator' || att.category === 'transport' || att.category === 'catering' || att.category === 'hospitality'));

    if (!categoryMatches) return false;

    if (att.visibilityCondition) {
      if (typeof att.visibilityCondition === 'object') {
        const val = variableValues[att.visibilityCondition.field];
        if (att.visibilityCondition.operator === 'exists') {
          return val !== undefined && val !== null && String(val).trim() !== '' && String(val) !== '0';
        }
      }
    }

    return true;
  });
}
