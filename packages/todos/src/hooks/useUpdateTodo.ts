import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { apiClient, isChaosActiveAtom, todoKeys, useToast, type Todo, type UpdateTodoInput } from '@todo/shared';

export interface UpdateTodoMutationInput { todo: Todo; changes: UpdateTodoInput; }
interface UpdateTodoContext { previousTodos: Todo[] | undefined; queryKey: ReturnType<typeof todoKeys.byUser>; }

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  const isChaosActive = useAtomValue(isChaosActiveAtom);
  const toast = useToast();
  const mutation = useMutation<Todo, Error, UpdateTodoMutationInput, UpdateTodoContext>({
    mutationFn: ({ todo, changes }) => apiClient.updateTodo(todo.id, changes, { chaos: isChaosActive }),
    onMutate: async ({ todo, changes }) => {
      const queryKey = todoKeys.byUser(todo.assigneeId);
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      queryClient.setQueryData<Todo[]>(queryKey, (current) => current?.map((item) => item.id === todo.id ? { ...item, ...changes, isOptimistic: true } : item));
      return { previousTodos, queryKey };
    },
    onError: (error, input, context) => {
      if (context) {
        if (context.previousTodos === undefined) queryClient.removeQueries({ queryKey: context.queryKey, exact: true });
        else queryClient.setQueryData(context.queryKey, context.previousTodos);
      }
      toast.toast({
        type: 'error', title: 'Task edit reverted',
        message: `Unable to save “${input.todo.title}”. ${error.message} Your changes were reverted.`,
        action: { label: 'Try again', onAction: () => { void mutation.mutateAsync(input).catch(() => undefined); } },
      });
    },
    onSettled: async (_data, _error, { todo }) => { await queryClient.invalidateQueries({ queryKey: todoKeys.byUser(todo.assigneeId) }); },
  });
  return mutation;
}
