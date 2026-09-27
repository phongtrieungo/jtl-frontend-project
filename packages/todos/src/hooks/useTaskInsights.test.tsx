import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { apiClient, todoKeys, type Todo } from '@todo/shared';
import { useTaskInsights } from './useTaskInsights';

const todo: Todo = { id: 'one', assigneeId: 'ada', title: 'Review work', completed: false, createdAt: '2026-09-27T00:00:00Z' };
afterEach(() => vi.restoreAllMocks());
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

describe('useTaskInsights', () => {
  it('observes optimistic creation, completion, rename, deletion and exact cache restoration', async () => {
    const { client, wrapper } = setup();
    const snapshot = [todo];
    client.setQueryData(todoKeys.byUser('ada'), snapshot);
    const { result, unmount } = renderHook(() => useTaskInsights(['ada', 'ada']), { wrapper });
    expect(result.current.insights.total).toBe(1);
    const pending = { ...todo, id: 'temp', title: 'New task', isOptimistic: true };
    act(() => client.setQueryData(todoKeys.byUser('ada'), [todo, pending]));
    await waitFor(() => expect(result.current.insights.total).toBe(2));
    act(() => client.setQueryData(todoKeys.byUser('ada'), [{ ...todo, completed: true, title: 'Renamed', isOptimistic: true }]));
    await waitFor(() => expect(result.current.insights.completionRate).toBe(100));
    expect(result.current.insights.recent[0]?.title).toBe('Renamed');
    expect(result.current.insights.saving).toBe(true);
    act(() => client.setQueryData(todoKeys.byUser('ada'), []));
    await waitFor(() => expect(result.current.insights.total).toBe(0));
    act(() => client.setQueryData(todoKeys.byUser('ada'), snapshot));
    await waitFor(() => expect(result.current.insights.active).toBe(1));
    expect(result.current.insights.saving).toBe(false);
    unmount(); client.clear();
  });
  it('reports loading and partial failure, then allows retry', async () => {
    const { client, wrapper } = setup();
    vi.spyOn(apiClient, 'getTodosByUser').mockRejectedValueOnce(new Error('offline')).mockResolvedValue([todo]);
    const { result, unmount } = renderHook(() => useTaskInsights(['ada']), { wrapper });
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isError).toBe(true));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.insights.total).toBe(1));
    expect(result.current.isError).toBe(false);
    unmount(); client.clear();
  });
});
