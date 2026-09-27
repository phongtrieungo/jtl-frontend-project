import { describe, expect, it } from 'vitest';
import type { Todo } from '@todo/shared';
import { deriveTaskInsights } from './taskInsights';

const task = (id: string, assigneeId: string, completed = false): Todo => ({ id, assigneeId, completed, title: id, createdAt: `2026-09-${id.padStart(2, '0')}T00:00:00Z` });

describe('task insights', () => {
  it('handles an empty workspace without an undefined completion rate', () => {
    expect(deriveTaskInsights([])).toMatchObject({ total: 0, active: 0, completed: 0, completionRate: 0, recent: [], attention: [] });
  });
  it('derives rounded progress, newest tasks and active workloads without mutating input', () => {
    const todos = [task('1', 'ada'), task('2', 'alan', true), task('3', 'ada'), task('4', 'alan'), task('5', 'ada', true), task('6', 'ada')];
    const original = [...todos];
    const result = deriveTaskInsights(todos);
    expect(result).toMatchObject({ total: 6, active: 4, completed: 2, completionRate: 33, attention: [{ userId: 'ada', active: 3 }, { userId: 'alan', active: 1 }] });
    expect(result.recent.map(({ id }) => id)).toEqual(['6', '5', '4', '3', '2']);
    expect(todos).toEqual(original);
  });
  it('includes pending work and excludes completed users from attention', () => {
    expect(deriveTaskInsights([{ ...task('1', 'ada', true), isOptimistic: true }])).toMatchObject({ saving: true, completionRate: 100, attention: [] });
  });
});
