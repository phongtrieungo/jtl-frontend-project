import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearTodoDraft, readTodoDraft, useTodoDraft, writeTodoDraft } from './useTodoDraft';

describe('Story 8.6 todo draft persistence', () => {
  beforeEach(() => window.localStorage.clear());

  it('restores a valid draft for its assigned user without a mutation', () => {
    writeTodoDraft('user-1', 'Review the project brief');
    const { result } = renderHook(() => useTodoDraft('user-1'));

    expect(result.current.title).toBe('Review the project brief');
    expect(readTodoDraft('user-2')).toBe('');
  });

  it('does not restore invalid or malformed local values', () => {
    window.localStorage.setItem('taskwell.todo-draft.user-1', JSON.stringify({ title: 'no' }));
    window.localStorage.setItem('taskwell.todo-draft.user-2', '{broken');

    expect(readTodoDraft('user-1')).toBe('');
    expect(readTodoDraft('user-2')).toBe('');
  });

  it('updates and clears persisted drafts as the form changes', () => {
    const { result } = renderHook(() => useTodoDraft('user-1'));

    act(() => result.current.setTitle('Prepare release notes'));
    expect(readTodoDraft('user-1')).toBe('Prepare release notes');

    act(() => result.current.setTitle('x'));
    expect(readTodoDraft('user-1')).toBe('');

    act(() => result.current.setTitle('Prepare release notes'));
    act(() => result.current.clearTitle());
    expect(result.current.title).toBe('');
    expect(readTodoDraft('user-1')).toBe('');

    clearTodoDraft('user-1');
  });
});
