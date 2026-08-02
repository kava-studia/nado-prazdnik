import { ContractVariable } from '../types';

export const commonPolicyVariables: ContractVariable[] = [
  {
    key: 'cancellation_policy',
    label: 'Условия отмены заказа',
    description: 'Правило отмены заказа заказчиком или исполнителем',
    type: 'select',
    required: true,
    source: 'service',
    group: 'Юридические условия',
    defaultValue: 'Условие не определено',
    options: [
      'Условие не определено',
      'Бесплатная отмена за 14 дней до события',
      'Бесплатная отмена за 30 дней до события',
      'Отмена с возмещением фактически понесенных расходов',
      'Аванс не возвращается при отмене менее чем за 7 дней'
    ]
  },
  {
    key: 'reschedule_policy',
    label: 'Условия переноса даты',
    description: 'Порядок переноса даты проведения мероприятия',
    type: 'select',
    required: true,
    source: 'service',
    group: 'Юридические условия',
    defaultValue: 'Условие не определено',
    options: [
      'Условие не определено',
      'Бесплатный перенос при наличии свободной даты у Исполнителя',
      'Перенос с доплатой 10% от стоимости',
      'Перенос допускается не позднее чем за 10 дней до события'
    ]
  },
  {
    key: 'refund_policy',
    label: 'Порядок возврата средств',
    description: 'Регламент возврата аванса и полной оплаты',
    type: 'select',
    required: true,
    source: 'service',
    group: 'Юридические условия',
    defaultValue: 'Условие не определено',
    options: [
      'Условие не определено',
      'Возврат в течение 5 банковских дней за вычетом понесенных расходов',
      'Полный возврат при отмене по вине Исполнителя',
      'Возврат аванса пропорционально остатку дней'
    ]
  },
  {
    key: 'prepayment_due_rule',
    label: 'Срок внесения аванса',
    description: 'Правило и срок уплаты обеспечительного платежа',
    type: 'select',
    required: true,
    source: 'service',
    group: 'Оплата',
    defaultValue: 'Условие не определено',
    options: [
      'Условие не определено',
      'В течение 3 рабочих дней после подтверждения условий',
      'В момент согласования черновика',
      'За 14 дней до даты проведения'
    ]
  },
  {
    key: 'final_payment_rule',
    label: 'Срок окончательного расчета',
    description: 'Правило доплаты оставшейся суммы',
    type: 'select',
    required: true,
    source: 'service',
    group: 'Оплата',
    defaultValue: 'Условие не определено',
    options: [
      'Условие не определено',
      'В день проведения мероприятия до начала оказания услуг',
      'В течение 3 дней после окончания мероприятия',
      'За 1 день до даты проведения'
    ]
  },
  {
    key: 'non_refundable_costs',
    label: 'Фактически понесенные расходы',
    description: 'Порядок расчета и подтверждения невозвратных расходов',
    type: 'textarea',
    required: false,
    source: 'service',
    group: 'Юридические условия',
    defaultValue: 'Условие не определено'
  },
  {
    key: 'force_majeure_policy',
    label: 'Форс-мажорные обстоятельства',
    description: 'Освобождение от ответственности при чрезвычайных ситуациях',
    type: 'select',
    required: true,
    source: 'service',
    group: 'Юридические условия',
    defaultValue: 'Условие не определено',
    options: [
      'Условие не определено',
      'Освобождение сторон с возвратом нераспределенного аванса',
      'Перенос события на эквивалентный период без штрафов'
    ]
  }
];

export const commonServiceVariables: ContractVariable[] = [
  { key: 'client_name', label: 'ФИО / Наименование Заказчика', description: 'Полные данные Заказчика', type: 'text', required: true, source: 'client', group: 'Стороны' },
  { key: 'contractor_name', label: 'ФИО / Наименование Исполнителя', description: 'Полные данные Исполнителя', type: 'text', required: true, source: 'contractor', group: 'Стороны' },
  { key: 'event_date', label: 'Дата мероприятия', description: 'Дата проведения события', type: 'date', required: true, source: 'event', group: 'Детали события' },
  { key: 'event_time', label: 'Время начала', description: 'Время начала работы Исполнителя', type: 'time', required: true, source: 'event', group: 'Детали события' },
  { key: 'event_location', label: 'Адрес проведения', description: 'Точный адрес площадки', type: 'address', required: true, source: 'event', group: 'Детали события' },
  { key: 'price', label: 'Общая стоимость (руб)', description: 'Итоговая сумма по договору', type: 'money', required: true, source: 'service', group: 'Финансы' },
  { key: 'prepayment', label: 'Сумма аванса (руб)', description: 'Размер предоплаты', type: 'money', required: true, source: 'service', group: 'Финансы' },
  { key: 'service_composition', label: 'Состав услуг', description: 'Перечень включенных позиций', type: 'textarea', required: true, source: 'service', group: 'Предмет' },
  ...commonPolicyVariables
];
