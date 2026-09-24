// packages/shared/src/api/queryKeys.ts

/**
 * Standardized Query Key Factory for User domain queries.
 * Enforces consistent cache invalidation and query deduplication.
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: () => [...userKeys.lists()] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
} as const;

/**
 * Standardized Query Key Factory for Todo domain queries.
 * Mandatory for optimistic mutations and rollback targeting.
 */
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: () => [...todoKeys.lists()] as const,
  byUser: (userId: string) => [...todoKeys.lists(), { userId }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
} as const;
