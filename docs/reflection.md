# Performance and Testing Reflection

## Performance

### Query caching

TanStack Query owns server state, so user and task data is reused across components without mirroring it into Jotai. The application QueryClient defines the normal policy once: a 30 second `staleTime`, a 300 second `gcTime`, one retry, and no automatic window-focus refetch. User list, user detail, per-user task, and dashboard task queries intentionally inherit those defaults rather than repeating values in feature hooks. Fresh data avoids an immediate refetch; inactive data remains available for five minutes before garbage collection. Mutations invalidate the relevant key so the next read reconciles with the API.

The backend health query is the intentional exception: it polls every 15 seconds and uses a 10 second stale window because it describes connection availability rather than application records. Backend selection is stable for a page session: automatic mode chooses once at startup, explicit BFF mode surfaces an outage instead of silently writing to a different mock dataset, and mock records are persisted in versioned browser `localStorage` so refresh reconciliation remains durable.

These values are deliberate starting points for a small interactive app, not measured production optima. A production deployment should tune freshness against data update frequency and network cost, and observe request volume and cache hit rates before changing them. The roadmap's earlier 60 second stale target has not been applied; current feature hooks use 30 seconds.

### UI state and render scope

Jotai is reserved for ephemeral cross-cutting state such as selected user, chaos mode, and toast notifications. Components subscribe to the atoms they need, which limits updates to relevant consumers and avoids rerendering the whole application for a toast or selection change. API records stay in the query cache, keeping one source of truth for server state.

### Dashboard query fan-out

The dashboard composes one user-list query with one task query per distinct user. Reusing `todoKeys.byUser(userId)` is valuable at the current demo scale: the dashboard observes the exact cache entries that task screens and optimistic mutations update, so successful optimistic writes and exact rollback are reflected without copying server data or building a parallel aggregate cache.

This is also an N+1 request shape: after the user-list request, a directory of `N` users can issue `N` task requests when none are fresh. It is an explicit small-system trade-off, not a generally scalable dashboard design. The production trigger for replacing it with a server aggregate endpoint would be either more than 20 active users in a workspace or observed dashboard p95 request fan-out/latency exceeding the product budget. An aggregate response should then include summary totals and recent/attention projections while retaining per-user keys for task screens; its invalidation strategy would need to preserve the current optimistic-coherence behavior. Story 9.4 intentionally documents this threshold and does not add that endpoint.

### Routes and code loading

TanStack Router provides typed routes, validated search parameters, and intent-based preloading. Story 9.4 keeps the small route definitions eager and loads the dashboard, people list, profile, and task-board page components through `lazyRouteComponent`. Intent preloading can fetch a page chunk before navigation, while a delayed accessible skeleton prevents a brief network delay from flashing a blank application. The root route also owns accessible unexpected-error and not-found recovery experiences.

The following measurements are Vite 6.4.3 production build output from the same 2026-09-28 workspace immediately before and after Story 9.4. They are emitted artifact sizes, not runtime timing claims:

| Build output | Before | After |
| --- | ---: | ---: |
| Entry JavaScript | 429.94 kB / 130.71 kB gzip | 394.66 kB / 122.42 kB gzip |
| CSS | 26.90 kB / 5.27 kB gzip | 27.48 kB / 5.33 kB gzip |
| Total emitted JavaScript | 429.94 kB / 130.71 kB gzip | 437.31 kB / 138.32 kB gzip |

The initial entry is 35.28 kB (8.2%) smaller, or 8.29 kB (6.3%) smaller gzip. The after-build also emits dashboard (2.20 kB), people-list (11.16 kB), profile (2.87 kB), and task-board (6.51 kB) route chunks, plus shared async chunks from 0.40–15.05 kB. Total emitted JavaScript is 7.37 kB larger (7.61 kB gzip when summing individually compressed chunks), reflecting chunk wrappers and shared-module boundaries. A visitor does not necessarily download every chunk in one route visit, but no network or interaction improvement is claimed without field or browser timing data.

## Testing strategy

### Verified baseline (2026-09-28)

The current reproducible baseline is `pnpm test` with 93 JavaScript tests (33 in `packages/shared`, 31 in `packages/todos`, 15 in `packages/users`, and 14 in `apps/web`), `pnpm test:e2e` with 3 Playwright flows, and `dotnet test services/bff.tests/Bff.Tests.csproj` with 24 integration tests. The user feature now runs independently; the web suite includes explicit loading, unexpected-error, and not-found recovery coverage.

The current root `pnpm lint` command runs the standalone package-boundary validator, ESLint with zero warnings, strict workspace TypeScript checking, and the deterministic Prettier check. ESLint uses recommended TypeScript, React, and JSX accessibility rules, with the stable Rules of Hooks and exhaustive dependency checks promoted to errors. Package-specific import restrictions duplicate the most important architectural boundaries inside editor-visible static analysis while `scripts/validate-boundaries.mjs` remains the independent repository guardrail.

Prettier is the sole formatting authority; ESLint owns correctness rather than layout. To keep Story 9.2 mechanical changes reviewable, formatting is currently checked for `packages/users/src` and `eslint.config.mjs`, the areas normalized by that story. The production build passes and Story 9.4 now code-splits page components while preserving eager typed route definitions; the measured artifact trade-offs are recorded above.

The project uses a four-layer pyramid:

1. **Unit tests:** validate domain helpers, schemas, query keys, and mock engine behavior.
2. **Component and hook tests:** use Vitest, React Testing Library, and jsdom to verify accessible form behavior, mutation states, and cache effects.
3. **Service integration tests:** xUnit with `WebApplicationFactory<Program>` exercises the .NET endpoints, stores, chaos behavior, and health response over an in-process HTTP boundary.
4. **End-to-end checks:** Playwright exercises the composed app against the deterministic in-browser mock adapter. One flow selects a user, creates and reconciles a task, enables Chaos Mode, observes the optimistic “Saving...” state, and verifies removal plus retryable rollback feedback. A second regression flow bulk-completes tasks and verifies that mock-mode state survives a page reload. A third proves profile and filtered-task navigation stays within the SPA. The BFF transport is covered separately by the xUnit integration suite.

### Optimistic rollback verification

Each task mutation's key behavior is verified in this order:

1. Seed the query cache with a known per-user task list and trigger the mutation.
2. Assert that the in-flight list query is cancelled and the cache immediately contains a temporary task marked optimistic.
3. Resolve the API promise and assert that settled invalidation is requested so server state can reconcile the cache.
4. In a separate case, reject the API promise (or enable chaos mode), then assert the cache exactly matches its original snapshot, the temporary row is gone, and a non-blocking error toast is emitted.
5. For create, repeat with an initially empty cache to confirm rollback removes the optimistic cache entry rather than leaving stale data. For delete, verify the exact original list order is restored.

The hook suites cover create, toggle, edit, and delete across immediate optimistic state, successful settlement/invalidation, exact snapshot rollback, and retryable error toasts. Discovery suites cover Zod URL normalization, deep-link restoration, the 300 ms debounce, labelled controls, and distinct empty states. The Playwright suite confirms rollback behavior and reload persistence in the composed experience, while BFF integration tests cover HTTP chaos behavior.
