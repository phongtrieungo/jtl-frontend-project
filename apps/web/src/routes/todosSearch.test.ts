import { describe, expect, it } from 'vitest';
import { parseTodosSearch } from './todosSearch';

describe('todos route search', () => {
  it('restores a valid deep-link state', () => {
    expect(parseTodosSearch({
      userId: 'user-2',
      status: 'completed',
      query: 'cipher',
      sort: 'oldest',
    })).toEqual({
      userId: 'user-2',
      status: 'completed',
      query: 'cipher',
      sort: 'oldest',
    });
  });

  it('normalizes invalid enum and oversized query values to safe defaults', () => {
    expect(parseTodosSearch({
      userId: '',
      status: 'unknown',
      query: 'x'.repeat(101),
      sort: 'random',
    })).toEqual({ status: 'all', query: '', sort: 'newest' });
  });
});
