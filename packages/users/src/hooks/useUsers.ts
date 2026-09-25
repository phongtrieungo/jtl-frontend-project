import { useQuery } from '@tanstack/react-query';
import { apiClient, userKeys } from '@todo/shared';

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => apiClient.getUsers(),
    staleTime: 60_000,
    gcTime: 300_000,
  });
}
