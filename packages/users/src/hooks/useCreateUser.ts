import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, userKeys, type CreateUserInput } from '@todo/shared';
export function useCreateUser() { const client = useQueryClient(); return useMutation({ mutationFn: (input: CreateUserInput) => apiClient.createUser(input), onSuccess: () => client.invalidateQueries({ queryKey: userKeys.lists() }) }); }
