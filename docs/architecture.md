# System Architecture & Technical Specification

## 1. Monorepo Topology & Boundaries

The codebase is organized as a lightweight Turborepo monorepo accommodating the frontend application, domain feature packages, shared core library, and a dedicated **Backend-for-Frontend (BFF)** service in .NET 8.

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
                           │  (Dual-Mode Client, │
                           │  UI Kit, Atoms, DB) │
                           └──────────┬──────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │ (Dual-Mode Adapter Resolution)  │
                     ▼                                 ▼
         ┌───────────────────────┐         ┌───────────────────────┐
         │     services/bff      │         │  In-Browser Mock DB   │
         │  (ASP.NET Core .NET 8 │         │   (Zero-Dependency    │
         │     Minimal API)      │         │   Reviewer Fallback)  │
         └───────────────────────┘         └───────────────────────┘
```

### 1.1 Package & Service Responsibilities

| Path | Type | Responsibilities | Dependencies |
| :--- | :--- | :--- | :--- |
| **`apps/web`** | Web Application | Route definitions (TanStack Router), page layouts, feature composition, global providers, asset bundling. | `packages/users`, `packages/todos`, `packages/shared` |
| **`services/bff`** | Backend Service | ASP.NET Core (.NET 8) Minimal API, REST endpoints, in-memory concurrent data store, chaos/latency middleware, OpenAPI/Swagger. | .NET 8 runtime / ASP.NET Core |
| **`packages/users`** | Feature Module | User domain types, API hooks (`useUsers`, `useUser`, `useCreateUser`), user components (`UserCreateForm`, `UserDetailCard`, `UserList`). | `packages/shared` |
| **`packages/todos`** | Feature Module | Todo domain types, optimistic mutation hooks (`useCreateTodo`), todo components (`TodoCreateForm`, `TodoList`, `TodoItemRow`). | `packages/shared` |
| **`packages/shared`** | Core Library | Domain types, UI primitives (Button, Input, Alert, Card, Spinner), Dual-Mode API Client, in-memory mock engine, Jotai atoms, query client setup. | External libraries only |

### 1.2 Strict Boundary Invariants
1. **Zero Sideways Dependency:** `packages/users` cannot import from `packages/todos`, and `packages/todos` cannot import from `packages/users`.
2. **Feature Encapsulation:** All internal helpers in feature packages remain private; only public interfaces are exported via the package `index.ts`.
3. **Shared Inversion:** If `todos` needs to reference a user (e.g. an assignee ID or displaying an assignee badge), it uses the shared User type definition `UserSummary` or `UserId` declared in `packages/shared`.
4. **App as Composer:** The web application (`apps/web`) acts solely as the orchestrator and layout composer. It binds route paths to page components that assemble feature components.
5. **Decoupled Backend Service:** `services/bff` is a standalone HTTP service. The frontend packages interact with it exclusively over standard REST/JSON contracts mediated by `packages/shared`.

---

## 2. Backend for Frontend (BFF) Architecture (.NET 8)

The BFF service resides in `services/bff` and is built using **ASP.NET Core 8.0 Minimal APIs**.

### 2.1 BFF Directory Blueprint
```
services/bff/
├── Endpoints/
│   ├── UserEndpoints.cs       # MapGet("/api/users"), MapPost("/api/users")
│   └── TodoEndpoints.cs       # MapGet("/api/todos"), MapPost("/api/todos")
├── Middleware/
│   └── ChaosAndLatencyMiddleware.cs # Injects 200-400ms latency & chaos 500 errors
├── Models/
│   ├── UserDto.cs             # Id, Username, CreatedAt, TaskCount
│   ├── TodoDto.cs             # Id, Title, AssigneeId, Completed, CreatedAt
│   └── Requests.cs            # CreateUserRequest, CreateTodoRequest
├── Services/
│   ├── IUserStore.cs          # Thread-safe in-memory user repository
│   ├── InMemoryUserStore.cs
│   ├── ITodoStore.cs          # Thread-safe in-memory todo repository
│   ├── InMemoryTodoStore.cs
│   └── ChaosService.cs        # Global chaos mode state coordinator
├── Program.cs                 # Minimal API entrypoint, CORS & Swagger setup
├── appsettings.json
└── bff.csproj                 # TargetFramework: net8.0
```

### 2.2 In-Memory Thread-Safe Data Layer
- Utilizes `ConcurrentDictionary<string, UserDto>` and `ConcurrentDictionary<string, TodoDto>`.
- Pre-seeded on application startup with realistic demo users and assigned tasks.
- Eliminates any requirement for external database instances (PostgreSQL, Docker, SQL Server).

### 2.3 Chaos & Latency Emulation Middleware
To test optimistic rollbacks across the real network boundary:
- **Artificial Latency:** Automatically delays responses by 200–400ms to simulate real-world network latency.
- **Simulated Failure Injection:** When the incoming request contains header `X-Simulate-Chaos: true` (or when the server chaos flag is active), write requests (`POST /api/todos`) immediately return `500 Internal Server Error` with payload `{"error": "Simulated Network Failure"}`.

---

## 3. Evaluator-First Dual-Mode API Architecture

To ensure any evaluator can run the application seamlessly—even if they do not have the .NET 8 SDK installed—the data layer implements a **Dual-Mode Adapter**:

```typescript
// packages/shared/src/api/apiClient.ts
export interface ApiClient {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User>;
  createUser(input: CreateUserInput): Promise<User>;
  getTodosByUser(userId: string): Promise<Todo[]>;
  createTodo(input: CreateTodoInput, options?: { chaos?: boolean }): Promise<Todo>;
  toggleTodo(id: string): Promise<Todo>;
  checkHealth(): Promise<boolean>;
}
```

### 3.1 Dual-Mode Resolution Strategy
1. **Mode Detection:**
   - If `VITE_API_MODE === 'bff'`, the client targets `http://localhost:5000/api`.
   - If `VITE_API_MODE === 'mock'`, the client routes directly to the in-browser mock engine.
2. **Graceful Fallback:**
   - If configured for `bff` but `http://localhost:5000/api/health` fails to respond, the client automatically switches to the in-browser mock engine and triggers an informational toast: *"BFF offline — running in in-browser mock mode"*.
3. **Execution Commands:**
   - `pnpm dev`: Runs the frontend with in-browser mock (zero prerequisite setup).
   - `pnpm dev:full`: Runs both the Vite frontend and .NET 8 BFF concurrently via Turborepo.

---

## 4. Optimistic Mutation & Rollback Sequence

The following diagram illustrates the complete optimistic update lifecycle using the .NET 8 BFF with chaos injection:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Interface
    participant Hook as useCreateTodo (TanStack Query)
    participant Cache as Query Cache (todoKeys.byUser)
    participant Client as Dual-Mode ApiClient (packages/shared)
    participant BFF as ASP.NET Core BFF (services/bff)

    User->>Hook: submit(newTodo)
    activate Hook
    Note over Hook,Cache: onMutate Lifecycle Triggered
    Hook->>Cache: cancelQueries({ queryKey })
    Hook->>Cache: snapshot = getQueryData(queryKey)
    Hook->>Cache: setQueryData(queryKey, [...snapshot, optimisticItem])
    Cache-->>User: Instant UI Re-render (Item visible with 'Saving...' badge)
    Hook-->>User: Form reset & immediate focus return
    
    Hook->>Client: createTodo(input)
    activate Client
    Client->>BFF: POST /api/todos (Header: X-Simulate-Chaos if active)
    activate BFF
    
    Note over BFF: Middleware delays 300ms
    
    alt Normal Mode (200 OK)
        BFF-->>Client: 201 Created (confirmedTodo with permanent ID)
        Client-->>Hook: Return confirmedTodo
        deactivate BFF
        Note over Hook,Cache: onSettled
        Hook->>Cache: Invalidate & reconcile with server data
        Cache-->>User: UI updates badge to confirmed state
    else Chaos Mode Active (500 Error)
        BFF-->>Client: 500 Internal Server Error (Simulated Failure)
        deactivate BFF
        Client-->>Hook: Throw NetworkError
        deactivate Client
        Note over Hook,Cache: onError Lifecycle Triggered
        Hook->>Cache: setQueryData(queryKey, snapshot) [ROLLBACK]
        Cache-->>User: Optimistic item cleanly removed from DOM
        Hook-->>User: Trigger Toast/Alert ("Task creation failed. Reverted.")
    end
    
    deactivate Hook
```

---

## 5. Client State Architecture (Jotai)

Cross-cutting UI state is managed with **Jotai** atoms located in `packages/shared/src/state`:

```typescript
// Atom definitions
export const activeUserIdAtom = atom<string | null>(null);

// Derived atom: provides convenient active user state resolution
export const isUserSelectedAtom = atom((get) => get(activeUserIdAtom) !== null);

// Chaos Mode atom: controls whether frontend requests send X-Simulate-Chaos: true
export const chaosModeAtom = atom<boolean>(false);

// Global UI notification / toast atom
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
export const toastListAtom = atom<ToastMessage[]>([]);
```

---

## 6. Routing Architecture (TanStack Router)

Located in `apps/web/src/routes`:

### 6.1 Route Hierarchy
- `__root.tsx`: Top-level application layout. Renders navigation header, active user picker, chaos toggle, backend connection indicator, notification viewport, and `<Outlet />`.
- `index.tsx`: `/` (Dashboard overview with quick stats and recent users).
- `users/index.tsx`: `/users` (User creation form + user directory).
- `users/$id.tsx`: `/users/:id` (User detail profile view + embedded assigned tasks).
- `todos.tsx`: `/todos` (Master task management screen, user filter dropdown, and optimistic task creator).

---

## 7. Architectural Decisions & Trade-Offs

| Decision | Alternative Considered | Chosen Approach | Trade-off / Justification |
| :--- | :--- | :--- | :--- |
| **BFF Framework** | Node.js Express / NestJS | **ASP.NET Core (.NET 8) Minimal API** | Clean, fast, lightweight HTTP service with built-in dependency injection and Swagger, cleanly isolating backend logic. |
| **BFF Location** | `apps/bff` | **`services/bff`** | Clear conceptual distinction: `apps/` is reserved for shippable web client applications; `services/` contains backend services. |
| **Reviewer Resilience** | Require .NET SDK | **Dual-Mode Adapter with Auto-Fallback** | Evaluators without .NET installed can run `pnpm dev` immediately using the in-browser mock engine; evaluators with .NET can run full-stack `pnpm dev:full`. |
| **BFF Storage** | SQLite / EF Core | **In-Memory `ConcurrentDictionary`** | Eliminates database migration steps, file permission errors, and external database dependencies while remaining thread-safe. |
| **Monorepo Tooling** | Nx, Lerna | **Turborepo** | Minimal overhead, zero-config pipelines (`build`, `lint`, `dev`), perfectly matches take-home requirements. |
| **Server State** | Redux Toolkit | **TanStack Query v5** | Industry standard for asynchronous server state, built-in cancellation, standard `onMutate` rollback mechanics. |
| **Routing** | React Router v6 | **TanStack Router** | Full TypeScript param inference, search param validation via Zod, seamless integration with TanStack Query. |
| **Cross-Cutting State** | React Context API | **Jotai** | Avoids provider tree nesting and unnecessary subtree re-renders; provides surgical atomic reactivity. |
