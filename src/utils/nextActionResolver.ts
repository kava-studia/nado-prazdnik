import { EventProject, EventPlanItem } from '../types';

export interface NextAction {
  title: string;
  description: string;
  buttonText: string;
  route: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  canSkip: boolean;
  category: string;
}

export function resolveNextAction(project: EventProject): NextAction {
  const planItems = project.planItems || [];

  const findItem = (cat: string): EventPlanItem | undefined => 
    planItems.find((p) => p.category === cat);

  const isCompleted = (cat: string): boolean => {
    const item = findItem(cat);
    return item ? (item.status === 'completed' || item.status === 'confirmed' || item.status === 'booked' || item.status === 'skipped') : false;
  };

  const isStartedOrMore = (cat: string): boolean => {
    const item = findItem(cat);
    return item ? item.status !== 'not_started' : false;
  };

  // 1. Venue is the absolute first dependency for almost everything
  const venueItem = findItem('venue');
  if (venueItem && !isCompleted('venue')) {
    return {
      title: 'Следующий шаг - выберите площадку',
      description: 'Площадка — основа мероприятия. От неё зависят кухня, декор, звуковое оборудование, рассадка гостей и возможный пробковый сбор.',
      buttonText: 'Подобрать площадку',
      route: '/catalog/venues',
      priority: 'high',
      reason: 'От площадки зависят кухня, декор, оборудование, рассадка и пробковый сбор.',
      canSkip: false,
      category: 'venue'
    };
  }

  // 2. Catering & Menu
  const cateringItem = findItem('catering');
  if (cateringItem && !isCompleted('catering')) {
    return {
      title: 'Определитесь с питанием и кейтерингом',
      description: 'Необходимо решить, какой будет кухня на выбранной площадке — банкетное меню от самой площадки или сторонний кейтеринг.',
      buttonText: 'Подобрать кейтеринг',
      route: '/catalog/catering',
      priority: 'high',
      reason: 'Банкетное меню или фуршет задают тон всему вечеру и составляют весомую часть сметы.',
      canSkip: false,
      category: 'catering'
    };
  }

  // 3. Host (Ведущий)
  const hostItem = findItem('host');
  if (hostItem && !isCompleted('host')) {
    return {
      title: 'Выберите ведущего события',
      description: 'Ведущий создаёт атмосферу праздника, помогает составить сценарий интерактивов и объединяет гостей.',
      buttonText: 'Подобрать ведущего',
      route: '/catalog/hosts',
      priority: 'high',
      reason: 'Ведущий пишет индивидуальный тайминг сценария, под который подстраивается вся остальная команда.',
      canSkip: !hostItem.required,
      category: 'host'
    };
  }

  // 4. DJ (Диджей)
  const djItem = findItem('dj');
  if (djItem && !isCompleted('dj')) {
    return {
      title: 'Выберите диджея или звук',
      description: 'Музыкальный специалист отвечает за плейлист, отбивки ведущего, танцевальные блоки и качественный звук.',
      buttonText: 'Подобрать диджея',
      route: '/catalog/djs',
      priority: 'high',
      reason: 'Диджей согласует плейлист и координирует технический райдер со звуковым оборудованием.',
      canSkip: !djItem.required,
      category: 'dj'
    };
  }

  // 5. Photographer (Фотограф)
  const photoItem = findItem('photographer');
  if (photoItem && !isCompleted('photographer')) {
    return {
      title: 'Выберите профессионального фотографа',
      description: 'Чтобы сохранить воспоминания в красивых и качественных кадрах, выберите фотографа заранее.',
      buttonText: 'Подобрать фотографа',
      route: '/catalog/photographers',
      priority: 'medium',
      reason: 'У хороших фотографов даты бронируются за несколько месяцев вперед.',
      canSkip: !photoItem.required,
      category: 'photographer'
    };
  }

  // 6. Decorator (Декор и Флористика) - depends on Venue
  const decoratorItem = findItem('decorator');
  if (decoratorItem && !isCompleted('decorator')) {
    return {
      title: 'Определитесь с декором и оформлением',
      description: 'Декоратор преобразит банкетный зал согласно концепции и цветовой гамме.',
      buttonText: 'Подобрать декоратора',
      route: '/catalog/decorators',
      priority: 'medium',
      reason: 'Декор нельзя окончательно рассчитать и утвердить без выбранной площадки.',
      canSkip: !decoratorItem.required,
      category: 'decorator'
    };
  }

  // 7. Equipment
  const equipItem = findItem('equipment');
  if (equipItem && !isCompleted('equipment')) {
    return {
      title: 'Согласуйте техническое оборудование',
      description: 'Проверьте, хватает ли звука и света на площадке для диджея и артистов.',
      buttonText: 'Подобрать оборудование',
      route: '/catalog/equipment',
      priority: 'medium',
      reason: 'Звуковое и световое оборудование зависит от площадки, требований диджея и артистов.',
      canSkip: !equipItem.required,
      category: 'equipment'
    };
  }

  // 8. Guests List (Список гостей)
  const guestsItem = findItem('guests');
  if (guestsItem && !isCompleted('guests')) {
    return {
      title: 'Сформируйте точный список гостей',
      description: 'Зафиксируйте количество приглашенных, чтобы рассчитать меню, рассадку и напитки.',
      buttonText: 'Заполнить список гостей',
      route: '/project?tab=tasks',
      priority: 'medium',
      reason: 'Точный список гостей необходим для заказа банкетных блюд и алкоголя.',
      canSkip: false,
      category: 'guests'
    };
  }

  // 9. Seating (Рассадка гостей) - depends on Venue & Guests
  const seatingItem = findItem('seating');
  if (seatingItem && !isCompleted('seating')) {
    return {
      title: 'Подготовьте схему рассадки',
      description: 'Разместите гостей по столам так, чтобы всем было комфортно и весело.',
      buttonText: 'Сделать рассадку гостей',
      route: '/project?tab=tasks',
      priority: 'medium',
      reason: 'Схема рассадки зависит от конфигурации площадки и точного списка подтвержденных гостей.',
      canSkip: false,
      category: 'seating'
    };
  }

  // 10. Menu Choice - depends on Venue & Catering
  const menuItem = findItem('menu');
  if (menuItem && !isCompleted('menu')) {
    return {
      title: 'Согласуйте банкетное меню',
      description: 'Определите количество холодных закусок, салатов и выберите горячие блюда для гостей.',
      buttonText: 'Утвердить меню',
      route: '/project?tab=tasks',
      priority: 'medium',
      reason: 'Меню зависит от возможностей выбранной площадки и требований кейтеринга.',
      canSkip: false,
      category: 'menu'
    };
  }

  // 11. Drinks (Напитки) - depends on Guests list & Venue corkage conditions
  const drinksItem = findItem('drinks');
  if (drinksItem && !isCompleted('drinks') && !project.drinksCalculation) {
    return {
      title: 'Рассчитайте алкогольные и безалкогольные напитки',
      description: 'Калькулятор NADO ПРАЗДНИК поможет точно рассчитать закупку напитков, чтобы избежать лишних трат и учесть пробковый сбор.',
      buttonText: 'Рассчитать напитки',
      route: '/drinks-calculator',
      priority: 'high',
      reason: 'Расчет закупки напитков и расчет пробкового сбора напрямую зависят от количества гостей и условий площадки.',
      canSkip: false,
      category: 'drinks'
    };
  }

  // 12. Timeline - depends on Host, Venue, Team
  const timelineItem = findItem('timeline');
  if (timelineItem && !isCompleted('timeline')) {
    return {
      title: 'Соберите финальный тайминг-план дня',
      description: 'Пропишите поминутно все вехи праздника — от приезда подрядчиков до завершения программы.',
      buttonText: 'Составить тайминг',
      route: '/project?tab=tasks',
      priority: 'high',
      reason: 'Финальный тайминг согласуется с ведущим, площадкой, диджеем и координатором.',
      canSkip: false,
      category: 'timeline'
    };
  }

  // 13. Coordinator
  const coordItem = findItem('coordinator');
  if (coordItem && !isCompleted('coordinator')) {
    return {
      title: 'Подтвердите координатора мероприятия',
      description: 'Человек на площадке, который проконтролирует подачу горячего, приезд артистов и расчеты с подрядчиками.',
      buttonText: 'Выбрать координатора',
      route: '/catalog/coordinators',
      priority: 'medium',
      reason: 'Координатор возьмет на себя все заботы в день праздника, дав вам насладиться моментом.',
      canSkip: !coordItem.required,
      category: 'coordinator'
    };
  }

  // 14. Document & final check
  const docItem = planItems.find(p => p.category === 'documents');
  if (docItem && docItem.status !== 'completed') {
    return {
      title: 'Проверьте договоры и смету',
      description: 'Убедитесь, что все подрядчики подтверждены, а бюджет полностью сошелся.',
      buttonText: 'Открыть смету проекта',
      route: '/project?tab=budget',
      priority: 'high',
      reason: 'Финальный аудит документов перед днем мероприятия исключает любые накладки.',
      canSkip: false,
      category: 'documents'
    };
  }

  // Fallback default
  return {
    title: 'Подготовка идет по плану!',
    description: 'Все основные этапы согласованы. Вы можете просмотреть детали, внести корректировки в чате или смету.',
    buttonText: 'Просмотреть кабинет',
    route: '/project?tab=overview',
    priority: 'low',
    reason: 'Все необходимые шаги подготовки для вашего типа мероприятия завершены.',
    canSkip: false,
    category: 'documents'
  };
}
