import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { apiClient, isChaosActiveAtom, todoKeys, useToast, type Todo } from '@todo/shared';
import { beginTodoMutation, finishTodoMutation } from './todoMutationCoordinator';

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
      beginTodoMutation(queryClient, queryKey);
      queryClient.setQueryData<Todo[]>(queryKey, (current) => current?.filter((item) => item.id !== todo.id));
      return { previousTodos, queryKey };
    },
    onError: (error, input, context) => {
      if (context) {
        const deletedIndex = context.previousTodos?.findIndex((todo) => todo.id === input.todo.id) ?? -1;
        if (deletedIndex >= 0) {
          const deletedTodo = context.previousTodos?.[deletedIndex] ?? input.todo;
          queryClient.setQueryData<Todo[]>(context.queryKey, (current) => {
            if (current?.some((todo) => todo.id === deletedTodo.id)) return current;
            const next = [...(current ?? [])];
            next.splice(Math.min(deletedIndex, next.length), 0, deletedTodo);
            return next;
          });
        }
      }
      toast.toast({
        type: 'error', title: 'Task deletion reverted',
        message: `Unable to delete “${input.todo.title}”. ${error.message} Your changes were reverted.`,
        action: { label: 'Try again', onAction: () => { void mutation.mutateAsync(input).catch(() => undefined); } },
      });
    },
    onSettled: async (_data, _error, { todo }) => {
      const queryKey = todoKeys.byUser(todo.assigneeId);
      if (finishTodoMutation(queryClient, queryKey)) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
  });
  return mutation;
}
