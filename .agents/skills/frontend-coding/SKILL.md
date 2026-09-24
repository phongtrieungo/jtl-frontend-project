---
name: frontend-coding
description: Coding standards, architectural patterns, and strict guidelines for React, TypeScript, Turborepo module boundaries, TanStack Query, TanStack Router, Jotai, and Zod in this project.
---

# Frontend Coding Guidelines & Patterns

This skill defines the technical rules, architectural guardrails, and coding patterns required when writing or reviewing code in this monorepo. Every code contribution must adhere to these standards to maintain structural integrity, predictability, and high engineering quality.

---

## 1. Monorepo & Package Boundary Rules

### 1.1 Strict Dependency Boundaries
- **Rule 1: ZERO Sideways Imports.**
  - `packages/users` MUST NEVER import from `packages/todos`.
  - `packages/todos` MUST NEVER import from `packages/users`.
  - Shared domain interfaces, utilities, and UI primitives MUST be placed in `packages/shared`.
- **Rule 2: Unidirectional Flow.**
  - `apps/web` imports from `packages/users`, `packages/todos`, and `packages/shared`.
  - `packages/users` imports only from `packages/shared` and external NPM dependencies.
  - `packages/todos` imports only from `packages/shared` and external NPM dependencies.
  - `packages/shared` imports only from external NPM dependencies.
- **Rule 3: Decoupled Backend Service.**
  - `services/bff` (.NET 8 Minimal API) is completely decoupled. Frontend packages NEVER import .NET code or direct binaries.
  - All communication between frontend and backend occurs strictly over HTTP REST endpoints typed via `packages/shared`.

### 1.2 Export Encapsulation
- Every package exposes its public API strictly through its root `src/index.ts`.
- Deep imports (e.g., `import { ... } from '@todo/users/src/internal/...'`) are strictly prohibited.
- Internal helper utilities must not be exported from `src/index.ts`.

---

## 2. TypeScript & Type Safety Rules

- **Strict Mode Enforced:** No implicit `any`, strict null checks, and explicit function return types on public APIs and hooks.
- **Shared Domain Models:** Domain IDs must be strongly typed (e.g. `UserId = string`, `TodoId = string`).
- **Discriminated Unions for Async State:** When dealing with non-React-Query state, use discriminated unions:
  ```typescript
  type AsyncState<T> =
    | { status: 'idle'; data: null; error: null }
    | { status: 'loading'; data: null; error: null }
    | { status: 'success'; data: T; error: null }
    | { status: 'error'; data: null; error: Error };
  ```
- **Zod Schema Inference:** Always derive TypeScript types from Zod schemas when defining form models:
  ```typescript
  export const createUserSchema = z.object({
    username: z.string().trim().min(3).max(20),
  });
  export type CreateUserInput = z.infer<typeof createUserSchema>;
  ```

---

## 3. Server State & TanStack Query v5 Patterns

### 3.1 Query Key Factory Pattern
Never use ad-hoc array literals as query keys. Always declare a query key factory:
```typescript
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  byUser: (userId: string) => [...todoKeys.lists(), { userId }] as const,
  detail: (id: string) => [...todoKeys.all, 'detail', id] as const,
};
```

### 3.2 Canonical Optimistic Update Pattern (Mandatory for ToDos)
Every optimistic mutation must follow this 3-step contract:
1. `onMutate`: Cancel in-flight queries, snapshot the previous state, update the cache with an optimistic record, and return the snapshot context.
2. `onError`: Revert the cache using the snapshot context, and trigger an error notification.
3. `onSettled`: Invalidate queries to reconcile local state with the server source of truth.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoKeys } from './queryKeys';
import { createTodoApi } from '../api/todoApi';
import type { CreateTodoInput, Todo } from '../types';

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodoApi(input),
    
    onMutate: async (newTodoInput) => {
      const queryKey = todoKeys.byUser(newTodoInput.assigneeId);

      // 1. Cancel in-flight refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot previous value
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey) ?? [];

      // 3. Optimistically insert new item
      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`,
        title: newTodoInput.title,
        assigneeId: newTodoInput.assigneeId,
        completed: false,
        createdAt: new Date().toISOString(),
        isOptimistic: true, // Flag for visual distinction
      };

      queryClient.setQueryData<Todo[]>(queryKey, (old = []) => [
        ...old,
        optimisticTodo,
      ]);

      // 4. Return context with snapshot
      return { previousTodos, queryKey };
    },

    onError: (err, newTodoInput, context) => {
      // Rollback to snapshot on error
      if (context?.queryKey && context?.previousTodos) {
        queryClient.setQueryData(context.queryKey, context.previousTodos);
      }
    },

    onSettled: (_data, _error, newTodoInput) => {
      // Invalidate to guarantee canonical state
      queryClient.invalidateQueries({
        queryKey: todoKeys.byUser(newTodoInput.assigneeId),
      });
    },
  });
}
```

---

## 4. Cross-Cutting UI State with Jotai

- **Surgical Atoms:** Store only minimal primitive values in atoms (e.g. `selectedUserIdAtom = atom<string | null>(null)`).
- **Naming Convention:** All atom identifiers must end with the `Atom` suffix.
- **Derived Atoms for Computations:** Prefer read-only derived atoms over duplicating state:
  ```typescript
  export const selectedUserIdAtom = atom<string | null>(null);
  export const hasSelectedUserAtom = atom((get) => get(selectedUserIdAtom) !== null);
  ```
- **Do Not Store Server Data in Jotai:** Server data belongs in TanStack Query. Use Jotai purely for ephemeral UI state (e.g., active filters, selected user context, chaos mode toggle).

---

## 5. Routing Patterns with TanStack Router

- **File-Based or Code-Based Route Definition:** Routes must declare explicit loaders and type-safe params.
- **Search Parameters Validation:** Validate search parameters using Zod schemas via `validateSearch`:
  ```typescript
  const todosSearchSchema = z.object({
    userId: z.string().optional(),
    filter: z.enum(['all', 'pending', 'completed']).catch('all'),
  });

  export const Route = createFileRoute('/todos')({
    validateSearch: (search) => todosSearchSchema.parse(search),
    component: TodosPage,
  });
  ```
- **Navigation:** Always use the `<Link>` component with typed `to` and `search` props to preserve full type safety.

---

## 6. Component Architecture & Separation of Concerns

Keep Presentation, State/Data Access, and Business Logic separated:

1. **Presentation Components (Dumb / Pure):**
   - Accept props and emit events (`onClick`, `onSubmit`).
   - Do not invoke API calls or `useMutation` directly.
   - Example: `TodoList({ todos, onToggle }: TodoListProps)`.
2. **Container / Feature Components:**
   - Consume feature hooks (`useTodosByUser`, `useCreateTodo`).
   - Pass resolved data and callbacks down to presentation components.
   - Example: `UserTodosContainer({ userId }: { userId: string })`.
3. **Custom Hooks:**
   - Encapsulate data fetching, caching, and mutation orchestration.
   - Handle cache invalidation and rollback.
   - Return clean interfaces `{ data, isLoading, isError, createTodo }`.
