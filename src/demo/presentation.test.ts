import { describe, expect, test } from 'vitest';
import { PRESENTATION_METRICS, PRESENTATION_ROLES } from './presentation';

describe('presentation manifest', () => {
  test('covers every product role exactly once', () => {
    expect(PRESENTATION_ROLES.map((role) => role.id)).toEqual([
      'client',
      'contractor',
      'organizer',
      'venue',
      'owner'
    ]);
    expect(new Set(PRESENTATION_ROLES.map((role) => role.path)).size).toBe(PRESENTATION_ROLES.length);
  });

  test('uses safe internal routes and named demo scenarios', () => {
    for (const role of PRESENTATION_ROLES) {
      expect(role.path.startsWith('/')).toBe(true);
      expect(role.scenario.length).toBeGreaterThan(0);
      expect(role.label.length).toBeGreaterThan(0);
      expect(role.description.length).toBeGreaterThan(20);
    }
  });

  test('keeps the pitch metrics concise', () => {
    expect(PRESENTATION_METRICS).toHaveLength(4);
    expect(PRESENTATION_METRICS.every((metric) => metric.value && metric.label)).toBe(true);
  });
});

