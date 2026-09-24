// packages/shared/src/types/domain.ts

/**
 * Strongly-typed domain identifiers.
 */
export type UserId = string;
export type TodoId = string;

/**
 * Complete User domain model.
 */
export interface User {
  readonly id: UserId;
  readonly username: string;
  readonly createdAt: string;
  readonly taskCount?: number;
}

/**
 * Lightweight summary of a user for listings, selectors, and badges.
 */
export interface UserSummary {
  readonly id: UserId;
  readonly username: string;
  readonly taskCount?: number;
}

/**
 * Payload required to create a new user.
 */
export interface CreateUserInput {
  readonly username: string;
}

/**
 * Complete Todo domain model with optimistic tracking metadata.
 */
export interface Todo {
  readonly id: TodoId;
  readonly title: string;
  readonly assigneeId: UserId;
  readonly completed: boolean;
  readonly createdAt: string;
  /**
   * Flag indicating this item is in-flight in the client cache
   * before server confirmation.
   */
  readonly isOptimistic?: boolean;
}

/**
 * Lightweight summary of a todo item.
 */
export interface TodoSummary {
  readonly id: TodoId;
  readonly title: string;
  readonly assigneeId: UserId;
  readonly completed: boolean;
  readonly createdAt: string;
  readonly isOptimistic?: boolean;
}

/**
 * Payload required to create a new todo item.
 */
export interface CreateTodoInput {
  readonly title: string;
  readonly assigneeId: UserId;
}

/**
 * Payload for updating an existing todo item.
 */
export interface UpdateTodoInput {
  readonly title?: string;
  readonly completed?: boolean;
  readonly assigneeId?: UserId;
}

/**
 * Backend health check and mode diagnostic model.
 */
export interface ApiHealthStatus {
  readonly status: 'ok' | 'degraded' | 'offline';
  readonly mode: 'bff' | 'mock';
  readonly latencyMs?: number;
  readonly timestamp: string;
}
