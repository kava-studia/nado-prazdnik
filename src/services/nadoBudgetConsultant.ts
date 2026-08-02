import { NadoEventSegment, EventProject } from '../types';

export interface BudgetScenarios {
  recommendations: string[];
  alternatives: {
    title: string;
    description: string;
    impact: string;
    actionLabel: string;
    actionType: 'reduce_guests' | 'adjust_priorities' | 'increase_budget' | 'use_package';
  }[];
  segment: NadoEventSegment;
  distribution: { category: string; amount: number; percentage: number }[];
}

export const getSegment = (budget: number, guestCount: number): NadoEventSegment => {
  const perGuest = budget / (guestCount || 1);
  if (perGuest < 2500 || budget < 100000) {
    return NadoEventSegment.START;
  } else if (perGuest < 8000 || budget < 400000) {
    return NadoEventSegment.CLASSIC;
  } else {
    return NadoEventSegment.PREMIUM;
  }
};

export const calculateBudgetDistribution = (
  budget: number,
  segment: NadoEventSegment,
  priorityIds: string[] = []
): { category: string; amount: number; percentage: number }[] => {
  // Category splits depending on segment
  let distribution: Record<string, number> = {};

  if (segment === NadoEventSegment.START) {
    distribution = {
      venue: 0.35,      // Площадка и банкет
      hosts: 0.25,      // Ведущий
      djs: 0.15,        // Диджей / Звук
      decorators: 0.10, // Декор (минимум)
      photo: 0.10,      // Фото / Видео
      other: 0.05       // Прочее
    };
  } else if (segment === NadoEventSegment.PREMIUM) {
    distribution = {
      venue: 0.40,
      hosts: 0.18,
      djs: 0.10,
      decorators: 0.15,
      photo: 0.12,
      other: 0.05
    };
  } else {
    // Classic default
    distribution = {
      venue: 0.38,
      hosts: 0.20,
      djs: 0.12,
      decorators: 0.12,
      photo: 0.13,
      other: 0.05
    };
  }

  // Adjust distribution based on user priorities if selected
  if (priorityIds.length > 0) {
    const boost = 0.08;
    let totalBoost = 0;
    
    // Decrease other categories slightly to pay for priorities
    priorityIds.forEach(pId => {
      if (distribution[pId] !== undefined) {
        distribution[pId] += boost;
        totalBoost += boost;
      }
    });

    const nonPriorityKeys = Object.keys(distribution).filter(k => !priorityIds.includes(k) && k !== 'other');
    if (nonPriorityKeys.length > 0) {
      const reduction = totalBoost / nonPriorityKeys.length;
      nonPriorityKeys.forEach(k => {
        distribution[k] = Math.max(0.05, distribution[k] - reduction);
      });
    }
  }

  // Normalize back to 100% just in case
  const totalWeight = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  
  return Object.entries(distribution).map(([category, weight]) => {
    const normalizedWeight = weight / totalWeight;
    return {
      category,
      amount: Math.round(budget * normalizedWeight),
      percentage: Math.round(normalizedWeight * 100)
    };
  });
};

export const analyzeBudget = (budget: number, guestCount: number, priorityIds: string[] = []): BudgetScenarios => {
  const segment = getSegment(budget, guestCount);
  const distribution = calculateBudgetDistribution(budget, segment, priorityIds);
  const costPerGuest = Math.round(budget / (guestCount || 1));

  const recommendations: string[] = [];
  const alternatives: BudgetScenarios['alternatives'] = [];

  if (segment === NadoEventSegment.START) {
    recommendations.push(
      'NADO рекомендует уютный камерный формат с акцентом на близкое общение.',
      'Для оптимизации бюджета рассмотрите площадки с возможностью своего алкоголя без пробкового сбора.',
      'Плейлист диджея может включать индивидуальные пожелания гостей для душевного интерактива.'
    );

    alternatives.push(
      {
        title: 'Уютный семейный ужин',
        description: 'Снижение количества гостей до 15-20 человек позволит выбрать более изысканную кухню и повысить уровень сервиса без изменения бюджета.',
        impact: `Стоимость на гостя возрастет до ${Math.round(budget / 15).toLocaleString('ru-RU')} ₽, открывая доступ к классическим ресторанам.`,
        actionLabel: 'Оптимизировать список гостей',
        actionType: 'reduce_guests'
      },
      {
        title: 'Фокус на ярких эмоциях',
        description: 'Сделайте приоритетом ведущего и диджея, а декор выполните в минималистичном или эко-стиле. Это создаст отличную атмосферу при меньших затратах.',
        impact: 'Перераспределение средств выделит до 35% бюджета на развлекательную программу.',
        actionLabel: 'Выбрать шоу в приоритет',
        actionType: 'adjust_priorities'
      },
      {
        title: 'Готовые NADO-пакеты',
        description: 'Воспользуйтесь партнерскими пакетными предложениями «Все включено» от проверенных площадок для снижения сметы на 15-20%.',
        impact: 'Экономия за счет комплексных скидок подрядчиков.',
        actionLabel: 'Посмотреть пакеты',
        actionType: 'use_package'
      }
    );
  } else if (segment === NadoEventSegment.CLASSIC) {
    recommendations.push(
      'Оптимальный бюджет для полноценного классического торжества с профессиональным ведущим и DJ.',
      'Рекомендуем уделить внимание зонированию площадки: фотозона, welcome-зона и сцена.',
      'Фотограф и видеограф помогут сохранить каждую деталь этого важного дня.'
    );

    alternatives.push(
      {
        title: 'Переход в Премиум-класс',
        description: 'При незначительном увеличении бюджета на 20-30% вы сможете пригласить топового ведущего с ТВ-опытом и дополнить декор авторской флористикой.',
        impact: 'Уровень мероприятия повышается до премиального за счет точечных улучшений.',
        actionLabel: 'Рассчитать Премиум смету',
        actionType: 'increase_budget'
      },
      {
        title: 'Акцент на технологичность',
        description: 'Направьте часть средств на профессиональное световое и звуковое оборудование (аплайтинг, тяжелый дым). Это визуально удорожает площадку в разы.',
        impact: 'Максимальный вау-эффект от визуальной составляющей.',
        actionLabel: 'Сделать акцент на свет/звук',
        actionType: 'adjust_priorities'
      }
    );
  } else {
    // PREMIUM
    recommendations.push(
      'Премиальный статус события: индивидуальная концепция, эксклюзивные декорации и топовые специалисты.',
      'Рекомендуется привлечение координатора на весь день для безупречного тайминга.',
      'Возможность интеграции интерактивных диджитал-зон и профессионального технического продакшена.'
    );

    alternatives.push(
      {
        title: 'Режиссерское шоу',
        description: 'Для премиум сегмента важно создать единую сюжетную линию. Интегрируйте выступления артистов оригинального жанра и кавер-группы.',
        impact: 'Полная вовлеченность гостей и создание масштабного шоу.',
        actionLabel: 'Добавить артистов в план',
        actionType: 'adjust_priorities'
      },
      {
        title: 'Концептуальный арт-декор',
        description: 'Замените стандартное оформление масштабными арт-объектами и кинетическими инсталляциями, отражающими вашу историю.',
        impact: 'Уникальный визуальный стиль, который надолго запомнится гостям.',
        actionLabel: 'Выбрать декор главным приоритетом',
        actionType: 'adjust_priorities'
      }
    );
  }

  return {
    recommendations,
    alternatives,
    segment,
    distribution
  };
};
