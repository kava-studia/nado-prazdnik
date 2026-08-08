import { describe, expect, test } from 'vitest';
import { EVENT_PLAN_TEMPLATES } from '../data/eventPlanTemplates';
import { EventPlanItem } from '../types';
import { calculateProjectProgress } from '../utils/projectProgress';
import { generateEventPlan, GeneratorInput } from './eventPlanGenerator';

const BASE_INPUT: GeneratorInput = {
  eventType: 'Свадьба',
  city: 'Сергиев Посад',
  date: '2026-09-12',
  dateUnknown: false,
  guestsCount: 30,
  budgetRange: '500000',
  budgetTotal: 400_000,
  style: 'Камерно',
  alreadyHave: []
};

function planItem(
  id: string,
  status: EventPlanItem['status'],
  required = false
): EventPlanItem {
  return {
    id,
    category: 'venue',
    title: id,
    description: id,
    required,
    order: 1,
    status,
    route: '/'
  };
}

describe('свободный состав мероприятия', () => {
  test('в шаблонах нет обязательных услуг или этапов', () => {
    Object.values(EVENT_PLAN_TEMPLATES).flat().forEach((item) => {
      expect(item.required).toBe(false);
    });
  });

  test('в план попадают только услуги, которые клиент запросил или уже имеет', () => {
    const project = generateEventPlan({
      ...BASE_INPUT,
      requestedServices: ['host'],
      alreadyHave: ['photographer']
    });

    expect(project.planItems.find((item) => item.category === 'host')?.status).toBe('not_started');
    expect(project.planItems.find((item) => item.category === 'photographer')?.status).toBe('completed');
    expect(project.planItems.find((item) => item.category === 'dj')?.status).toBe('skipped');
    expect(project.neededServices).toEqual(['host']);
    expect(project.tasks.find((task) => /Фотограф/i.test(task.title))?.isCompleted).toBe(true);
  });

  test('выбранную услугу можно добавить, даже если её не было в шаблоне события', () => {
    const project = generateEventPlan({
      ...BASE_INPUT,
      eventType: 'Концерт',
      requestedServices: ['organizer']
    });

    expect(project.planItems.find((item) => item.category === 'organizer')?.status).toBe('not_started');
  });

  test('невыбранные подрядчики не создают задачи и статьи бюджета', () => {
    const project = generateEventPlan(BASE_INPUT);

    expect(project.tasks.some((task) => /ведущ|DJ|дидже/i.test(task.title))).toBe(false);
    expect(project.budgetItems).toHaveLength(1);
    expect(project.budgetItems[0].name).toBe('Свободный резерв');
    expect(project.budgetItems[0].allocated).toBe(BASE_INPUT.budgetTotal);
  });

  test('убранные пункты не влияют на прогресс, включая старые required данные', () => {
    const progress = calculateProjectProgress([
      planItem('готово', 'completed'),
      planItem('в работе', 'not_started'),
      planItem('не нужно', 'skipped', true)
    ]);

    expect(progress).toBe(50);
  });

  test('неизвестный бюджет не превращается в выдуманные 500 000 рублей', () => {
    const project = generateEventPlan({ ...BASE_INPUT, budgetRange: 'unknown', budgetTotal: 0 });

    expect(project.budgetTotal).toBe(0);
    expect(project.nadoSegment).toBe('custom');
    expect(project.budgetItems.every((item) => item.allocated === 0)).toBe(true);
    expect(project.messages[0].text).toContain('Бюджет пока не задан');
  });

  test('идентификаторы шагов уникальны, даже если категория повторяется', () => {
    const project = generateEventPlan(BASE_INPUT);
    const ids = project.planItems.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
