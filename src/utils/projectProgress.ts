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
    skipped: 100 // Counted as complete, but if it is optional we might ignore it or give full weight depending on state. Let's see.
  };

  planItems.forEach((item) => {
    // skipped - не учитывать, если этап необязательный
    if (item.status === 'skipped' && !item.required) {
      return; // Do not include in calculations at all
    }

    const weight = item.required ? 1.5 : 1.0;
    const progress = statusWeights[item.status] || 0;

    totalWeight += weight;
    earnedWeight += weight * (progress / 100);
  });

  if (totalWeight === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((earnedWeight / totalWeight) * 100)));
}
