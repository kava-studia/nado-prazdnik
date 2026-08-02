import { VisibilityCondition } from '../types';

export function evaluateVisibilityCondition(
  condition: VisibilityCondition | undefined,
  values: Record<string, string | boolean | number | undefined>
): boolean {
  if (!condition) return true;

  if (typeof condition === 'string') {
    return true;
  }

  const fieldValue = values[condition.field];
  const targetVal = condition.value;

  switch (condition.operator) {
    case 'equals':
      return String(fieldValue ?? '') === String(targetVal ?? '');
    case 'not_equals':
      return String(fieldValue ?? '') !== String(targetVal ?? '');
    case 'contains':
      return String(fieldValue ?? '').toLowerCase().includes(String(targetVal ?? '').toLowerCase());
    case 'is_true':
      return fieldValue === true || String(fieldValue).toLowerCase() === 'true';
    case 'is_false':
      return fieldValue === false || String(fieldValue).toLowerCase() === 'false' || fieldValue === undefined || fieldValue === '';
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && String(fieldValue).trim() !== '';
    default:
      return true;
  }
}
