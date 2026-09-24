// packages/shared/src/api/queryKeys.test.ts
import { describe, it, expect } from 'vitest';
import { userKeys, todoKeys } from './queryKeys';

describe('Story 2.1: Query Key Factories', () => {
  it('generates predictable user query keys', () => {
    expect(userKeys.all).toEqual(['users']);
    expect(userKeys.lists()).toEqual(['users', 'list']);
    expect(userKeys.list()).toEqual(['users', 'list']);
    expect(userKeys.details()).toEqual(['users', 'detail']);
    expect(userKeys.detail('user-123')).toEqual(['users', 'detail', 'user-123']);
  });

  it('generates predictable todo query keys with byUser scoped filtering', () => {
    expect(todoKeys.all).toEqual(['todos']);
    expect(todoKeys.lists()).toEqual(['todos', 'list']);
    expect(todoKeys.list()).toEqual(['todos', 'list']);
    expect(todoKeys.byUser('123')).toEqual(['todos', 'list', { userId: '123' }]);
    expect(todoKeys.details()).toEqual(['todos', 'detail']);
    expect(todoKeys.detail('todo-456')).toEqual(['todos', 'detail', 'todo-456']);
  });
});
