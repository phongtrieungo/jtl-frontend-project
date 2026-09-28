import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { apiClient, isChaosActiveAtom, todoKeys, useToast, type Todo } from '@todo/shared';
import { beginTodoMutation, finishTodoMutation } from './todoMutationCoordinator';

export interface ToggleTodoInput {
  todo: Todo;
}

interface ToggleTodoContext {
  previousTodos: Todo[] | undefined;
  queryKey: ReturnType<typeof todoKeys.byUser>;
}

export function useToggleTodo() {
  const queryClient = useQueryClient();
  const isChaosActive = useAtomValue(isChaosActiveAtom);
  const toast = useToast();

  const mutation = useMutation<Todo, Error, ToggleTodoInput, ToggleTodoContext>({
    mutationFn: ({ todo }) => apiClient.toggleTodo(todo.id, { chaos: isChaosActive }),
    onMutate: async ({ todo }) => {
      const queryKey = todoKeys.byUser(todo.assigneeId);
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      beginTodoMutation(queryClient, queryKey);
      queryClient.setQueryData<Todo[]>(queryKey, (current) =>
        current?.map((item) => item.id === todo.id ? { ...item, completed: !item.completed, isOptimistic: true } : item)
      );
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
        type: 'error', title: 'Task status reverted',
        message: `Unable to update “${input.todo.title}”. ${error.message} Your changes were reverted.`,
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
