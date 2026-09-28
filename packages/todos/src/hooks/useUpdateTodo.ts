import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { apiClient, isChaosActiveAtom, todoKeys, useToast, type Todo, type UpdateTodoInput } from '@todo/shared';
import { beginTodoMutation, finishTodoMutation } from './todoMutationCoordinator';

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
      beginTodoMutation(queryClient, queryKey);
      queryClient.setQueryData<Todo[]>(queryKey, (current) => current?.map((item) => item.id === todo.id ? { ...item, ...changes, isOptimistic: true } : item));
      return { previousTodos, queryKey };
    },
    onSuccess: (updatedTodo, _input, context) => {
      queryClient.setQueryData<Todo[]>(context.queryKey, (current) =>
        current?.map((todo) => todo.id === updatedTodo.id ? updatedTodo : todo),
      );
    },
    onError: (error, input, context) => {
      if (context) {
        const previousTodo = context.previousTodos?.find((todo) => todo.id === input.todo.id);
        if (previousTodo) {
          queryClient.setQueryData<Todo[]>(context.queryKey, (current) =>
            current?.map((todo) => todo.id === previousTodo.id ? previousTodo : todo),
          );
        }
      }
      toast.toast({
        type: 'error', title: 'Task edit reverted',
        message: `Unable to save “${input.todo.title}”. ${error.message} Your changes were reverted.`,
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
