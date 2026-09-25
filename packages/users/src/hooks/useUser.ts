import { useQuery } from '@tanstack/react-query';
import { apiClient, userKeys } from '@todo/shared';
export function useUser(id: string) { return useQuery({ queryKey: userKeys.detail(id), queryFn: () => apiClient.getUserById(id), enabled: Boolean(id), staleTime: 30_000, gcTime: 300_000 }); }
