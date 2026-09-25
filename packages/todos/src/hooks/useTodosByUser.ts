import { useQuery } from '@tanstack/react-query';
import { apiClient, todoKeys } from '@todo/shared';

export function useTodosByUser(userId: string) {
  return useQuery({
    queryKey: todoKeys.byUser(userId),
    queryFn: () => apiClient.getTodosByUser(userId),
    enabled: Boolean(userId),
    staleTime: 30_000,
    gcTime: 300_000,
  });
}
