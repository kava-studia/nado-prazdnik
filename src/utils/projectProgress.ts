import { EventPlanItem } from '../types';

export function calculateProjectProgress(planItems: EventPlanItem[]): number {
  if (!planItems || planItems.length === 0) return 0;

  let totalWeight = 0;
  let earnedWeight = 0;

  // Status mapping weights
  const statusWeights: Record<string, number> = {
    not_started: 0,
    in_progress: 25,
    options_selected: 40,
    request_sent: 55,
    awaiting_confirmation: 65,
    confirmed: 80,
    booked: 90,
    completed: 100,
    skipped: 0
  };

  planItems.forEach((item) => {
    // Клиент сам определяет состав события. Убранные пункты не должны
    // искусственно повышать или понижать готовность выбранного плана.
    if (item.status === 'skipped') {
      return;
    }

    const progress = statusWeights[item.status] || 0;

    totalWeight += 1;
    earnedWeight += progress / 100;
  });

  if (totalWeight === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((earnedWeight / totalWeight) * 100)));
}
