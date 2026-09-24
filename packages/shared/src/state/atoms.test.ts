// packages/shared/src/state/atoms.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore } from 'jotai';
import { renderHook, act } from '@testing-library/react';
import { activeUserIdAtom, isUserSelectedAtom } from './userAtom';
import { isChaosActiveAtom } from './chaosAtom';
import { useToast } from './toastAtom';

describe('Story 2.4: Cross-Cutting Jotai Atoms', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('correctly derives isUserSelectedAtom based on activeUserIdAtom', () => {
    const store = createStore();

    // Default state: 'user-1'
    expect(store.get(activeUserIdAtom)).toBe('user-1');
    expect(store.get(isUserSelectedAtom)).toBe(true);

    // When reset to null
    store.set(activeUserIdAtom, null);
    expect(store.get(activeUserIdAtom)).toBeNull();
    expect(store.get(isUserSelectedAtom)).toBe(false);

    // When updated to another user
    store.set(activeUserIdAtom, 'user-2');
    expect(store.get(isUserSelectedAtom)).toBe(true);
  });

  it('manages chaos mode flag via isChaosActiveAtom', () => {
    const store = createStore();
    expect(store.get(isChaosActiveAtom)).toBe(false);

    store.set(isChaosActiveAtom, true);
    expect(store.get(isChaosActiveAtom)).toBe(true);

    store.set(isChaosActiveAtom, false);
    expect(store.get(isChaosActiveAtom)).toBe(false);
  });

  it('dispatches toasts and auto-dismisses after duration (4s)', () => {
    const { result } = renderHook(() => useToast());

    // Initially empty
    expect(result.current.toasts.length).toBe(0);

    // Dispatch error toast
    let toastId: string = '';
    act(() => {
      toastId = result.current.error('Task creation failed', 'Rollback Alert');
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].id).toBe(toastId);
    expect(result.current.toasts[0].message).toBe('Task creation failed');
    expect(result.current.toasts[0].title).toBe('Rollback Alert');
    expect(result.current.toasts[0].type).toBe('error');

    // Advance 3.5s - still visible
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(result.current.toasts.length).toBe(1);

    // Advance past 4s - auto dismissed
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.toasts.length).toBe(0);
  });

  it('supports manual dismissal of toasts', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string = '';
    act(() => {
      toastId = result.current.success('Operation succeeded');
    });
    expect(result.current.toasts.length).toBe(1);

    act(() => {
      result.current.dismiss(toastId);
    });
    expect(result.current.toasts.length).toBe(0);
  });
});
