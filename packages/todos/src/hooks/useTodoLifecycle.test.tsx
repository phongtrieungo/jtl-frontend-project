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
async function flushMutation(promise: Promise<unknown>): Promise<void> { await promise.catch(() => undefined); await new Promise<void>((resolve) => setTimeout(resolve, 0)); }

describe('task lifecycle mutations', () => {
  afterEach(() => { vi.restoreAllMocks(); act(() => getDefaultStore().set(toastsAtom, [])); });

  it('toggles immediately and reconciles after success', async () => {
    let resolveRequest!: (value: Todo) => void;
    const toggle = vi.spyOn(apiClient, 'toggleTodo').mockReturnValue(new Promise<Todo>((resolve) => { resolveRequest = resolve; }));
    const client = createClient(); client.setQueryData(key, [todo]);
    const { result } = renderHook(() => useToggleTodo(), { wrapper: wrapper(client) });
    let mutationPromise!: Promise<Todo>;
    await act(async () => { mutationPromise = result.current.mutateAsync({ todo }); await new Promise<void>((resolve) => setTimeout(resolve, 0)); });
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)?.[0]).toMatchObject({ completed: true, isOptimistic: true }));
    await act(async () => { resolveRequest({ ...todo, completed: true }); await flushMutation(mutationPromise); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toggle).toHaveBeenCalledWith(todo.id, { chaos: false });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    act(() => client.clear());
  });

  it('toggles immediately and restores the exact snapshot after failure', async () => {
    let rejectRequest!: (error: Error) => void;
    vi.spyOn(apiClient, 'toggleTodo').mockReturnValue(new Promise<Todo>((_resolve, reject) => { rejectRequest = reject; }));
    const client = createClient(); const snapshot = [todo]; client.setQueryData(key, snapshot);
    const { result } = renderHook(() => useToggleTodo(), { wrapper: wrapper(client) });
    let mutationPromise!: Promise<Todo>;
    await act(async () => { mutationPromise = result.current.mutateAsync({ todo }); await new Promise<void>((resolve) => setTimeout(resolve, 0)); });
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)?.[0]).toMatchObject({ completed: true, isOptimistic: true }));
    await act(async () => { rejectRequest(new Error('Simulated Network Failure')); await flushMutation(mutationPromise); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(key)).toEqual(snapshot);
    expect(getDefaultStore().get(toastsAtom)[0]).toMatchObject({ title: 'Task status reverted', type: 'error', action: { label: 'Try again' } });
    act(() => client.clear());
  });

  it('edits immediately and invalidates the task query after success', async () => {
    let resolveRequest!: (value: Todo) => void;
    const update = vi.spyOn(apiClient, 'updateTodo').mockReturnValue(new Promise<Todo>((resolve) => { resolveRequest = resolve; }));
    const client = createClient(); client.setQueryData(key, [todo]);
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: wrapper(client) });
    let mutationPromise!: Promise<Todo>;
    await act(async () => { mutationPromise = result.current.mutateAsync({ todo, changes: { title: 'Prepare final demo' } }); await new Promise<void>((resolve) => setTimeout(resolve, 0)); });
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)?.[0]).toMatchObject({ title: 'Prepare final demo', isOptimistic: true }));
    await act(async () => { resolveRequest({ ...todo, title: 'Prepare final demo' }); await flushMutation(mutationPromise); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(update).toHaveBeenCalledWith(todo.id, { title: 'Prepare final demo' }, { chaos: false });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    act(() => client.clear());
  });

  it('edits immediately and restores the exact snapshot with retry feedback after failure', async () => {
    let rejectRequest!: (error: Error) => void;
    vi.spyOn(apiClient, 'updateTodo').mockReturnValue(new Promise<Todo>((_resolve, reject) => { rejectRequest = reject; }));
    const client = createClient(); const snapshot = [todo]; client.setQueryData(key, snapshot);
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: wrapper(client) });
    let mutationPromise!: Promise<Todo>;
    await act(async () => { mutationPromise = result.current.mutateAsync({ todo, changes: { title: 'Temporary title' } }); await new Promise<void>((resolve) => setTimeout(resolve, 0)); });
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)?.[0]).toMatchObject({ title: 'Temporary title', isOptimistic: true }));
    await act(async () => { rejectRequest(new Error('Simulated Network Failure')); await flushMutation(mutationPromise); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(key)).toEqual(snapshot);
    expect(getDefaultStore().get(toastsAtom)[0]).toMatchObject({ title: 'Task edit reverted', type: 'error', action: { label: 'Try again' } });
    act(() => client.clear());
  });

  it('removes immediately and reconciles after success', async () => {
    let resolveRequest!: () => void;
    const remove = vi.spyOn(apiClient, 'deleteTodo').mockReturnValue(new Promise<void>((resolve) => { resolveRequest = resolve; }));
    const client = createClient(); client.setQueryData(key, [todo]);
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: wrapper(client) });
    let mutationPromise!: Promise<void>;
    await act(async () => { mutationPromise = result.current.mutateAsync({ todo }); await new Promise<void>((resolve) => setTimeout(resolve, 0)); });
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)).toEqual([]));
    await act(async () => { resolveRequest(); await flushMutation(mutationPromise); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(remove).toHaveBeenCalledWith(todo.id, { chaos: false });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    act(() => client.clear());
  });

  it('removes immediately and restores its original position after failure', async () => {
    const second = { ...todo, id: 'todo-2', title: 'Second task' };
    let rejectRequest!: (error: Error) => void;
    vi.spyOn(apiClient, 'deleteTodo').mockReturnValue(new Promise<void>((_resolve, reject) => { rejectRequest = reject; }));
    const client = createClient(); const snapshot = [todo, second]; client.setQueryData(key, snapshot);
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: wrapper(client) });
    let mutationPromise!: Promise<void>;
    await act(async () => { mutationPromise = result.current.mutateAsync({ todo }); await new Promise<void>((resolve) => setTimeout(resolve, 0)); });
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)).toEqual([second]));
    await act(async () => { rejectRequest(new Error('Simulated Network Failure')); await flushMutation(mutationPromise); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(key)).toEqual(snapshot);
    expect(getDefaultStore().get(toastsAtom)[0]).toMatchObject({ title: 'Task deletion reverted', type: 'error' });
    act(() => client.clear());
  });

  it('rolls back one failed row without erasing a later confirmed row change', async () => {
    const second = { ...todo, id: 'todo-2', title: 'Second task' };
    const confirmedSecond = { ...second, completed: true };
    let rejectUpdate!: (error: Error) => void;
    vi.spyOn(apiClient, 'updateTodo').mockReturnValue(
      new Promise<Todo>((_resolve, reject) => { rejectUpdate = reject; }),
    );
    vi.spyOn(apiClient, 'toggleTodo').mockResolvedValue(confirmedSecond);
    const client = createClient();
    client.setQueryData(key, [todo, second]);
    const { result } = renderHook(() => ({ update: useUpdateTodo(), toggle: useToggleTodo() }), {
      wrapper: wrapper(client),
    });

    let updatePromise!: Promise<Todo>;
    await act(async () => {
      updatePromise = result.current.update.mutateAsync({ todo, changes: { title: 'Temporary title' } });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
    await act(async () => {
      await result.current.toggle.mutateAsync({ todo: second });
    });
    expect(client.getQueryData<Todo[]>(key)).toEqual([
      expect.objectContaining({ id: todo.id, title: 'Temporary title', isOptimistic: true }),
      confirmedSecond,
    ]);
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);

    await act(async () => {
      rejectUpdate(new Error('Simulated Network Failure'));
      await flushMutation(updatePromise);
    });

    expect(client.getQueryData<Todo[]>(key)).toEqual([todo, confirmedSecond]);
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    act(() => client.clear());
  });
});
