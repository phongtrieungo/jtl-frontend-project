import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { apiClient, todoKeys, ToastViewport, toastsAtom, type Todo } from '@todo/shared';
import { getDefaultStore } from 'jotai/vanilla';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBulkTodoActions } from './useBulkTodoActions';

const first: Todo = { id: 'todo-1', title: 'Prepare demo', assigneeId: 'user-1', completed: false, createdAt: '2026-09-27T03:00:00.000Z' };
const second: Todo = { id: 'todo-2', title: 'Review notes', assigneeId: 'user-1', completed: false, createdAt: '2026-09-27T02:00:00.000Z' };
const third: Todo = { id: 'todo-3', title: 'Share recap', assigneeId: 'user-1', completed: false, createdAt: '2026-09-27T01:00:00.000Z' };
const key = todoKeys.byUser(first.assigneeId);

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function wrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useBulkTodoActions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    act(() => getDefaultStore().set(toastsAtom, []));
  });

  it('reports per-item progress and restores only a failed completion snapshot', async () => {
    let resolveFirst!: (todo: Todo) => void;
    let rejectSecond!: (error: Error) => void;
    vi.spyOn(apiClient, 'updateTodo').mockImplementation((id) => {
      if (id === first.id) return new Promise<Todo>((resolve) => { resolveFirst = resolve; });
      return new Promise<Todo>((_resolve, reject) => { rejectSecond = reject; });
    });
    const client = createClient();
    client.setQueryData(key, [first, second, third]);
    const { result } = renderHook(() => useBulkTodoActions(), { wrapper: wrapper(client) });

    let operation!: Promise<void>;
    await act(async () => {
      operation = result.current.runBulkAction('complete', [first, second]);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });

    expect(client.getQueryData<Todo[]>(key)).toEqual([
      { ...first, completed: true, isOptimistic: true },
      { ...second, completed: true, isOptimistic: true },
      third,
    ]);
    expect(result.current.itemStatuses).toMatchObject({ 'todo-1': 'pending', 'todo-2': 'pending' });

    await act(async () => {
      resolveFirst({ ...first, completed: true });
      rejectSecond(new Error('Simulated failure'));
      await operation;
    });

    expect(client.getQueryData<Todo[]>(key)).toEqual([{ ...first, completed: true }, second, third]);
    expect(result.current.itemStatuses).toMatchObject({ 'todo-1': 'succeeded', 'todo-2': 'failed' });
    expect(getDefaultStore().get(toastsAtom)).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'error', title: 'Some tasks were reverted' }),
      expect.objectContaining({ type: 'success', action: expect.objectContaining({ label: 'Undo' }), durationMs: 8_000 }),
    ]));
    act(() => client.clear());
  });

  it('offers a time-bounded undo that restores a successful completion', async () => {
    const update = vi.spyOn(apiClient, 'updateTodo')
      .mockResolvedValueOnce({ ...first, completed: true })
      .mockResolvedValueOnce(first);
    const client = createClient();
    client.setQueryData(key, [first]);
    const { result } = renderHook(() => useBulkTodoActions(), { wrapper: wrapper(client) });

    await act(async () => {
      await result.current.runBulkAction('complete', [first]);
    });
    const undoToast = getDefaultStore().get(toastsAtom).find((item) => item.action?.label === 'Undo');
    expect(undoToast).toMatchObject({ durationMs: 8_000 });

    render(<ToastViewport />);
    const undoButton = screen.getByRole('button', { name: 'Undo' });
    undoButton.focus();
    expect(undoButton).toHaveFocus();
    act(() => undoButton.click());
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)).toEqual([first]));
    expect(update).toHaveBeenNthCalledWith(2, first.id, { completed: false }, { chaos: false });
    expect(getDefaultStore().get(toastsAtom)).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'success', title: 'Bulk action undone' }),
    ]));
    act(() => client.clear());
  });

  it('keeps successful deletions removed while restoring a failed item at its surviving position', async () => {
    vi.spyOn(apiClient, 'deleteTodo').mockImplementation((id) => id === first.id
      ? Promise.resolve()
      : Promise.reject(new Error('Simulated failure')));
    const client = createClient();
    client.setQueryData(key, [first, second, third]);
    const { result } = renderHook(() => useBulkTodoActions(), { wrapper: wrapper(client) });

    await act(async () => {
      await result.current.runBulkAction('delete', [first, second]);
    });

    expect(client.getQueryData<Todo[]>(key)).toEqual([second, third]);
    expect(result.current.itemStatuses).toMatchObject({ 'todo-1': 'succeeded', 'todo-2': 'failed' });
    act(() => client.clear());
  });

  it('undoes a successful deletion by recreating the task through the shared API', async () => {
    const recreated = { ...first, id: 'todo-restored' };
    vi.spyOn(apiClient, 'deleteTodo').mockResolvedValue();
    const create = vi.spyOn(apiClient, 'createTodo').mockResolvedValue(recreated);
    const client = createClient();
    client.setQueryData(key, [first, second]);
    const { result } = renderHook(() => useBulkTodoActions(), { wrapper: wrapper(client) });

    await act(async () => {
      await result.current.runBulkAction('delete', [first]);
    });
    expect(client.getQueryData<Todo[]>(key)).toEqual([second]);

    const undoToast = getDefaultStore().get(toastsAtom).find((item) => item.action?.label === 'Undo');
    act(() => undoToast?.action?.onAction());
    await waitFor(() => expect(client.getQueryData<Todo[]>(key)).toEqual([recreated, second]));
    expect(create).toHaveBeenCalledWith(
      { title: first.title, assigneeId: first.assigneeId },
      { chaos: false },
    );
    act(() => client.clear());
  });
});
