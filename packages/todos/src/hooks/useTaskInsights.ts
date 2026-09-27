import { useQueries } from '@tanstack/react-query';
import { apiClient, todoKeys } from '@todo/shared';
import { deriveTaskInsights } from '../utils/taskInsights';

export interface TaskInsightsResult {
  insights: ReturnType<typeof deriveTaskInsights>;
  isPending: boolean;
  isError: boolean;
  retry: () => void;
}

/** Observe the same per-user records that lifecycle mutations update and roll back. */
export function useTaskInsights(userIds: readonly string[]): TaskInsightsResult {
  const queries = useQueries({ queries: [...new Set(userIds)].map((userId) => ({
    queryKey: todoKeys.byUser(userId),
    queryFn: () => apiClient.getTodosByUser(userId),
    staleTime: 30_000,
    gcTime: 300_000,
  })) });
  return {
    insights: deriveTaskInsights(queries.flatMap((query) => query.data ?? [])),
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
    retry: () => { queries.forEach((query) => { void query.refetch(); }); },
  };
}
