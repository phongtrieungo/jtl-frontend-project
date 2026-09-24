# System Architecture & Technical Specification

## 1. Monorepo Topology & Boundaries

The codebase is organized as a lightweight Turborepo monorepo. The structure enforces strict encapsulation, clean separation of concerns, and unidirectional dependency flows.

```
                              ┌────────────────┐
                              │    apps/web    │  (Composition & Routes)
                              └───────┬────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      ┌─────────────────────┐                   ┌─────────────────────┐
      │   packages/users    │                   │   packages/todos    │
      │   (User Domain)     │                   │   (Todo Domain)     │
      └──────────┬──────────┘                   └──────────┬──────────┘
                 │                                         │
                 │     NO SIDEWAYS DEPENDENCY ALLOWED     │
                 │     (users ⇎ todos: strictly isolated)  │
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │   packages/shared   │
                           │ (Core, Types, Mock) │
                           └─────────────────────┘
```

### 1.1 Package Responsibilities

| Package | Type | Responsibilities | Dependencies |
| :--- | :--- | :--- | :--- |
| **`apps/web`** | Application | Route definitions (TanStack Router), page layouts, feature composition, global providers, asset bundling. | `packages/users`, `packages/todos`, `packages/shared` |
| **`packages/users`** | Feature Module | User domain types, API client methods, TanStack Query hooks, user components (`UserCreateForm`, `UserDetailCard`, `UserList`). | `packages/shared` |
| **`packages/todos`** | Feature Module | Todo domain types, API client methods, optimistic mutation hooks (`useCreateTodo`), todo components (`TodoCreateForm`, `TodoList`, `TodoItemRow`). | `packages/shared` |
| **`packages/shared`** | Core Library | Domain cross-cutting types, UI primitives (Button, Input, Alert, Card, Spinner), in-memory mock database & API engine, Jotai atoms, query client setup. | External libraries only |

### 1.2 Strict Boundary Rules
1. **Zero Sideways Dependency:** `packages/users` cannot import from `packages/todos`, and `packages/todos` cannot import from `packages/users`.
2. **Feature Encapsulation:** All internal helpers in feature packages remain private; only public interfaces are exported via the package `index.ts`.
3. **Shared Inversion:** If `todos` needs to know about a user (e.g. an assignee ID or displaying an assignee badge), it uses the shared User type definition `UserSummary` or `UserId` declared in `packages/shared`.
4. **App as Composer:** The web application (`apps/web`) acts solely as the orchestrator and layout composer. It binds route paths to page components that assemble feature components.

---

## 2. Data Layer & Server State Architecture

### 2.1 TanStack Query v5 Key Factory
To prevent cache key collisions and ensure type-safe cache invalidation, cache keys are managed using hierarchical query key factories:

```typescript
// Query Key Factories
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  byUser: (userId: string) => [...todoKeys.lists(), { userId }] as const,
  detail: (id: string) => [...todoKeys.all, 'detail', id] as const,
};
```

### 2.2 In-Memory Mock Database & Chaos Simulation Engine
Located in `packages/shared/src/api/mockDb.ts`:
- **Persistence:** In-memory store initialized with seed data and optionally synced to `window.localStorage` for multi-tab refresh continuity.
- **Latency Emulation:** Every mock endpoint passes through an artificial delay function (`delay(300)`).
- **Chaos Mode (Failure Injection):** Controlled by an in-memory flag and Jotai atom (`isChaosModeAtom`). When chaos mode is toggled ON, writes (mutations) reject with a `500 Simulated Network Failure` error, enabling on-demand deterministic verification of the optimistic rollback.

### 2.3 Optimistic Update Sequence & Rollback Lifecycle

The ToDo creation flow represents the primary data-consistency showcase:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Interface
    participant Hook as useCreateTodo (TanStack Query)
    participant Cache as Query Cache (todoKeys.byUser)
    participant API as Mock API Service (with Latency)

    User->>Hook: submit(newTodo)
    activate Hook
    Note over Hook,Cache: onMutate Lifecycle Triggered
    Hook->>Cache: cancelQueries({ queryKey })
    Hook->>Cache: snapshot = getQueryData(queryKey)
    Hook->>Cache: setQueryData(queryKey, [...snapshot, optimisticItem])
    Cache-->>User: Instant UI Re-render (item visible with 'Saving...' badge)
    Hook-->>User: Form reset & immediate focus return
    
    Hook->>API: createTodo(newTodo)
    activate API
    
    alt Network Success
        API-->>Hook: 201 Created (persistedItem with real ID)
        deactivate API
        Note over Hook,Cache: onSuccess / onSettled
        Hook->>Cache: setQueryData(replace optimisticItem with persistedItem)
        Cache-->>User: UI updates badge to 'Completed' / settled state
    else Network Failure / Chaos Mode Active
        API-->>Hook: 500 Simulated Network Failure
        deactivate API
        Note over Hook,Cache: onError Lifecycle Triggered
        Hook->>Cache: setQueryData(queryKey, snapshot) [ROLLBACK]
        Cache-->>User: Optimistic item removed from list
        Hook-->>User: Trigger Toast/Alert ("Failed to create task. Reverted.")
    end
    
    Hook->>Cache: invalidateQueries({ queryKey })
    deactivate Hook
```

---

## 3. Client State Architecture (Jotai)

Cross-cutting UI state is managed with **Jotai** atoms located in `packages/shared/src/state`:

```typescript
// Atom definitions
export const activeUserIdAtom = atom<string | null>(null);

// Derived atom: provides convenient active user state resolution
export const isUserSelectedAtom = atom((get) => get(activeUserIdAtom) !== null);

// Chaos Mode atom: controls whether mock API mutations fail
export const chaosModeAtom = atom<boolean>(false);

// Global UI notification / toast atom
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
export const toastListAtom = atom<ToastMessage[]>([]);
```

### 3.1 Architectural Justification: Why Jotai?
- **Surgical Re-renders:** Unlike React Context, where any update re-renders all consuming components regardless of which slice of state changed, Jotai updates only components subscribed to the specific atom.
- **Minimal Boilerplate:** No store configurations, action types, or reducer functions required for lightweight cross-cutting concerns.
- **Separation from Server State:** Server data belongs in TanStack Query cache. Jotai is strictly reserved for ephemeral client concerns (active session user, UI filter, chaos toggle).

---

## 4. Routing Architecture (TanStack Router)

Located in `apps/web/src/routes`:

### 4.1 Route Hierarchy
- `__root.tsx`: Top-level application layout. Renders the navigation header, user picker, chaos toggle, notification viewport, and `<Outlet />`.
- `index.tsx`: `/` (Dashboard overview).
- `users/index.tsx`: `/users` (User creation form + user cards directory).
- `users/$id.tsx`: `/users/:id` (User detail profile view + assigned tasks preview).
- `todos.tsx`: `/todos` (Master task management screen, user filter dropdown, and optimistic task creator).

### 4.2 Type-Safe Router Integration
- Routes are statically typed using TanStack Router's route configuration.
- Search parameters (such as `userId` on the `/todos` route) are parsed and validated with Zod, guaranteeing that components receive strictly typed query parameters.

---

## 5. Form Validation & UX Architecture

### 5.1 Validation Strategy (Zod)
Zod schemas validate inputs prior to dispatching mutations:
- `createUserSchema`: `{ username: z.string().trim().min(3, "Username must be at least 3 characters").max(20, "Username cannot exceed 20 characters") }`
- `createTodoSchema`: `{ title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"), assigneeId: z.string().min(1, "Please select an assignee") }`

### 5.2 Accessibility & Semantic Contract
- **Form Controls:** `<label htmlFor="field-id">` bound explicitly to `<input id="field-id">`.
- **Validation Linking:** Errors are linked using `aria-invalid="true"` and `aria-describedby="field-id-error"`.
- **Keyboard Navigation:** Forms support full keyboard progression (`Tab`, `Shift+Tab`, `Enter` submit, `Escape` cancel).
- **Focus Restoration:** Form submissions return focus safely to the primary input without causing disorientation.
- **Screen Reader Announcements:** Dynamic mutations and rollback events emit announcements via a live region (`role="alert"` or `role="status"`).

---

## 6. Directory Blueprint

```
/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── routes/
│       │   │   ├── __root.tsx
│       │   │   ├── index.tsx
│       │   │   ├── users/
│       │   │   │   ├── index.tsx
│       │   │   │   └── $id.tsx
│       │   │   └── todos.tsx
│       │   ├── main.tsx
│       │   ├── router.ts
│       │   └── index.css
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── api/             # Mock DB, delay utility, chaos mode logic
│   │   │   ├── components/      # Button, Input, Card, Modal, Toast, Spinner
│   │   │   ├── state/           # Jotai atoms (activeUser, chaosMode, toasts)
│   │   │   ├── types/           # Shared domain types (User, Todo, ApiResponse)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── users/
│   │   ├── src/
│   │   │   ├── api/             # User API calls (fetchUsers, fetchUserById, createUser)
│   │   │   ├── components/      # UserCreateForm, UserList, UserDetailCard
│   │   │   ├── hooks/           # useUsers, useUser, useCreateUser
│   │   │   ├── schemas/         # userValidationSchemas
│   │   │   ├── types/           # User feature types
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── todos/
│       ├── src/
│       │   ├── api/             # Todo API calls (fetchTodosByUser, createTodo)
│       │   ├── components/      # TodoCreateForm, TodoList, TodoItemRow
│       │   ├── hooks/           # useTodosByUser, useCreateTodo (optimistic)
│       │   ├── schemas/         # todoValidationSchemas
│       │   ├── types/           # Todo feature types
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   ├── prd.md
│   ├── architecture.md
│   └── sprint-planning.md
├── .agents/
│   └── skills/
│       ├── frontend-coding/SKILL.md
│       ├── frontend-design/SKILL.md
│       └── frontend-testing/SKILL.md
├── ai-journey/
│   └── master-journey.md
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 7. Architectural Decisions & Trade-Offs

| Decision | Alternative Considered | Chosen Approach | Trade-off / Justification |
| :--- | :--- | :--- | :--- |
| **Monorepo Tooling** | Nx, Lerna | **Turborepo** | Minimal overhead, zero-config pipelines (`build`, `lint`, `dev`), aligns perfectly with the take-home prompt requirement. |
| **Package Manager** | npm, yarn | **pnpm** (or npm workspaces) | Fast, disk-efficient symlinking, strict dependency isolation preventing phantom dependencies. |
| **Server State** | Redux Toolkit / RTK Query | **TanStack Query v5** | Industry standard for asynchronous server state, built-in cancellation, standard `onMutate` rollback mechanics. |
| **Routing** | React Router v6 | **TanStack Router** | Full TypeScript param inference, first-class search param validation via Zod, seamless integration with TanStack Query. |
| **Cross-Cutting State** | React Context API | **Jotai** | Avoids provider tree nesting and unnecessary subtree re-renders; provides clean atomic reactivity for active user & chaos mode. |
| **Form Handling** | React Hook Form | **Lightweight Controlled Form + Zod** | Removes heavy external form dependencies for small 1-2 field forms, reducing bundle size while maintaining strict Zod validation. |
| **Backend Mocking** | MSW (Service Worker) | **Typed In-Memory Mock Engine** | Service Workers can face cross-origin or bundler integration issues in minimal monorepo setups. An in-memory client provides deterministic, zero-config execution with reproducible latency and failure injection. |
