# Taskwell — React Architecture Take-Home

Taskwell is a small user-and-task application built to make senior React engineering decisions easy to inspect. The core thesis is simple: TanStack Query owns server state, TanStack Router owns validated URL state, Jotai owns only small cross-cutting UI preferences, feature packages stay independent, and the app shell composes them.

## Five-minute evaluator path

### 1. Launch

Prerequisites are Node.js 18+ and pnpm 9+. The default path needs no .NET runtime.

```bash
pnpm install
pnpm dev
```

Open the Vite URL (normally `http://localhost:5173`). The shared API adapter automatically uses the in-browser mock engine when the optional BFF is unavailable.

### 2. See a successful optimistic write

1. Open **Tasks**.
2. Choose an assignee.
3. Create a task.
4. Notice that the row appears immediately with **Saving...**, then reconciles to the server-assigned record.

### 3. See rollback under failure

1. Turn **Chaos off** to **Chaos on** in the header.
2. Create another task.
3. Notice the temporary row appear, disappear when the request fails, and produce a retryable error toast explaining that the change was reverted.

### 4. Inspect the evidence

```bash
# Focused optimistic, overlap, rollback, and recovery tests
pnpm --filter @todo/todos test

# Static analysis, strict types, boundaries, and formatting
pnpm lint

# All JavaScript tests and the composed browser flows
pnpm test
pnpm test:e2e
```

The most direct implementation and regression evidence is in:

- `packages/todos/src/hooks/useCreateTodo.ts`
- `packages/todos/src/hooks/useTodoLifecycle.test.tsx`
- `packages/todos/src/hooks/useCreateTodo.test.tsx`
- `packages/todos/src/hooks/useBulkTodoActions.test.tsx`
- `e2e/task-resilience.spec.ts`

## Architecture thesis

```text
                         apps/web
                 routes + composition shell
                    /              \
          packages/users      packages/todos
                    \              /
                    packages/shared
          types, query keys, API adapter, UI, atoms
                    /              \
             optional BFF       browser mock
```

- `packages/users` and `packages/todos` never import each other. `apps/web` owns cross-feature composition and typed navigation.
- TanStack Query is the sole owner of users and tasks. Jotai holds only active-user, Chaos Mode, toast, and display-preference state.
- Task mutations cancel relevant fetches, snapshot the affected cache, update immediately, roll back only their own operation on failure, and reconcile after settlement. When operations overlap on one user list, the final settlement coalesces invalidation so an intermediate refetch cannot erase a still-pending optimistic record.
- Independent task mutations may overlap without an earlier failure erasing a later confirmed change. Conflicting controls for the same optimistic task are unavailable until it settles.
- Search, filter, sort, and assignee state live in Zod-validated URL search parameters, making task views linkable and restorable.
- Accessible labels, inline validation, visible focus, textual status, live regions, retry actions, and route recovery are part of the component contracts.
- The typed API adapter chooses one backend for the page session. It never silently switches data stores after work begins.

See [docs/architecture.md](docs/architecture.md) for the full topology and [docs/reflection.md](docs/reflection.md) for measured loading and testing trade-offs.

## Verification baseline

The Story 9.5 baseline is:

- 96 JavaScript tests: 33 shared, 34 todos, 15 users, and 14 web;
- 3 Playwright flows for rollback, refresh persistence, and SPA navigation;
- 24 xUnit BFF integration tests;
- zero-warning ESLint, strict TypeScript, package-boundary validation, formatting checks, and production build.

Run the complete gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
dotnet test services/bff.tests/Bff.Tests.csproj
```

The final command requires .NET 10; all frontend behavior remains reviewable without it.

## Known trade-offs

- The dashboard intentionally reuses one task query per user so optimistic cache changes appear everywhere. This creates an N+1 request shape; more than 20 active users or a measured p95 budget breach is the trigger for an aggregate endpoint.
- Restoring a bulk-deleted task recreates it through the API. It receives a new server ID, so the UI calls this **Restore**, not identity-preserving undo. Bulk completion is genuinely undoable because the existing task identity is retained.
- Different task records can mutate concurrently. Controls for one optimistic record are locked, so conflicting same-record writes are not supported or queued.
- Route components are lazy-loaded and the initial entry is smaller, but total emitted JavaScript is slightly larger. The measured sizes are recorded without claiming an unmeasured runtime speedup.
- The BFF uses in-memory stores and simulated latency/chaos. Authentication, durable production storage, multi-client conflict resolution, and an aggregate dashboard endpoint are intentionally outside this take-home.

## Running modes

```bash
# Automatic BFF health check with stable mock fallback
pnpm dev

# Start .NET 10 first, then Vite in fixed BFF mode
pnpm dev:full
```

For separate full-stack terminals:

```bash
dotnet run --project services/bff/bff.csproj -- --urls http://localhost:5000
VITE_API_MODE=bff pnpm dev:web
```

The BFF exposes `/api/health` and Development Swagger UI at `/swagger`. The browser mock persists its versioned data in `localStorage`; explicit BFF mode surfaces outages instead of redirecting failed writes to mock data.

## Repository map

| Path | Responsibility |
| --- | --- |
| `apps/web` | TanStack Router shell, lazy pages, cross-feature composition, dashboard, and route recovery |
| `packages/shared` | Domain contracts, query keys, dual-mode API client, mock engine, atoms, and accessible UI primitives |
| `packages/users` | Independent user queries, creation, directory, detail UI, and package tests |
| `packages/todos` | Task discovery, optimistic lifecycle mutations, bulk actions, drafts, insights, and package tests |
| `services/bff` | Optional ASP.NET Core .NET 10 Minimal API and thread-safe in-memory stores |
| `e2e` | Composed Playwright user flows |

## Documentation

- [Product requirements](docs/prd.md)
- [Architecture](docs/architecture.md)
- [Sprint plan](docs/sprint-planning.md)
- [Performance and testing reflection](docs/reflection.md)
- [AI engineering journey](ai-journey/master-journey.md)

## Delivery status

Sprints 0–8 and Stories 9.1–9.5 are complete. Sprint 9 froze product scope after repository cleanup, real linting, user-feature parity, deliberate runtime boundaries, measured bundle evidence, concurrency-safe mutation rollback, and the evaluator handoff above.
