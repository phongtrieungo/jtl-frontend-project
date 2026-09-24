---
name: frontend-testing
description: Comprehensive testing strategy, test pyramid, Vitest and React Testing Library recipes, optimistic update rollback verification, and testing reflection guidelines for this project.
---

# Frontend Testing Strategy & Implementation Recipes

This skill outlines the testing methodology, architectural test pyramid, and specific test recipes for this project. It serves both as an execution guide for unit/integration tests and as the authoritative framework for the project's **Testing Reflection** deliverable.

---

## 1. Production Testing Pyramid & Architecture

In an enterprise-grade production environment, testing is structured across four layers:

```
                  ┌────────────────────────┐
                  │    E2E Tests (5%)      │  Playwright (Critical User Flows)
                  ├────────────────────────┤
                  │ Integration Tests (25%)│  RTL + QueryClient + In-Memory/MSW
                  ├────────────────────────┤
                  │ Component Tests (30%)  │  RTL (Isolated Presentational UI)
                  ├────────────────────────┤
                  │ Unit Tests (40%)       │  Vitest (Schemas, Atoms, Utils)
                  └────────────────────────┘
```

### Layer Breakdown
1. **Unit Tests (Fast, Isolated):**
   - Zod validation schemas (`createUserSchema`, `createTodoSchema`).
   - Pure utilities (date formatters, query key factories).
   - Jotai atom state transitions & derived atom logic.
2. **Component Tests (Accessibility & Presentation):**
   - Verify proper rendering of UI states (empty, loading skeleton, error, filled).
   - Verify accessible labeling (`aria-describedby`, `aria-invalid`, keyboard navigation).
   - Verify simulated user interactions (clicks, keyboard input, submit).
3. **Integration Tests (Feature Modules & Data Layer):**
   - Test TanStack Query hooks with an in-memory client.
   - **Crucial:** Verify the optimistic update lifecycle (immediate render -> server resolve -> cache update OR server error -> rollback).
4. **End-to-End Tests (Full System Verification):**
   - Navigation across routes with TanStack Router (`/` -> `/users` -> `/users/:id` -> `/todos`).
   - Cross-cutting state verification: selecting an active user in the header persists context on the ToDo creation form.
   - Chaos mode simulation: toggle chaos mode, attempt to create a task, observe rollback and toast message.

---

## 2. Canonical Recipe: Testing Optimistic Update with Rollback

Testing optimistic updates requires deterministic timing control to inspect the DOM and Query Cache at three distinct points:
1. **Immediately after submit (Optimistic state):** The item must be present in the UI before the network promise resolves.
2. **During the inflight request:** Visual indicator (e.g. "Saving..." badge) is active.
3. **On rejected promise (Rollback state):** The item is removed from the DOM, and an error alert is rendered.

### 2.1 Vitest + React Testing Library Implementation Pattern

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoFeature } from '../components/TodoFeature';
import * as api from '../api/todoApi';

describe('ToDo Optimistic Mutation with Deterministic Rollback', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const renderWithClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('optimistically displays the new task immediately, then rolls back upon API failure', async () => {
    const user = userEvent.setup();

    // 1. Create a deferred promise to control when the API rejects
    let rejectApi!: (reason: Error) => void;
    const apiPromise = new Promise((_, reject) => {
      rejectApi = reject;
    });

    vi.spyOn(api, 'createTodoApi').mockReturnValue(apiPromise as any);

    renderWithClient(<TodoFeature userId="user-1" />);

    // 2. Fill and submit the form
    const titleInput = screen.getByLabelText(/task title/i);
    const submitButton = screen.getByRole('button', { name: /create task/i });

    await user.type(titleInput, 'Buy Groceries');
    await user.click(submitButton);

    // 3. STEP 1 ASSERTION: Item is immediately present in DOM (Optimistic)
    expect(screen.getByText('Buy Groceries')).toBeInTheDocument();
    expect(screen.getByText(/saving/i)).toBeInTheDocument();

    // Form should reset immediately to avoid blocking user
    expect(titleInput).toHaveValue('');

    // 4. STEP 2 TRIGGER: Reject the API call (simulating network failure)
    rejectApi(new Error('Simulated network error'));

    // 5. STEP 3 ASSERTION: Item is rolled back and removed from DOM
    await waitFor(() => {
      expect(screen.queryByText('Buy Groceries')).not.toBeInTheDocument();
    });

    // 6. Verification: Error alert notification is displayed
    expect(
      screen.getByRole('alert', { name: /failed to create task/i })
    ).toBeInTheDocument();
  });
});
```

---

## 3. Testing Package Boundaries & Module Isolation

To ensure feature packages remain completely decoupled:
1. **Mocking Shared Providers:** Feature package tests must provide a lightweight wrapper rendering `QueryClientProvider` without relying on `apps/web`.
2. **Boundary Linting:** Use ESLint rules (`no-restricted-imports`) in CI to prevent cross-feature imports:
   ```json
   {
     "rules": {
       "no-restricted-imports": ["error", {
         "patterns": ["@todo/users/*", "@todo/todos/*"]
       }]
     }
   }
   ```
3. **Isolated Test Execution:** Turborepo must be able to run `pnpm --filter @todo/users test` and `pnpm --filter @todo/todos test` completely independently.

---

## 4. Testing Zod Schemas & Jotai Atoms

### 4.1 Schema Testing
```typescript
import { createUserSchema } from './userSchemas';

describe('createUserSchema', () => {
  it('passes on valid alphanumeric username', () => {
    const result = createUserSchema.safeParse({ username: 'alex99' });
    expect(result.success).toBe(true);
  });

  it('fails when username is under 3 characters', () => {
    const result = createUserSchema.safeParse({ username: 'al' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 3 characters');
    }
  });
});
```

### 4.2 Jotai Atom Testing
```typescript
import { createStore } from 'jotai';
import { activeUserIdAtom, isUserSelectedAtom } from './userAtoms';

describe('Jotai User Atoms', () => {
  it('correctly derives isUserSelectedAtom when activeUserId is updated', () => {
    const store = createStore();
    expect(store.get(isUserSelectedAtom)).toBe(false);

    store.set(activeUserIdAtom, 'user-123');
    expect(store.get(isUserSelectedAtom)).toBe(true);

    store.set(activeUserIdAtom, null);
    expect(store.get(isUserSelectedAtom)).toBe(false);
  });
});
```

---

## 5. Accessibility Testing (Automated a11y)

Integrate `jest-axe` or `@axe-core/react` to prevent accessibility regressions:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('renders user creation form without accessibility violations', async () => {
  const { container } = renderWithClient(<UserCreateForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```
