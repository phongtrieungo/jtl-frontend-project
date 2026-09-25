import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { apiClient, isChaosActiveAtom, todoKeys, useToast } from '@todo/shared';
import type { CreateTodoInput, Todo } from '@todo/shared';

interface CreateTodoContext {
  previousTodos: Todo[] | undefined;
  queryKey: ReturnType<typeof todoKeys.byUser>;
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const isChaosActive = useAtomValue(isChaosActiveAtom);
  const toast = useToast();

  return useMutation<Todo, Error, CreateTodoInput, CreateTodoContext>({
    mutationFn: (input) => apiClient.createTodo(input, { chaos: isChaosActive }),
    onMutate: async (input) => {
      const queryKey = todoKeys.byUser(input.assigneeId);
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`,
        title: input.title,
        assigneeId: input.assigneeId,
        completed: false,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      queryClient.setQueryData<Todo[]>(queryKey, (current) => [...(current ?? []), optimisticTodo]);
      return { previousTodos, queryKey };
    },
    onError: (error, input, context) => {
      if (context) {
        if (context.previousTodos === undefined) {
          queryClient.removeQueries({ queryKey: context.queryKey, exact: true });
        } else {
          queryClient.setQueryData(context.queryKey, context.previousTodos);
        }
      }
      toast.error(`Unable to save task “${input.title}”. ${error.message} Your changes were reverted.`, 'Task not saved');
    },
    onSettled: async (_data, _error, input) => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.byUser(input.assigneeId) });
    },
  });
}
