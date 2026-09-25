import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { apiClient, todoKeys, toastsAtom, type Todo } from '@todo/shared';
import { getDefaultStore } from 'jotai/vanilla';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCreateTodo } from './useCreateTodo';

const userId = 'user-1';
const input = { title: 'Review project brief', assigneeId: userId };
const existingTodo: Todo = {
  id: 'todo-1',
  title: 'Prepare kickoff',
  assigneeId: userId,
  completed: false,
  createdAt: '2026-09-25T00:00:00.000Z',
};

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCreateTodo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    getDefaultStore().set(toastsAtom, []);
  });

  it('inserts a temporary item before the API resolves, then invalidates on success', async () => {
    let resolveCreate!: (todo: Todo) => void;
    const pendingCreate = new Promise<Todo>((resolve) => { resolveCreate = resolve; });
    const createTodo = vi.spyOn(apiClient, 'createTodo').mockReturnValue(pendingCreate);
    const queryClient = createQueryClient();
    const queryKey = todoKeys.byUser(userId);
    queryClient.setQueryData(queryKey, [existingTodo]);
    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper(queryClient) });

    act(() => result.current.mutate(input));
    await waitFor(() => expect(queryClient.getQueryData<Todo[]>(queryKey)).toHaveLength(2));
    const optimisticTodo = queryClient.getQueryData<Todo[]>(queryKey)?.[1];
    expect(optimisticTodo).toMatchObject({ title: input.title, assigneeId: userId, isOptimistic: true });
    expect(optimisticTodo?.id).toMatch(/^temp-/);

    resolveCreate({ ...optimisticTodo!, id: 'todo-2', isOptimistic: undefined });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createTodo).toHaveBeenCalledWith(input, { chaos: false });
    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it('restores the exact cache snapshot and dispatches an error toast on failure', async () => {
    let rejectCreate!: (error: Error) => void;
    const pendingCreate = new Promise<Todo>((_resolve, reject) => { rejectCreate = reject; });
    vi.spyOn(apiClient, 'createTodo').mockReturnValue(pendingCreate);
    const queryClient = createQueryClient();
    const queryKey = todoKeys.byUser(userId);
    const snapshot = [existingTodo];
    queryClient.setQueryData(queryKey, snapshot);
    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper(queryClient) });

    act(() => result.current.mutate(input));
    await waitFor(() => expect(queryClient.getQueryData<Todo[]>(queryKey)).toHaveLength(2));
    rejectCreate(new Error('Simulated Network Failure'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(queryKey)).toEqual(snapshot);
    expect(getDefaultStore().get(toastsAtom)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'error',
        title: 'Task not saved',
        message: expect.stringContaining('Your changes were reverted.'),
      }),
    ]));
    queryClient.clear();
  });

  it('removes the optimistic query again when there was no previous cache entry', async () => {
    let rejectCreate!: (error: Error) => void;
    vi.spyOn(apiClient, 'createTodo').mockReturnValue(new Promise<Todo>((_resolve, reject) => { rejectCreate = reject; }));
    const queryClient = createQueryClient();
    const queryKey = todoKeys.byUser(userId);
    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper(queryClient) });

    act(() => result.current.mutate(input));
    await waitFor(() => expect(queryClient.getQueryData<Todo[]>(queryKey)).toHaveLength(1));
    rejectCreate(new Error('offline'));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();
    queryClient.clear();
  });
});
