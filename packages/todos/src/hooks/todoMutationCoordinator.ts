import type { QueryClient, QueryKey } from '@tanstack/react-query';

const activeMutationCounts = new WeakMap<QueryClient, Map<string, number>>();

function serializeQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey);
}

export function beginTodoMutation(queryClient: QueryClient, queryKey: QueryKey): void {
  const key = serializeQueryKey(queryKey);
  const counts = activeMutationCounts.get(queryClient) ?? new Map<string, number>();
  counts.set(key, (counts.get(key) ?? 0) + 1);
  activeMutationCounts.set(queryClient, counts);
}

export function finishTodoMutation(queryClient: QueryClient, queryKey: QueryKey): boolean {
  const counts = activeMutationCounts.get(queryClient);
  if (!counts) return true;

  const key = serializeQueryKey(queryKey);
  const remaining = Math.max((counts.get(key) ?? 1) - 1, 0);
  if (remaining > 0) {
    counts.set(key, remaining);
    return false;
  }

  counts.delete(key);
  if (counts.size === 0) activeMutationCounts.delete(queryClient);
  return true;
}
