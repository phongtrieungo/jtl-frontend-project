import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import {
  apiClient,
  isChaosActiveAtom,
  todoKeys,
  useToast,
  type Todo,
} from '@todo/shared';

export type BulkTodoAction = 'complete' | 'delete';
export type BulkTodoItemStatus = 'pending' | 'succeeded' | 'failed';

interface TodoSnapshot {
  todo: Todo;
  index: number;
}

interface SuccessfulBulkItem extends TodoSnapshot {
  result?: Todo;
}

function withoutOptimisticFlag(todo: Todo): Todo {
  const confirmedTodo = { ...todo };
  delete confirmedTodo.isOptimistic;
  return confirmedTodo;
}

function restoreDeletedTodo(
  current: Todo[] | undefined,
  snapshot: TodoSnapshot,
  originalOrder: ReadonlyMap<string, number>,
  optimistic = false,
): Todo[] {
  const restored = optimistic ? { ...snapshot.todo, isOptimistic: true } : snapshot.todo;
  const items = [...(current ?? []).filter((item) => item.id !== restored.id), restored];

  return items.sort((left, right) => {
    const leftIndex = originalOrder.get(left.id) ?? Number.POSITIVE_INFINITY;
    const rightIndex = originalOrder.get(right.id) ?? Number.POSITIVE_INFINITY;
    return leftIndex - rightIndex;
  });
}

export interface BulkTodoActionsResult {
  runBulkAction: (action: BulkTodoAction, todos: readonly Todo[]) => Promise<void>;
  itemStatuses: Readonly<Record<string, BulkTodoItemStatus>>;
  isPending: boolean;
}

/**
 * Coordinates an independently recoverable optimistic mutation for every
 * selected task. Selection itself remains presentation state in TodoList.
 */
export function useBulkTodoActions(): BulkTodoActionsResult {
  const queryClient = useQueryClient();
  const isChaosActive = useAtomValue(isChaosActiveAtom);
  const { toast } = useToast();
  const [itemStatuses, setItemStatuses] = useState<Record<string, BulkTodoItemStatus>>({});

  const undoBulkAction = useCallback(async (
    action: BulkTodoAction,
    successfulItems: readonly SuccessfulBulkItem[],
    originalOrder: ReadonlyMap<string, number>,
  ): Promise<void> => {
    if (successfulItems.length === 0) return;

    const queryKey = todoKeys.byUser(successfulItems[0].todo.assigneeId);
    await queryClient.cancelQueries({ queryKey });
    setItemStatuses(Object.fromEntries(successfulItems.map(({ todo }) => [todo.id, 'pending'])));

    if (action === 'complete') {
      queryClient.setQueryData<Todo[]>(queryKey, (current) => current?.map((item) => {
        const snapshot = successfulItems.find(({ todo }) => todo.id === item.id);
        return snapshot ? { ...snapshot.todo, isOptimistic: true } : item;
      }));
    } else {
      queryClient.setQueryData<Todo[]>(queryKey, (current) => successfulItems.reduce(
        (items, snapshot) => restoreDeletedTodo(items, snapshot, originalOrder, true),
        current,
      ));
    }

    const failures: SuccessfulBulkItem[] = [];
    await Promise.all(successfulItems.map(async (snapshot) => {
      try {
        if (action === 'complete') {
          const restored = await apiClient.updateTodo(
            snapshot.todo.id,
            { completed: snapshot.todo.completed },
            { chaos: isChaosActive },
          );
          queryClient.setQueryData<Todo[]>(queryKey, (current) => current?.map((item) =>
            item.id === snapshot.todo.id ? restored : item
          ));
        } else {
          let restored = await apiClient.createTodo({
            title: snapshot.todo.title,
            assigneeId: snapshot.todo.assigneeId,
          }, { chaos: isChaosActive });
          if (snapshot.todo.completed) {
            restored = await apiClient.updateTodo(
              restored.id,
              { completed: true },
              { chaos: isChaosActive },
            );
          }
          queryClient.setQueryData<Todo[]>(queryKey, (current) => current?.map((item) =>
            item.id === snapshot.todo.id ? restored : item
          ));
        }
        setItemStatuses((current) => ({ ...current, [snapshot.todo.id]: 'succeeded' }));
      } catch {
        failures.push(snapshot);
        queryClient.setQueryData<Todo[]>(queryKey, (current) => {
          if (action === 'delete') {
            return current?.filter((item) => item.id !== snapshot.todo.id);
          }
          return current?.map((item) => item.id === snapshot.todo.id
            ? (snapshot.result ?? { ...snapshot.todo, completed: true })
            : item);
        });
        setItemStatuses((current) => ({ ...current, [snapshot.todo.id]: 'failed' }));
      }
    }));

    await queryClient.invalidateQueries({ queryKey });
    if (failures.length > 0) {
      toast({
        type: 'error',
        title: 'Undo incomplete',
        message: `${failures.length} ${failures.length === 1 ? 'task' : 'tasks'} could not be restored. The confirmed server state is shown.`,
      });
    } else {
      toast({
        type: 'success',
        title: 'Bulk action undone',
        message: `${successfulItems.length} ${successfulItems.length === 1 ? 'task was' : 'tasks were'} restored.`,
      });
    }
  }, [isChaosActive, queryClient, toast]);

  const runBulkAction = useCallback(async (
    action: BulkTodoAction,
    todos: readonly Todo[],
  ): Promise<void> => {
    const eligibleTodos = todos.filter((todo) => !todo.isOptimistic);
    if (eligibleTodos.length === 0) return;

    const queryKey = todoKeys.byUser(eligibleTodos[0].assigneeId);
    await queryClient.cancelQueries({ queryKey });
    const previousTodos = queryClient.getQueryData<Todo[]>(queryKey) ?? [];
    const selectedIds = new Set(eligibleTodos.map((todo) => todo.id));
    const snapshots: TodoSnapshot[] = previousTodos
      .map((todo, index) => ({ todo, index }))
      .filter(({ todo }) => selectedIds.has(todo.id));
    const originalOrder = new Map(previousTodos.map((todo, index) => [todo.id, index]));

    setItemStatuses(Object.fromEntries(snapshots.map(({ todo }) => [todo.id, 'pending'])));
    queryClient.setQueryData<Todo[]>(queryKey, (current) => action === 'delete'
      ? current?.filter((todo) => !selectedIds.has(todo.id))
      : current?.map((todo) => selectedIds.has(todo.id)
        ? { ...todo, completed: true, isOptimistic: true }
        : todo));

    const successfulItems: SuccessfulBulkItem[] = [];
    const failedItems: TodoSnapshot[] = [];
    await Promise.all(snapshots.map(async (snapshot) => {
      try {
        const result = action === 'complete'
          ? await apiClient.updateTodo(snapshot.todo.id, { completed: true }, { chaos: isChaosActive })
          : await apiClient.deleteTodo(snapshot.todo.id, { chaos: isChaosActive }).then(() => undefined);
        successfulItems.push({ ...snapshot, result });
        if (result) {
          queryClient.setQueryData<Todo[]>(queryKey, (current) => current?.map((todo) =>
            todo.id === snapshot.todo.id ? withoutOptimisticFlag(result) : todo
          ));
        }
        setItemStatuses((current) => ({ ...current, [snapshot.todo.id]: 'succeeded' }));
      } catch {
        failedItems.push(snapshot);
        queryClient.setQueryData<Todo[]>(queryKey, (current) => action === 'delete'
          ? restoreDeletedTodo(current, snapshot, originalOrder)
          : current?.map((todo) => todo.id === snapshot.todo.id ? snapshot.todo : todo));
        setItemStatuses((current) => ({ ...current, [snapshot.todo.id]: 'failed' }));
      }
    }));

    await queryClient.invalidateQueries({ queryKey });

    if (failedItems.length > 0) {
      toast({
        type: 'error',
        title: 'Some tasks were reverted',
        message: `${failedItems.length} of ${snapshots.length} ${snapshots.length === 1 ? 'task' : 'tasks'} failed. Only those tasks were restored.`,
      });
    }
    if (successfulItems.length > 0) {
      const verb = action === 'complete' ? 'completed' : 'deleted';
      toast({
        type: 'success',
        title: `${successfulItems.length} ${successfulItems.length === 1 ? 'task' : 'tasks'} ${verb}`,
        message: 'You can undo this action for the next 8 seconds.',
        durationMs: 8_000,
        action: {
          label: 'Undo',
          onAction: () => {
            void undoBulkAction(action, successfulItems, originalOrder);
          },
        },
      });
    }
  }, [isChaosActive, queryClient, toast, undoBulkAction]);

  const isPending = useMemo(
    () => Object.values(itemStatuses).some((status) => status === 'pending'),
    [itemStatuses],
  );

  return { runBulkAction, itemStatuses, isPending };
}
