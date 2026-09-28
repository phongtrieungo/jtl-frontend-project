import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import {
  apiClient,
  isChaosActiveAtom,
  todoKeys,
  useToast,
  type CreateTodoInput,
  type Todo,
} from '@todo/shared';
import { beginTodoMutation, finishTodoMutation } from './todoMutationCoordinator';

interface CreateTodoContext {
  previousTodos: Todo[] | undefined;
  queryKey: ReturnType<typeof todoKeys.byUser>;
  optimisticTodoId: string;
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const isChaosActive = useAtomValue(isChaosActiveAtom);
  const toast = useToast();

  const mutation = useMutation<Todo, Error, CreateTodoInput, CreateTodoContext>({
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

      beginTodoMutation(queryClient, queryKey);
      queryClient.setQueryData<Todo[]>(queryKey, (current) => [...(current ?? []), optimisticTodo]);
      return { previousTodos, queryKey, optimisticTodoId: optimisticTodo.id };
    },
    onSuccess: (createdTodo, _input, context) => {
      queryClient.setQueryData<Todo[]>(context.queryKey, (current) =>
        current?.map((todo) => todo.id === context.optimisticTodoId ? createdTodo : todo),
      );
    },
    onError: (error, input, context) => {
      if (context) {
        let hasRemainingTodos = false;
        queryClient.setQueryData<Todo[]>(context.queryKey, (current) => {
          const next = (current ?? []).filter((todo) => todo.id !== context.optimisticTodoId);
          hasRemainingTodos = next.length > 0;
          return next;
        });
        if (context.previousTodos === undefined && !hasRemainingTodos) {
          queryClient.removeQueries({ queryKey: context.queryKey, exact: true });
        }
      }
      toast.toast({
        type: 'error',
        title: 'Task not saved',
        message: `Unable to save task “${input.title}”. ${error.message} Your changes were reverted.`,
        action: { label: 'Try again', onAction: () => { void mutation.mutateAsync(input).catch(() => undefined); } },
      });
    },
    onSettled: async (_data, _error, input) => {
      const queryKey = todoKeys.byUser(input.assigneeId);
      if (finishTodoMutation(queryClient, queryKey)) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
  });
  return mutation;
}
