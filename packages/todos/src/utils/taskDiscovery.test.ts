import { describe, expect, it } from 'vitest';
import type { Todo } from '@todo/shared';
import {
  defaultTodoDiscoveryFilters,
  filterAndSortTodos,
  hasActiveTodoDiscoveryFilters,
} from './taskDiscovery';

const todos: Todo[] = [
  { id: '1', title: 'Review proposal', assigneeId: 'user-1', completed: false, createdAt: '2026-09-25T10:00:00.000Z' },
  { id: '2', title: 'Archive notes', assigneeId: 'user-1', completed: true, createdAt: '2026-09-26T10:00:00.000Z' },
  { id: '3', title: 'Book workshop', assigneeId: 'user-1', completed: false, createdAt: '2026-09-27T10:00:00.000Z' },
];

describe('task discovery utilities', () => {
  it('filters case-insensitively without mutating the query-cache source array', () => {
    const source = [...todos];
    expect(filterAndSortTodos(source, { ...defaultTodoDiscoveryFilters, query: 'PROPOSAL' }).map((todo) => todo.id)).toEqual(['1']);
    expect(source).toEqual(todos);
  });

  it('combines a status filter with deterministic sort choices', () => {
    expect(filterAndSortTodos(todos, { status: 'active', query: '', sort: 'oldest' }).map((todo) => todo.id)).toEqual(['1', '3']);
    expect(filterAndSortTodos(todos, { status: 'all', query: '', sort: 'title-asc' }).map((todo) => todo.id)).toEqual(['2', '3', '1']);
  });

  it('recognizes filters that differ from the shareable default view', () => {
    expect(hasActiveTodoDiscoveryFilters(defaultTodoDiscoveryFilters)).toBe(false);
    expect(hasActiveTodoDiscoveryFilters({ ...defaultTodoDiscoveryFilters, status: 'completed' })).toBe(true);
  });
});
