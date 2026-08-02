import { NadoEventSegment } from '../types';

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  category: 'venue' | 'hosts' | 'djs' | 'decorators' | 'photo' | 'other';
  deadlineDaysBefore: number; // Days before event
  status: 'pending' | 'completed';
  tips?: string;
}

export interface EventConcept {
  name: string;
  tagline: string;
  description: string;
  elements: {
    title: string;
    description: string;
  }[];
  colorPalette: string[];
}

export interface GeneratedEventPlan {
  concepts: EventConcept[];
  tasks: PlanTask[];
  suggestedSteps: string[];
}

// Deterministic planner based on event type and segment
export const generateEventPlan = (
  eventType: string,
  segment: NadoEventSegment,
  guests: number
): GeneratedEventPlan => {
  const normalizedType = eventType.toLowerCase();
  const concepts: EventConcept[] = [];
  const tasks: PlanTask[] = [];

  // 1. CONCEPTS GENERATION
  if (normalizedType.includes('свадьб') || normalizedType.includes('wedding')) {
    if (segment === NadoEventSegment.PREMIUM) {
      concepts.push({
        name: 'Platinum Elegance',
        tagline: 'Современное прочтение классической роскоши',
        description: 'Торжество, погруженное в холодный блеск платины, зеркальные поверхности и хрустальные инсталляции, дополненные нежной пастельной флористикой.',
        elements: [
          { title: 'Зонирование', description: 'Интерактивная зеркальная фотозона и отдельный коктейльный подиум с живой арфой.' },
          { title: 'Шоу-программа', description: 'Кавер-группа топ-уровня, лазерный перформанс на воде и иммерсивный первый танец.' },
          { title: 'Декор', description: 'Свисающие глицинии, масштабные хрустальные люстры и золоченые приборы.' }
        ],
        colorPalette: ['#E5E5E5', '#FFFFFF', '#D4AF37', '#1A2332']
      });
      concepts.push({
        name: 'Metropolitan Night',
        tagline: 'Динамичный шик ночного мегаполиса',
        description: 'Вечеринка в стиле стильного пентхауса или лофта: неоновые акценты, геометрические конструкции, глубокие темные тона с золотым напылением.',
        elements: [
          { title: 'Welcome', description: 'Бармен-шоу с авторскими коктейлями по индивидуальным рецептам.' },
          { title: 'Свет и Звук', description: 'Кинетический световой потолок и мощная акустическая система.' },
          { title: 'Формат', description: 'Фуршетный стиль с лаундж-зонами вместо традиционной рассадки.' }
        ],
        colorPalette: ['#111111', '#1B2A47', '#C5A059', '#E63946']
      });
    } else {
      // START or CLASSIC wedding
      concepts.push({
        name: 'Cosmic Love',
        tagline: 'Ваша вселенная для двоих',
        description: 'Романтичная концепция, обыгрывающая звездное небо, космические туманности и бесконечность. Идеально ложится на дизайн-код NADO.',
        elements: [
          { title: 'Оформление', description: 'Глубокий синий фон, светодиодные гирлянды «звездное небо» и неоновые вывески.' },
          { title: 'Музыка', description: 'Космический эмбиент на welcome и любимый танцевальный поп в обработке DJ.' },
          { title: 'Финал', description: 'Зажжение бенгальских огней в кругу гостей под звездным небом.' }
        ],
        colorPalette: ['#0B132B', '#1C2541', '#DFC88F', '#FFFFFF']
      });
      concepts.push({
        name: 'Eco-Porcelain',
        tagline: 'Натуральная гармония и семейное тепло',
        description: 'Концепция, сочетающая природные элементы, сухоцветы, натуральное дерево со стильной фарфоровой и глиняной посудой.',
        elements: [
          { title: 'Атмосфера', description: 'Камерный уют, теплый свет ламп Эдисона, акцент на семейные ценности.' },
          { title: 'Активности', description: 'Пожелания гостей на глиняной вазе или создание общего семейного древа.' },
          { title: 'Подарки гостям', description: 'Баночки с крафтовым медом или суккуленты в глиняных горшочках.' }
        ],
        colorPalette: ['#E8E5E0', '#B5893F', '#4A5568', '#FFFFFF']
      });
    }
  } else if (normalizedType.includes('день') || normalizedType.includes('рожден') || normalizedType.includes('юбиле') || normalizedType.includes('birth')) {
    concepts.push({
      name: 'NADO Party Lounge',
      tagline: 'Кидай все заботы в NADO — время праздновать',
      description: 'Современный технологичный праздник без лишнего пафоса. Максимум общения, топовая музыка и интерактивные зоны для гостей.',
      elements: [
        { title: 'Зона развлечений', description: 'Игровая зона с ретро-автоматами или интерактивный квиз о виновнике торжества.' },
        { title: 'Формат кухни', description: 'Бранч или крафтовый стрит-фуд премиум класса (бургеры с трюфелем, авторские тапас).' },
        { title: 'Интерактив', description: 'Запись подкаста прямо во время праздника — гости делятся историями из жизни.' }
      ],
      colorPalette: ['#171A20', '#B5893F', '#F4F5F7', '#334155']
    });
    concepts.push({
      name: 'Neon & Retro',
      tagline: 'Назад в будущее с хорошим вкусом',
      description: 'Энергичный микс эстетики 90-х или нулевых с ультрасовременным неоновым освещением и интерактивными плейлистами.',
      elements: [
        { title: 'Дресс-код', description: 'Элементы ретро-шика, винил, металлизированные ткани.' },
        { title: 'Музыка', description: 'Ретро-хиты в современных танцевальных обработках от диджея.' },
        { title: 'Фотозона', description: 'Кассетная стена с неоновой надписью.' }
      ],
      colorPalette: ['#0F172A', '#F43F5E', '#06B6D4', '#DFC88F']
    });
  } else {
    // Corporates, parties, other
    concepts.push({
      name: 'White & Platinum Night',
      tagline: 'Абсолютная чистота и футуризм',
      description: 'Минималистичное стильное событие, где доминирует белый цвет, стекло, хром и динамическая архитектурная подсветка.',
      elements: [
        { title: 'Атмосфера', description: 'Иллюзия ледяного дворца или футуристического лайнера.' },
        { title: 'Кулинария', description: 'Молекулярный бар и необычные подачи блюд с сухим льдом.' },
        { title: 'Активация', description: 'Интерактивные 3D-проекции, реагирующие на движение гостей.' }
      ],
      colorPalette: ['#F8FAFC', '#E2E8F0', '#B5893F', '#0F172A']
    });
    concepts.push({
      name: 'Industrial Jazz',
      tagline: 'Эстетика лофта и живой звук',
      description: 'Теплый ламповый вечер в индустриальном интерьере, наполненный звуками саксофона, ароматом кофе и хорошего вина.',
      elements: [
        { title: 'Формат', description: 'Свободный лаундж с высокими барными столами и винным казино.' },
        { title: 'Лайв', description: 'Джаз-трио или выступление вокалиста.' },
        { title: 'Декор', description: 'Зелень, металл, теплые гирлянды.' }
      ],
      colorPalette: ['#27272A', '#D4AF37', '#7F1D1D', '#F4F4F5']
    });
  }

  // 2. TIMELINE TASKS GENERATION (Deterministic, scaled to deadline)
  const defaultTasks: { title: string; desc: string; cat: PlanTask['category']; days: number; tip: string }[] = [
    {
      title: 'Утвердить концепцию и формат',
      desc: 'Определиться со стилем праздника («Что-то надо? Кидай в NADO») и выбрать одну из предложенных концепций.',
      cat: 'other',
      days: 90,
      tip: 'Зафиксируйте цветовую гамму, чтобы все последующие закупки и заказы соответствовали выбранному коду.'
    },
    {
      title: 'Забронировать площадку',
      desc: 'Выбрать ресторан, лофт или загородную виллу, внести предоплату и зафиксировать дату в договоре.',
      cat: 'venue',
      days: 85,
      tip: 'Внимательно изучите условия пробкового сбора и аренды технического оборудования площадки.'
    },
    {
      title: 'Выбрать и нанять Ведущего праздника',
      desc: 'Провести интервью со специалистами из NADO-каталога, обсудить сценарный план и забронировать дату.',
      cat: 'hosts',
      days: 75,
      tip: 'Хороший ведущий — это 60% успеха атмосферы. Обратите внимание на стиль речи и портфолио.'
    },
    {
      title: 'Забронировать DJ и звуковое оборудование',
      desc: 'Согласовать музыкальные предпочтения, технический райдер и необходимое световое оборудование.',
      cat: 'djs',
      days: 65,
      tip: 'Обязательно закажите комплект аплайтинга (светового декора) — он преобразит любую площадку.'
    },
    {
      title: 'Утвердить декор и флористику',
      desc: 'Составить мудборд оформления столов гостей, президиума, фотозоны и согласовать с декоратором.',
      cat: 'decorators',
      days: 45,
      tip: 'Вместо обилия мелких деталей сделайте одну крупную вау-зону (например, необычную фотозону).'
    },
    {
      title: 'Нанять Фотографа / Видеографа',
      desc: 'Согласовать тайминг съемочного дня, места для фотосессии и зафиксировать условия передачи материала.',
      cat: 'photo',
      days: 40,
      tip: 'Договоритесь о получении первых 15-20 фото в течение 3 дней после события для публикации в соцсетях.'
    },
    {
      title: 'Рассчитать напитки и составить меню',
      desc: 'Используйте NADO калькулятор напитков, согласуйте банкетное меню с учетом предпочтений гостей.',
      cat: 'other',
      days: 30,
      tip: 'Заказывайте безалкогольные напитки с запасом 1.5-2 литра на человека, особенно в летний период.'
    },
    {
      title: 'Подготовить финальный тайминг дня',
      desc: 'Прописать детальное расписание: прибытие подрядчиков, приезд гостей, вынос горячего, финал.',
      cat: 'other',
      days: 10,
      tip: 'Заложите буферные 15-20 минут между ключевыми блоками программы на случай задержек гостей.'
    }
  ];

  defaultTasks.forEach((t, index) => {
    tasks.push({
      id: `task-${index + 1}`,
      title: t.title,
      description: t.desc,
      category: t.cat,
      deadlineDaysBefore: t.days,
      status: 'pending',
      tips: t.tip
    });
  });

  const suggestedSteps = [
    'Сделать первый шаг: Заполнить анкету события на главном экране',
    'Запустить подбор площадки через NADO-консультант',
    'Забронировать ведущего и DJ по специальным партнерским тарифам',
    'Рассчитать алкогольную карту в калькуляторе напитков',
    'Ознакомиться с правовым чек-листом для безопасности сделок'
  ];

  return {
    concepts,
    tasks,
    suggestedSteps
  };
};
