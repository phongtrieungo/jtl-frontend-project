# Performance and Testing Reflection

## Performance

### Query caching

TanStack Query owns server state, so user and task data is reused across components without mirroring it into Jotai. The user list, user detail, and per-user task queries currently use a 30 second `staleTime` and a 300 second `gcTime`. Fresh data avoids an immediate refetch; inactive data remains available for five minutes before garbage collection. Mutations invalidate the relevant key so the next read reconciles with the API. The backend health badge polls every 15 seconds and uses a 10 second stale window. Backend selection is stable for a page session: automatic mode chooses once at startup, explicit BFF mode surfaces an outage instead of silently writing to a different mock dataset, and mock records are persisted in versioned browser `localStorage` so refresh reconciliation remains durable.

These values are deliberate starting points for a small interactive app, not measured production optima. A production deployment should tune freshness against data update frequency and network cost, and observe request volume and cache hit rates before changing them. The roadmap's earlier 60 second stale target has not been applied; current feature hooks use 30 seconds.

### UI state and render scope

Jotai is reserved for ephemeral cross-cutting state such as selected user, chaos mode, and toast notifications. Components subscribe to the atoms they need, which limits updates to relevant consumers and avoids rerendering the whole application for a toast or selection change. API records stay in the query cache, keeping one source of truth for server state.

### Routes and code loading

TanStack Router provides typed routes, validated search parameters, and intent-based preloading. The generated route tree currently imports route modules eagerly, so route-level code splitting is an optimization opportunity rather than a delivered performance feature. A next step is to move heavier route components behind TanStack Router's lazy route API, then compare production bundle and navigation timings before and after.

## Testing strategy

### Verified baseline (2026-09-28)

The current reproducible baseline is `pnpm test` with 75 JavaScript tests (33 in `packages/shared`, 31 in `packages/todos`, and 11 in `apps/web`), `pnpm test:e2e` with 2 Playwright flows, and `dotnet test services/bff.tests/Bff.Tests.csproj` with 24 integration tests. `packages/users` does not yet have a dedicated test suite; that parity work is Story 9.3 rather than a delivered capability.

The current root `pnpm lint` command runs `scripts/validate-boundaries.mjs` and strict workspace TypeScript checking. It does not yet run ESLint or a JSX accessibility plugin; that tooling gap is the explicit scope of Story 9.2. The production build passes, but the generated route tree still imports route modules eagerly, so route-level code splitting remains Story 9.4 work rather than a current performance claim.

The project uses a four-layer pyramid:

1. **Unit tests:** validate domain helpers, schemas, query keys, and mock engine behavior.
2. **Component and hook tests:** use Vitest, React Testing Library, and jsdom to verify accessible form behavior, mutation states, and cache effects.
3. **Service integration tests:** xUnit with `WebApplicationFactory<Program>` exercises the .NET endpoints, stores, chaos behavior, and health response over an in-process HTTP boundary.
4. **End-to-end checks:** Playwright exercises the composed app against the deterministic in-browser mock adapter. One flow selects a user, creates and reconciles a task, enables Chaos Mode, observes the optimistic “Saving...” state, and verifies removal plus retryable rollback feedback. A second regression flow bulk-completes tasks and verifies that mock-mode state survives a page reload. The BFF transport is covered separately by the xUnit integration suite.

### Optimistic rollback verification

Each task mutation's key behavior is verified in this order:

1. Seed the query cache with a known per-user task list and trigger the mutation.
2. Assert that the in-flight list query is cancelled and the cache immediately contains a temporary task marked optimistic.
3. Resolve the API promise and assert that settled invalidation is requested so server state can reconcile the cache.
4. In a separate case, reject the API promise (or enable chaos mode), then assert the cache exactly matches its original snapshot, the temporary row is gone, and a non-blocking error toast is emitted.
5. For create, repeat with an initially empty cache to confirm rollback removes the optimistic cache entry rather than leaving stale data. For delete, verify the exact original list order is restored.

The hook suites cover create, toggle, edit, and delete across immediate optimistic state, successful settlement/invalidation, exact snapshot rollback, and retryable error toasts. Discovery suites cover Zod URL normalization, deep-link restoration, the 300 ms debounce, labelled controls, and distinct empty states. The Playwright suite confirms rollback behavior and reload persistence in the composed experience, while BFF integration tests cover HTTP chaos behavior.
