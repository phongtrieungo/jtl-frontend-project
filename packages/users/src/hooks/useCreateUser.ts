import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, userKeys } from '@todo/shared';
import type { CreateUserInput } from '@todo/shared';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => apiClient.createUser(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
