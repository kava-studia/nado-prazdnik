import { EventServiceCategory, EventPlanStatus } from '../types';

export interface TemplateItem {
  category: EventServiceCategory;
  title: string;
  description: string;
  required: boolean;
  order: number;
  route: string;
}

export const CATEGORY_TRANSLATIONS: Record<EventServiceCategory, string> = {
  venue: 'Площадка',
  organizer: 'Организатор',
  coordinator: 'Координатор',
  host: 'Ведущий',
  dj: 'Диджей',
  photographer: 'Фотограф',
  videographer: 'Видеограф',
  catering: 'Кейтеринг',
  menu: 'Меню',
  decorator: 'Декор',
  florist: 'Флористика',
  equipment: 'Оборудование',
  artists: 'Артисты и шоу',
  transport: 'Транспорт',
  accommodation: 'Проживание',
  invitations: 'Пригласительные',
  guests: 'Список гостей',
  seating: 'Рассадка гостей',
  drinks: 'Напитки',
  timeline: 'Тайминг',
  documents: 'Договоры и сметы'
};

export const STATUS_TRANSLATIONS: Record<EventPlanStatus, string> = {
  not_started: 'Ещё не начато',
  in_progress: 'Выбираем варианты',
  options_selected: 'Варианты выбраны',
  request_sent: 'Запрос отправлен',
  awaiting_confirmation: 'Ждём подтверждения',
  confirmed: 'Подтверждено',
  booked: 'Забронировано',
  completed: 'Готово',
  skipped: 'Пропущено'
};

export const EVENT_PLAN_TEMPLATES: Record<string, TemplateItem[]> = {
  'Свадьба': [
    { order: 1, category: 'organizer', title: 'Уточнить концепцию и формат', description: 'Определить стиль, цветовую гамму и общую идею торжества', required: true, route: '/project?tab=overview' },
    { order: 2, category: 'venue', title: 'Выбрать площадку', description: 'Подобрать банкетный зал, загородный клуб или лофт', required: true, route: '/catalog/venues' },
    { order: 3, category: 'catering', title: 'Определиться с кейтерингом', description: 'Выбрать формат питания: банкет, фуршет или выездной ресторан', required: true, route: '/catalog/catering' },
    { order: 4, category: 'host', title: 'Выбрать ведущего', description: 'Найти профессионала, который задаст тон празднику', required: true, route: '/catalog/hosts' },
    { order: 5, category: 'dj', title: 'Выбрать диджея', description: 'Организовать звуковое и музыкальное сопровождение', required: true, route: '/catalog/djs' },
    { order: 6, category: 'photographer', title: 'Выбрать фотографа', description: 'Сохранить лучшие моменты дня в качественных снимках', required: true, route: '/catalog/photographers' },
    { order: 7, category: 'videographer', title: 'Выбрать видеографа', description: 'Заказать свадебный клип или фильм', required: false, route: '/catalog/videographers' },
    { order: 8, category: 'decorator', title: 'Определиться с декором и флористикой', description: 'Оформить президиум, столы гостей и фотозону', required: true, route: '/catalog/decorators' },
    { order: 9, category: 'equipment', title: 'Проверить звук и свет', description: 'Согласовать технический райдер и аренду оборудования', required: true, route: '/catalog/equipment' },
    { order: 10, category: 'artists', title: 'Выбрать артистов или шоу', description: 'Кавер-группа, фокусники, танцевальное или световое шоу', required: false, route: '/catalog/artists' },
    { order: 11, category: 'transport', title: 'Транспорт и проживание', description: 'Заказать трансфер для гостей и трансфер для молодоженов', required: false, route: '/catalog/transport' },
    { order: 12, category: 'guests', title: 'Сформировать список гостей', description: 'Составить точный список и получить подтверждения', required: true, route: '/project?tab=guests' },
    { order: 13, category: 'seating', title: 'Подготовить рассадку', description: 'Распределить гостей по столам с учетом пожеланий', required: true, route: '/project?tab=tasks' },
    { order: 14, category: 'menu', title: 'Утвердить банкетное меню', description: 'Выбрать холодные закуски, горячее и распределить порции', required: true, route: '/project?tab=tasks' },
    { order: 15, category: 'drinks', title: 'Рассчитать алкоголь и напитки', description: 'Воспользоваться калькулятором напитков NADO ПРАЗДНИК', required: true, route: '/drinks-calculator' },
    { order: 16, category: 'timeline', title: 'Собрать финальный тайминг-план', description: 'Расписать свадебный день поминутно от сборов до салюта', required: true, route: '/project?tab=tasks' },
    { order: 17, category: 'documents', title: 'Проверить договоры и подтверждения', description: 'Убедиться в наличии подписанных соглашений со всеми подрядчиками', required: true, route: '/project?tab=overview' },
    { order: 18, category: 'coordinator', title: 'Подтвердить координатора', description: 'Назначить человека для контроля в день свадьбы', required: true, route: '/catalog/coordinators' },
    { order: 19, category: 'documents', title: 'Проверить итоговую смету', description: 'Свести все расходы, авансы и остатки платежей', required: true, route: '/project?tab=budget' },
    { order: 20, category: 'documents', title: 'Завершить подготовку', description: 'Все этапы успешно выполнены. Прекрасного торжества!', required: true, route: '/project?tab=overview' }
  ],
  'День рождения': [
    { order: 1, category: 'organizer', title: 'Концепция праздника', description: 'Определить тематику праздника и стиль гостей', required: true, route: '/project?tab=overview' },
    { order: 2, category: 'venue', title: 'Выбрать площадку', description: 'Арендовать лофт, ресторан или караоке-зал', required: true, route: '/catalog/venues' },
    { order: 3, category: 'host', title: 'Найти ведущего', description: 'Для ведения интерактивов и поздравлений', required: false, route: '/catalog/hosts' },
    { order: 4, category: 'dj', title: 'Выбрать диджея', description: 'Для фонового звука и зажигательной дискотеки', required: true, route: '/catalog/djs' },
    { order: 5, category: 'catering', title: 'Кейтеринг или банкет', description: 'Заказать фуршетные сеты или банкетную рассадку', required: true, route: '/catalog/catering' },
    { order: 6, category: 'photographer', title: 'Нанять фотографа', description: 'Сделать яркие репортажные кадры', required: false, route: '/catalog/photographers' },
    { order: 7, category: 'drinks', title: 'Рассчитать напитки', description: 'Провести расчет алкоголя на количество гостей', required: true, route: '/drinks-calculator' },
    { order: 8, category: 'timeline', title: 'Собрать тайминг', description: 'Зафиксировать время приезда гостей и подачи горячего', required: true, route: '/project?tab=tasks' }
  ],
  'Corporate': [
    { order: 1, category: 'organizer', title: 'Бриф корпоративного события', description: 'Определить цели, задачи и ценности компании для трансляции', required: true, route: '/project?tab=overview' },
    { order: 2, category: 'venue', title: 'Выбрать площадку для корпоратива', description: 'Конференц-зал, отель, загородная площадка или банкетный комплекс', required: true, route: '/catalog/venues' },
    { order: 3, category: 'host', title: 'Выбрать ведущего', description: 'Профессионал для работы с бизнес-аудиторией', required: true, route: '/catalog/hosts' },
    { order: 4, category: 'dj', title: 'Обеспечить звук и диджея', description: 'Качественное звуковое оборудование и фоновая музыка', required: true, route: '/catalog/djs' },
    { order: 5, category: 'catering', title: 'Утвердить меню или фуршет', description: 'Согласовать рационы питания и алкогольное сопровождение', required: true, route: '/catalog/catering' },
    { order: 6, category: 'photographer', title: 'Пригласить фотографа', description: 'Репортажная съемка для корпоративного архива', required: true, route: '/catalog/photographers' },
    { order: 7, category: 'equipment', title: 'Техническое обеспечение', description: 'Микрофоны, экраны, проекторы, сцена', required: true, route: '/catalog/equipment' },
    { order: 8, category: 'timeline', title: 'Детализировать тайминг', description: 'Официальная часть, награждение, банкет, дискотека', required: true, route: '/project?tab=tasks' }
  ]
};

// Fallback template for any other types
EVENT_PLAN_TEMPLATES['Корпоратив'] = EVENT_PLAN_TEMPLATES['Corporate'];
EVENT_PLAN_TEMPLATES['Выпускной'] = [
  { order: 1, category: 'venue', title: 'Выбрать место для выпускного', description: 'Ресторан, теплоход, загородный комплекс или лофт', required: true, route: '/catalog/venues' },
  { order: 2, category: 'host', title: 'Подобрать ведущего', description: 'Ведущий, который понимает молодежную аудиторию', required: true, route: '/catalog/hosts' },
  { order: 3, category: 'dj', title: 'Заказать диджея и свет', description: 'Музыкальное сопровождение дискотеки', required: true, route: '/catalog/djs' },
  { order: 4, category: 'photographer', title: 'Выбрать фотографа', description: 'Фотосессия выпускного класса или курса', required: true, route: '/catalog/photographers' },
  { order: 5, category: 'drinks', title: 'Сделать расчет напитков', description: 'Учесть безалкогольные напитки и соки', required: true, route: '/drinks-calculator' },
  { order: 6, category: 'timeline', title: 'Составить тайминг выпускного', description: 'От вручения аттестатов до рассвета', required: true, route: '/project?tab=tasks' }
];
EVENT_PLAN_TEMPLATES['Детский праздник'] = [
  { order: 1, category: 'venue', title: 'Подобрать детскую игровую или кафе', description: 'Специализированная площадка с игровой зоной', required: true, route: '/catalog/venues' },
  { order: 2, category: 'artists', title: 'Выбрать аниматоров или шоу', description: 'Любимые герои, научное шоу или мыльные пузыри', required: true, route: '/catalog/artists' },
  { order: 3, category: 'catering', title: 'Согласовать детское меню', description: 'Вкусные, полезные и привлекательные для детей блюда', required: true, route: '/catalog/catering' },
  { order: 4, category: 'decorator', title: 'Оформить зал шарами', description: 'Яркие фотозоны и декорации', required: false, route: '/catalog/decorators' }
];
EVENT_PLAN_TEMPLATES['Концерт'] = [
  { order: 1, category: 'venue', title: 'Забронировать концертную площадку', description: 'Клуб, концертный зал или открытая арена с гримерками', required: true, route: '/catalog/venues' },
  { order: 2, category: 'equipment', title: 'Технический райдер звука и света', description: 'Аренда профессионального оборудования', required: true, route: '/catalog/equipment' },
  { order: 3, category: 'dj', title: 'Согласовать диджея или звукорежиссера', description: 'Человек на пульте во время выступления', required: true, route: '/catalog/djs' },
  { order: 4, category: 'timeline', title: 'Расписать поминутный саундчек', description: 'Время настройки инструментов и выступления', required: true, route: '/project?tab=tasks' }
];
EVENT_PLAN_TEMPLATES['Фестиваль'] = [
  { order: 1, category: 'venue', title: 'Арендовать открытую или закрытую площадку', description: 'Большое пространство для зонирования', required: true, route: '/catalog/venues' },
  { order: 2, category: 'equipment', title: 'Сцена и звуковые порталы', description: 'Масштабный комплект звука, света и экранов', required: true, route: '/catalog/equipment' },
  { order: 3, category: 'timeline', title: 'Составить расписание сцены', description: 'Смена артистов, ведущих и интерактивных зон', required: true, route: '/project?tab=tasks' }
];
EVENT_PLAN_TEMPLATES['Другое'] = [
  { order: 1, category: 'venue', title: 'Выбрать площадку проведения', description: 'Определить подходящую локацию под формат', required: true, route: '/catalog/venues' },
  { order: 2, category: 'organizer', title: 'Общие задачи организации', description: 'Сформулировать основные шаги и зафиксировать цели', required: true, route: '/project?tab=tasks' },
  { order: 3, category: 'timeline', title: 'Составить тайминг праздника', description: 'Собрать воедино все пункты программы', required: true, route: '/project?tab=tasks' }
];
