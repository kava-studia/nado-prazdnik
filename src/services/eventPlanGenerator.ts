import { EventProject, EventPlanItem, BudgetCategory, Task, Message, NadoEventSegment } from '../types';
import {
  BOOKABLE_SERVICE_CATEGORIES,
  BOOKABLE_SERVICE_OPTIONS,
  EVENT_PLAN_TEMPLATES
} from '../data/eventPlanTemplates';
import { calculateProjectProgress } from '../utils/projectProgress';
import { getSegment, calculateBudgetDistribution } from './nadoBudgetConsultant';
import { generateEventPlan as generatePlannerData } from './aiEventPlanner';

export interface GeneratorInput {
  name?: string;
  eventType: string;
  city: string;
  address?: string;
  date: string;
  time?: string;
  dateUnknown: boolean;
  guestsCount: number;
  budgetRange: string;
  budgetTotal: number;
  style: string;
  alreadyHave: string[]; // e.g. ['venue', 'host'] or ['none']
  requestedServices?: string[];
}

export function generateEventPlan(input: GeneratorInput): EventProject {
  let projectId = '';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    projectId = crypto.randomUUID();
  } else {
    const randomStr = Math.random().toString(36).substring(2, 10);
    projectId = `event-${Date.now()}-${randomStr}`;
  }
  
  // Normalize alreadyHave
  let cleanAlreadyHave = input.alreadyHave || [];
  if (cleanAlreadyHave.includes('none') || cleanAlreadyHave.length === 0) {
    cleanAlreadyHave = [];
  }
  const requestedServices = Array.from(new Set(input.requestedServices || []));

  const selectedType = input.eventType || 'Свадьба';
  const baseTemplate = EVENT_PLAN_TEMPLATES[selectedType] || EVENT_PLAN_TEMPLATES['Другое'];
  const templateCategories = new Set(baseTemplate.map((item) => item.category));
  const extraSelectedServices = BOOKABLE_SERVICE_OPTIONS
    .filter((option) => (
      (requestedServices.includes(option.category) || cleanAlreadyHave.includes(option.category))
      && !templateCategories.has(option.category)
    ))
    .map((option, index) => ({
      ...option,
      order: baseTemplate.length + index + 1,
      required: false
    }));
  const template = [...baseTemplate, ...extraSelectedServices];

  // Map template items to real EventPlanItems
  const planItems: EventPlanItem[] = template.map((item) => {
    const hasService = cleanAlreadyHave.includes(item.category);
    const wantsService = requestedServices.includes(item.category);
    const isBookableService = BOOKABLE_SERVICE_CATEGORIES.has(item.category);
    const isIncluded = !isBookableService || hasService || wantsService;
    return {
      id: `plan-${item.category}-${item.order}-${projectId}`,
      category: item.category,
      title: item.title,
      description: item.description,
      required: false,
      order: item.order,
      status: hasService ? 'completed' : isIncluded ? 'not_started' : 'skipped',
      route: item.route
    };
  });

  // Calculate neededServices
  const neededServices = requestedServices.filter((category) => !cleanAlreadyHave.includes(category));

  // Determine NADO budget segment
  const budgetTotal = Number.isFinite(input.budgetTotal) && input.budgetTotal >= 0
    ? input.budgetTotal
    : 0;
  const nadoSegment = budgetTotal > 0
    ? getSegment(budgetTotal, input.guestsCount)
    : NadoEventSegment.CUSTOM;

  // Generate dynamic tasks and concepts via AI Event Planner
  const plannerData = generatePlannerData(selectedType, nadoSegment, input.guestsCount);

  // Map planner tasks into our real Tasks structure
  const plannerCategoryToService: Record<string, string | undefined> = {
    venue: 'venue',
    hosts: 'host',
    djs: 'dj',
    decorators: 'decorator',
    photo: 'photographer'
  };
  const selectedOrOwnedServices = new Set([...requestedServices, ...cleanAlreadyHave]);
  const relevantPlannerTasks = plannerData.tasks.filter((task) => {
    const serviceCategory = plannerCategoryToService[task.category];
    return !serviceCategory || selectedOrOwnedServices.has(serviceCategory);
  });

  const tasks: Task[] = relevantPlannerTasks.map((pt, idx) => {
    // Check if user already booked this category
    const serviceCategory = plannerCategoryToService[pt.category];
    const isCompleted = serviceCategory ? cleanAlreadyHave.includes(serviceCategory) : false;
    
    // Calculate dueDate based on event date minus days before, or fallback to +30 days
    let dueDate = '';
    if (input.date && input.date !== 'Дата обсуждается' && !input.dateUnknown) {
      const eventTime = new Date(input.date).getTime();
      const offsetMs = pt.deadlineDaysBefore * 24 * 60 * 60 * 1000;
      dueDate = new Date(Math.max(Date.now(), eventTime - offsetMs)).toISOString().split('T')[0];
    } else {
      dueDate = new Date(Date.now() + (90 - pt.deadlineDaysBefore) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    return {
      id: `task-${pt.id}-${projectId}`,
      title: pt.title,
      dueDate,
      isCompleted,
      category: pt.category === 'venue' ? 'Площадка' : (pt.category as string) === 'drinks' ? 'Напитки' : 'Команда',
      notes: `${pt.description}\n\nNADO: Совет эксперта: ${pt.tips || ''}`
    };
  });

  // Calculate budget distribution via NADO Budget Consultant
  const baseDistribution = calculateBudgetDistribution(budgetTotal, nadoSegment, []);
  const budgetCategoryIsRelevant: Record<string, boolean> = {
    venue: selectedOrOwnedServices.has('venue') || selectedOrOwnedServices.has('catering'),
    hosts: selectedOrOwnedServices.has('host') || selectedOrOwnedServices.has('organizer'),
    djs: selectedOrOwnedServices.has('dj') || selectedOrOwnedServices.has('equipment'),
    decorators: selectedOrOwnedServices.has('decorator') || selectedOrOwnedServices.has('florist'),
    photo: selectedOrOwnedServices.has('photographer') || selectedOrOwnedServices.has('videographer'),
    other: true
  };
  const filteredDistribution = baseDistribution.filter((item) => budgetCategoryIsRelevant[item.category]);
  const filteredPercentageTotal = filteredDistribution.reduce((sum, item) => sum + item.percentage, 0) || 1;
  let allocatedBudget = 0;
  let allocatedPercentage = 0;
  const distribution = filteredDistribution.map((item, index) => {
    const isLast = index === filteredDistribution.length - 1;
    const ratio = item.percentage / filteredPercentageTotal;
    const percentage = isLast ? 100 - allocatedPercentage : Math.round(ratio * 100);
    const amount = isLast ? budgetTotal - allocatedBudget : Math.round(budgetTotal * ratio);
    allocatedBudget += amount;
    allocatedPercentage += percentage;
    return { ...item, percentage, amount };
  });
  const budgetItems: BudgetCategory[] = [];

  const categoryNames: Record<string, string> = {
    venue: 'Площадка и банкет',
    catering: 'Кейтеринг и питание',
    hosts: 'Ведущий шоу-программы',
    djs: 'Диджей, звук и свет',
    decorators: 'Декор и оформление',
    photo: 'Фото и видеопродакшн',
    other: 'Свободный резерв'
  };

  distribution.forEach((item, idx) => {
    budgetItems.push({
      id: `budget-${item.category}-${projectId}`,
      name: categoryNames[item.category] || item.category,
      allocated: item.amount,
      spent: 0,
      isPaid: false
    });
  });

  // Create initial welcoming system messages following "Что-то надо? Кидай в NADO" philosophy
  const messages: Message[] = [
    {
      id: `msg-welcome-1-${projectId}`,
      sender: 'system',
      senderName: 'NADO Консультант',
      text: budgetTotal > 0
        ? `Ваш персональный план «NADO ПРАЗДНИК» для события «${input.name || `Праздник в г. ${input.city}`}» готов. Ориентир бюджета - ${budgetTotal.toLocaleString('ru-RU')} ₽.`
        : `Ваш персональный план «NADO ПРАЗДНИК» для события «${input.name || `Праздник в г. ${input.city}`}» готов. Бюджет пока не задан - его можно добавить позже без пересоздания проекта.`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: `msg-welcome-2-${projectId}`,
      sender: 'system',
      senderName: 'NADO Консультант',
      text: `«Что-то надо? Кидай в NADO»! Мы добавили только выбранные вами услуги и ${tasks.length} полезных задач. Любой пункт можно убрать или вернуть в план — состав праздника определяете вы.`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }
  ];

  const progressPercent = calculateProjectProgress(planItems);

  const newProject: EventProject = {
    id: projectId,
    name: input.name || `${selectedType === 'Wedding' ? 'Свадьба' : selectedType === 'Birthday' ? 'День рождения' : selectedType === 'Corporate' ? 'Корпоратив' : selectedType} в г. ${input.city}`,
    eventType: selectedType,
    city: input.city,
    address: input.address || 'Адрес обсуждается',
    date: input.date || 'Дата обсуждается',
    time: input.time || '18:00',
    dateUnknown: input.dateUnknown || false,
    guestsCount: input.guestsCount || 0,
    budgetRange: input.budgetRange || 'Обсуждается',
    budgetTotal,
    budgetPaid: 0,
    style: input.style || 'Не выбран',
    alreadyHave: cleanAlreadyHave,
    neededServices,
    planItems,
    tasks,
    budgetItems,
    team: [],
    contractorRequests: [],
    bookings: [],
    drinksCalculation: null,
    messages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'planning',
    progressPercent,
    selectedPackage: null,
    nadoSegment,
    selectedPriorityIds: [],
    budgetFlexibility: 'balanced'
  };

  return newProject;
}
