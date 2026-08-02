import { EventProject, EventPlanItem, BudgetCategory, Task, Message, NadoEventSegment } from '../types';
import { EVENT_PLAN_TEMPLATES } from '../data/eventPlanTemplates';
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

  const selectedType = input.eventType || 'Свадьба';
  const template = EVENT_PLAN_TEMPLATES[selectedType] || EVENT_PLAN_TEMPLATES['Другое'];

  // Map template items to real EventPlanItems
  const planItems: EventPlanItem[] = template.map((item) => {
    const hasService = cleanAlreadyHave.includes(item.category);
    return {
      id: `plan-${item.category}-${projectId}`,
      category: item.category,
      title: item.title,
      description: item.description,
      required: item.required,
      order: item.order,
      status: hasService ? 'completed' : 'not_started',
      route: item.route
    };
  });

  // Calculate neededServices
  const allTemplateCategories = Array.from(new Set(template.map(item => item.category)));
  const neededServices = allTemplateCategories.filter(cat => !cleanAlreadyHave.includes(cat));

  // Determine NADO budget segment
  const budgetTotal = input.budgetTotal || 250000;
  const nadoSegment = getSegment(budgetTotal, input.guestsCount);

  // Generate dynamic tasks and concepts via AI Event Planner
  const plannerData = generatePlannerData(selectedType, nadoSegment, input.guestsCount);

  // Map planner tasks into our real Tasks structure
  const tasks: Task[] = plannerData.tasks.map((pt, idx) => {
    // Check if user already booked this category
    const isCompleted = cleanAlreadyHave.includes(pt.category);
    
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
  const distribution = calculateBudgetDistribution(budgetTotal, nadoSegment, []);
  const budgetItems: BudgetCategory[] = [];

  const categoryNames: Record<string, string> = {
    venue: 'Площадка и банкет',
    catering: 'Кейтеринг и питание',
    hosts: 'Ведущий шоу-программы',
    djs: 'Диджей, звук и свет',
    decorators: 'Декор и оформление',
    photo: 'Фото и видеопродакшн',
    other: 'Прочее и сувениры'
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
      text: `Ваш персональный интерактивный план «NADO ПРАЗДНИК» для события «${input.name || `Праздник в г. ${input.city}`}» успешно подготовлен! Мы определили уровень события как «${nadoSegment}» с бюджетом ${budgetTotal.toLocaleString('ru-RU')} ₽.`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: `msg-welcome-2-${projectId}`,
      sender: 'system',
      senderName: 'NADO Консультант',
      text: `«Что-то надо? Кидай в NADO»! Мы сгенерировали ${tasks.length} ключевых задач подготовки и распределили бюджет по приоритетным направлениям. Начните с шага 1: выберите площадку в нашем каталоге.`,
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
