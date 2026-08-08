import type { DemoScenario } from '../context/DemoModeContext';

export type PresentationRoleId = 'client' | 'contractor' | 'organizer' | 'venue' | 'owner';

export interface PresentationRole {
  id: PresentationRoleId;
  label: string;
  eyebrow: string;
  description: string;
  scenario: DemoScenario;
  path: string;
}

export const PRESENTATION_ROLES: PresentationRole[] = [
  {
    id: 'client',
    label: 'Клиент',
    eyebrow: 'Праздник под контролем',
    description: 'Готовность, команда, бюджет, задачи и документы в одном проекте.',
    scenario: 'event_ready',
    path: '/events/demo-proj-ready'
  },
  {
    id: 'contractor',
    label: 'Исполнитель',
    eyebrow: 'Заявки и загрузка',
    description: 'Новые лиды, SLA ответа, календарь, договоры и профессиональный рейтинг.',
    scenario: 'contractor',
    path: '/workspace/contractor'
  },
  {
    id: 'organizer',
    label: 'Организатор',
    eyebrow: 'Портфель мероприятий',
    description: 'Клиенты, команда, статусы и дедлайны нескольких проектов в одном кабинете.',
    scenario: 'organizer',
    path: '/workspace/organizer'
  },
  {
    id: 'venue',
    label: 'Площадка',
    eyebrow: 'Календарь ресурсов',
    description: 'Залы, свободные даты, резервы и защита от двойного бронирования.',
    scenario: 'venue',
    path: '/workspace/venue'
  },
  {
    id: 'owner',
    label: 'Владелец',
    eyebrow: 'Операционный центр',
    description: 'Роли, рекламации, безопасность, шаблоны договоров и аудит решений.',
    scenario: 'admin_contracts',
    path: '/workspace/admin'
  }
];

export const PRESENTATION_METRICS = [
  { value: '5', label: 'ролей в одной системе' },
  { value: '13', label: 'категорий услуг по выбору' },
  { value: '31', label: 'шаблон договора' },
  { value: '0', label: 'обязательных подрядчиков' }
] as const;
