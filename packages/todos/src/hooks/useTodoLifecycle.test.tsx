import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { apiClient, todoKeys, toastsAtom, type Todo } from '@todo/shared';
import { getDefaultStore } from 'jotai/vanilla';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDeleteTodo } from './useDeleteTodo';
import { useToggleTodo } from './useToggleTodo';
import { useUpdateTodo } from './useUpdateTodo';

const todo: Todo = { id: 'todo-1', title: 'Prepare demo', assigneeId: 'user-1', completed: false, createdAt: '2026-09-27T00:00:00.000Z' };
const key = todoKeys.byUser(todo.assigneeId);

function createClient() { return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); }
function wrapper(client: QueryClient) { return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>; }

describe('task lifecycle mutations', () => {
  afterEach(() => { vi.restoreAllMocks(); getDefaultStore().set(toastsAtom, []); });

  it('toggles immediately and restores the exact snapshot after failure', async () => {
    let rejectRequest!: (error: Error) => void;
    vi.spyOn(apiClient, 'toggleTodo').mockReturnValue(new Promise<Todo>((_resolve, reject) => { rejectRequest = reject; }));
    const client = createClient(); const snapshot = [todo]; client.setQueryData(key, snapshot);
    const { result } = renderHook(() => useToggleTodo(), { wrapper: wrapper(client) });
    act(() => result.current.mutate({ todo }));
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)?.[0]).toMatchObject({ completed: true, isOptimistic: true }));
    await act(async () => { rejectRequest(new Error('Simulated Network Failure')); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(key)).toEqual(snapshot);
    expect(getDefaultStore().get(toastsAtom)[0]).toMatchObject({ title: 'Task status reverted', type: 'error', action: { label: 'Try again' } });
    client.clear();
  });

  it('edits immediately and invalidates the task query after success', async () => {
    let resolveRequest!: (value: Todo) => void;
    const update = vi.spyOn(apiClient, 'updateTodo').mockReturnValue(new Promise<Todo>((resolve) => { resolveRequest = resolve; }));
    const client = createClient(); client.setQueryData(key, [todo]);
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: wrapper(client) });
    act(() => result.current.mutate({ todo, changes: { title: 'Prepare final demo' } }));
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)?.[0]).toMatchObject({ title: 'Prepare final demo', isOptimistic: true }));
    resolveRequest({ ...todo, title: 'Prepare final demo' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(update).toHaveBeenCalledWith(todo.id, { title: 'Prepare final demo' }, { chaos: false });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    client.clear();
  });

  it('removes immediately and restores its original position after failure', async () => {
    const second = { ...todo, id: 'todo-2', title: 'Second task' };
    let rejectRequest!: (error: Error) => void;
    vi.spyOn(apiClient, 'deleteTodo').mockReturnValue(new Promise<void>((_resolve, reject) => { rejectRequest = reject; }));
    const client = createClient(); const snapshot = [todo, second]; client.setQueryData(key, snapshot);
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: wrapper(client) });
    act(() => result.current.mutate({ todo }));
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)).toEqual([second]));
    await act(async () => { rejectRequest(new Error('Simulated Network Failure')); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(key)).toEqual(snapshot);
    expect(getDefaultStore().get(toastsAtom)[0]).toMatchObject({ title: 'Task deletion reverted', type: 'error' });
    client.clear();
  });
});
