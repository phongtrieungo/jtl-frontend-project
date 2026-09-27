import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { apiClient, isChaosActiveAtom, todoKeys, useToast, type Todo } from '@todo/shared';

export interface DeleteTodoInput { todo: Todo; }
interface DeleteTodoContext { previousTodos: Todo[] | undefined; queryKey: ReturnType<typeof todoKeys.byUser>; }

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  const isChaosActive = useAtomValue(isChaosActiveAtom);
  const toast = useToast();
  const mutation = useMutation<void, Error, DeleteTodoInput, DeleteTodoContext>({
    mutationFn: ({ todo }) => apiClient.deleteTodo(todo.id, { chaos: isChaosActive }),
    onMutate: async ({ todo }) => {
      const queryKey = todoKeys.byUser(todo.assigneeId);
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      queryClient.setQueryData<Todo[]>(queryKey, (current) => current?.filter((item) => item.id !== todo.id));
      return { previousTodos, queryKey };
    },
    onError: (error, input, context) => {
      if (context) {
        if (context.previousTodos === undefined) queryClient.removeQueries({ queryKey: context.queryKey, exact: true });
        else queryClient.setQueryData(context.queryKey, context.previousTodos);
      }
      toast.toast({
        type: 'error', title: 'Task deletion reverted',
        message: `Unable to delete “${input.todo.title}”. ${error.message} Your changes were reverted.`,
        action: { label: 'Try again', onAction: () => { void mutation.mutateAsync(input).catch(() => undefined); } },
      });
    },
    onSettled: async (_data, _error, { todo }) => { await queryClient.invalidateQueries({ queryKey: todoKeys.byUser(todo.assigneeId) }); },
  });
  return mutation;
}
