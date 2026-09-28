# AI Journey & Co-Pilot Engineering Log

This document records how AI was utilized to architect, plan, and build this solution. It details the initial prompt, planning decomposition, custom skills established, tools and models leveraged, and specific architectural decisions and overrides made by the engineer.

---

## 1. System Setup & Tooling Context

- **AI Model:** Gemini 3.8 Flash (High) / Antigravity Agentic Platform
- **Methodology:** Contract-first planning, strict modular boundaries, and agent self-steering via localized skills.
- **Custom Skills Created:**
  - `frontend-coding` (TypeScript, React, Turborepo boundaries, TanStack Query/Router, Jotai, Zod)
  - `frontend-design` (Tailwind tokens, optimistic UX states, WCAG 2.1 AA a11y)
  - `frontend-testing` (Testing pyramid, RTL recipes, optimistic update rollback verification)
  - `backend-dotnet` (ASP.NET Core .NET 8 Minimal API, thread-safe stores, latency/chaos middleware)

---

## 2. Interaction Log: Phase 0 — PRD, Architecture & Planning

### 2.1 Prompt & Intent
- **User Prompt:** Provide a PRD, Architecture Specification, Coding Skill, Design Skill, Testing Skill, and a Sprint Development Plan with detailed descriptions, user stories, and acceptance criteria.
- **Engineer Objective:** Establish a rock-solid, enterprise-grade foundation so that all future agent interactions adhere to the same architectural vision and sprint milestones.

### 2.2 Key Decisions & Output Shaping
1. **Monorepo Package Isolation:**
   - *AI Consideration:* Many standard boilerplates bundle features together or allow loose relative imports.
   - *Human/Engineer Direction:* Enforced zero sideways imports between `packages/users` and `packages/todos`. All cross-cutting types and primitives must route through `packages/shared`.
2. **Optimistic Update with Verifiable Rollback:**
   - *AI Consideration:* Often optimistic updates are implemented without an easy way for evaluators to trigger the error path.
   - *Human/Engineer Direction:* Designed an explicit in-memory chaos engine with a UI toggle (`ChaosMode`), allowing evaluators to simulate network failure on demand and see deterministic rollback in real-time.
3. **Cross-Cutting State Scoping:**
   - *AI Consideration:* Avoid treating Jotai as a Redux replacement.
   - *Human/Engineer Direction:* Scoped Jotai exclusively to ephemeral UI state (`activeUserIdAtom`, `isChaosModeAtom`, `toastsAtom`), keeping server data strictly in TanStack Query cache.
4. **Agent Persistent Memory:**
   - Embedded `AGENTS.md` and `GEMINI.md` at repository root so that future prompts automatically inherit the full system context, rules, and sprint plan without context drift.
5. **GitHub Remote Connection & Initial Baseline:**
   - Initialized Git tracking, connected to `https://github.com/phongtrieungo/jtl-frontend-project.git`, configured `.gitignore`, and pushed the foundational specifications and skills directly to `origin/main`.
6. **Architectural Alignment (.NET 8 BFF & Dual-Mode Resilience):**
   - *User Decisions:*
     - Selected **.NET 8** (LTS) for the backend service.
     - Confirmed the **Dual-Mode Adapter** architecture: frontend connects to .NET 8 BFF when available, but automatically falls back to the in-browser mock engine if the backend service is absent or uninstalled by the reviewer.
     - Placed the service in `services/bff` to clearly distinguish standalone backend services from shippable web apps (`apps/web`).
     - Selected **Slate + Indigo** palette for clean SaaS visual hierarchy.

---

---

## 3. Interaction Log: Phase 1 — Sprint 1 (Monorepo & Tooling Setup)

### 3.1 Prompt & Intent
- **User Prompt:** "Proceed sprint 01 with a feature branch so that I can review each PR to have a best understand of code change"
- **Engineer Objective:** Scaffold the Turborepo monorepo with strict package boundaries, project references, build pipelines, Vite web shell, and .NET 8 BFF skeleton on branch `feature/sprint-01-monorepo-foundation`.

### 3.2 Implemented Components
1. **Workspace Configuration:** `pnpm-workspace.yaml` configuring `apps/*`, `packages/*`, and `services/*`, with `onlyBuiltDependencies` for `esbuild`.
2. **Turborepo Pipeline:** `turbo.json` with topological `build`, persistent `dev`, `typecheck`, `lint`, and `clean` tasks.
3. **TypeScript Architecture:** `tsconfig.base.json` with strict compilation options and Project References (`composite: true`) in all packages (`shared`, `users`, `todos`, `web`).
4. **Package Isolation Verified:** `@todo/users` and `@todo/todos` depend exclusively on `@todo/shared` with zero cross-feature imports.
5. **Web Application Shell:** `apps/web` initialized with React 18, Vite, TailwindCSS (Slate + Indigo tokens), PostCSS, and base styling.
6. **Backend Service Skeleton:** `services/bff` initialized targeting .NET 8 Minimal API with CORS, Swagger OpenAPI documentation, and health check endpoint (`/api/health`).

---

---

## 4. Interaction Log: Phase 2 — Sprint 2 (Core Domain, Dual-Mode Adapter & Shared UI Kit)

### 4.1 Prompt & Intent
- **User Prompt:** "start sprint 2"
- **Engineer Objective:** Deliver all core foundational contracts, the resilient Dual-Mode API adapter (BFF HTTP client + offline in-browser Mock DB with latency/chaos simulation), accessible UI kit components following Slate + Indigo tokens, cross-cutting Jotai atoms, and full test suite on branch `feature/sprint-02-shared-core`.

### 4.2 Implemented Components & Stories
1. **Story 2.1: Domain Type Contracts & Query Key Factories (`STORY-201`):**
   - Declared immutable `User`, `UserSummary`, `CreateUserInput`, `Todo`, `TodoSummary`, `CreateTodoInput`, `UpdateTodoInput`, and `ApiHealthStatus` in `packages/shared/src/types/domain.ts`.
   - Built const tuple query key factories (`userKeys`, `todoKeys`) in `packages/shared/src/api/queryKeys.ts`, verifying `todoKeys.byUser('123')` returns `['todos', 'list', { userId: '123' }]` as a const tuple.
2. **Story 2.2: Dual-Mode API Client & In-Browser Mock Engine (`STORY-202`):**
   - Implemented `MockDb` with pre-seeded demo users (Ada Lovelace, Alan Turing, Margaret Hamilton), tasks, dynamic task count calculation, 200–400ms latency emulation, and chaos error simulation on demand.
   - Implemented `HttpBffClient` handling HTTP communication with ASP.NET Core .NET 8 Minimal API, including `X-Simulate-Chaos: true` request header injection.
   - Implemented `DualModeApiClient` implementing the `ApiClient` contract with auto-detection, explicit mode selection (`bff` vs `mock`), and automatic fallback to mock DB upon network disconnection.
3. **Story 2.3: Shared UI Primitives & Accessible Feedback Components (`STORY-203`):**
   - Implemented `Button` (polymorphic variants, sizes, visible focus rings, inline `Spinner` with `aria-busy`).
   - Implemented `Input` complying with strict WCAG 2.1 AA form accessibility contract (`htmlFor`/`id`, `aria-invalid`, `aria-describedby` linked to `role="alert"` error element).
   - Implemented `Card` (composable header, title, description, content, footer).
   - Implemented `Badge` (color ramp variants + optimistic `pulse` indicator).
   - Implemented `Alert` (`role="alert"` for errors/warnings, `role="status"` for info/success, dismiss action).
   - Implemented `Spinner` (accessible SVG with `role="status"` and `sr-only` label).
   - Implemented `ToastViewport` (accessible notification center live region).
4. **Story 2.4: Cross-Cutting Jotai Atoms (`STORY-204`):**
   - `activeUserIdAtom` & derived `isUserSelectedAtom`.
   - `isChaosActiveAtom` & alias `chaosModeAtom`.
   - `toastsAtom` & `useToast` hook with auto-dismissal after 4 seconds.
5. **Testing & Verification:**
   - Configured Vitest + `@testing-library/react` + `jsdom`.
   - Added 5 test suites with 29 unit tests covering domain query keys, mock DB operations, dual-mode fallback, Jotai state derivations, and UI accessibility contracts. All 29 tests pass with zero warnings.

---

## 5. Interaction Log: Phase 3 — Sprint 3 (.NET BFF Service)

### 5.1 Prompt & Intent
- **User Prompt:** "Continue"
- **Engineer Objective:** Implement the full `services/bff` ASP.NET Core .NET 10 Minimal API, covering all CRUD endpoints, chaos/latency middleware, and an integration test suite using `WebApplicationFactory<Program>`.

### 5.2 Implemented Components & Stories
1. **Models:** `UserDto`, `TodoDto`, `Requests.cs` (CreateUser, CreateTodo, UpdateTodo, SetChaos).
2. **Services:**
   - `IChaosService` + `ChaosService` — thread-safe volatile bool for chaos toggle.
   - `ITodoStore` + `InMemoryTodoStore` — `ConcurrentDictionary`-backed store seeded with 6 demo todos matching the mock DB.
   - `IUserStore` + `InMemoryUserStore` — `ConcurrentDictionary`-backed store seeded with 3 demo users; live task counts computed via `ITodoStore`.
3. **Middleware:** `ChaosAndLatencyMiddleware` — 200–400ms artificial latency (skippable via `X-Skip-Latency: true` header for tests), chaos 500 injection on POST/PUT/PATCH/DELETE when `X-Simulate-Chaos: true` or global chaos flag active.
4. **Endpoints:**
   - `UserEndpoints` — `GET /api/users`, `GET /api/users/{id}`, `POST /api/users`.
   - `TodoEndpoints` — `GET /api/todos` (with `?userId=`), `GET /api/todos/{id}`, `POST /api/todos`, `PUT /api/todos/{id}/toggle`, `PUT /api/todos/{id}`, `DELETE /api/todos/{id}`.
   - `ChaosEndpoints` — `GET /api/chaos`, `POST /api/chaos/toggle`, `POST /api/chaos`.
5. **Program.cs** — Full DI wiring (singletons), CORS for Vite origins, Swagger/OpenAPI, middleware pipeline.
6. **Integration Tests (`services/bff.tests/`):**
   - `WebApplicationFactory<Program>` with `X-Skip-Latency: true` to bypass artificial delay.
   - 24 integration tests: User CRUD, Todo CRUD + toggle + delete, Chaos header injection, chaos toggle round-trip, health check payload verification.
   - **All 24 tests pass.**
7. **Runtime Adaptation:** Detected machine has .NET 10 (not .NET 8); both projects updated to `net10.0` with matching `Microsoft.AspNetCore.Mvc.Testing 10.0.0`.

---

## 6. Sprint Execution Tracking Log

| Sprint | Story / Topic | Key AI Prompts / Tools | Output Evaluation & Overrides | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Sprint 0** | PRD, Architecture, Skills & Sprint Plan | `write_to_file`, Markdown generation | Integrated .NET 8 BFF, dual-mode fallback, and Slate + Indigo theme. | **Done** |
| **Sprint 1** | Monorepo & Tooling Setup | `write_to_file`, `run_command`, `replace_file_content` | Feature branch `feature/sprint-01-monorepo-foundation`. Turborepo + pnpm workspace + .NET BFF skeleton verified. | **Done** |
| **Sprint 2** | Shared Core & Dual-Mode Client | `write_to_file`, `run_command`, `replace_file_content` | Feature branch `feature/sprint-02-shared-core`. Domain types, query keys, dual-mode client + mock DB, UI kit, Jotai atoms, 29 passing tests. | **Done** |
| **Sprint 3** | .NET BFF Service (`services/bff`) | `write_to_file`, `run_command`, `replace_file_content` | Feature branch `feature/sprint-03-bff-service`. Full CRUD endpoints, chaos+latency middleware, 24 passing integration tests. Adapted to net10.0 (machine has .NET 10, not .NET 8). | **Done** |
| **Sprint 4** | User Feature Module (`packages/users`) | User request: “start sprint 04”; implementation and acceptance verification | STORY-401 and STORY-402 were delivered. The delivery log recorded tests that are absent from the current tree after the Sprint 6 restoration; Story 9.3 owns restoring package-level coverage. | **Done** |
| **Sprint 5** | ToDo Feature Module (`packages/todos`) | User requests: “Start sprint 05”; “Write the unit test and update the README with current state of the project” | STORY-501 and STORY-502 implemented; schema/mutation tests, package typecheck/build, and diff check pass. README reflects completed Sprints 0–5 and the pending web composition work. | **Done** |
| **Sprint 6** | Shippable Web App Shell (`apps/web`) | User request: “Start sprint 06”; implementation and verification recorded below | Responsive routed app shell, feature composition, and web typecheck/build completed. | **Done** |
| **Sprint 7** | Reflections, AI Journey & README | User request: “start the final sprint”; documentation review and full-stack launcher implementation | README corrected, `docs/reflection.md` added, `pnpm dev:full` implemented, and this journey updated. | **Done** |
| **Sprint 8** | React Showcase — Resilient Task Lifecycle & Discovery | User requests through “Start the story 8.6”; frontend coding, design, and testing guidance | Stories 8.1–8.6 complete: lifecycle mutations, URL discovery, query-derived insights, deterministic verification, accessible bulk actions, durable mock state, task drafts, and display preferences. | **Done** |

### Sprint 08 — Story 8.2: Shareable Task Discovery (2026-09-27)

- **Prompt:** “Start user story 8.2”
- **Action:** Added validated `/todos` URL state for assignee, status, query, and sort; a keyboard-accessible filter panel; and a 300ms debounced title search. The task list now derives its displayed items with pure filtering/sorting utilities from the existing TanStack Query cache and announces the visible result count.
- **Resilience & accessibility:** Deep links restore their valid state without a server write. Empty states distinguish a user with no tasks from a filtered view with no matches; the latter offers a clear-filter action. Controls are explicitly labelled and inherit visible keyboard focus treatment.
- **Architecture:** URL state remains exclusively in TanStack Router, task records remain exclusively in TanStack Query, and no Jotai state or cross-feature dependency was added.

## Developer Override — .NET 10 Standard (2026-09-24)

The original planning entries above record the initial .NET 8 choice. The developer has since confirmed that this repository will use .NET 10. Current implementation and specifications target `net10.0`, including ASP.NET Core OpenAPI and `Microsoft.AspNetCore.Mvc.Testing` 10.0.0. Current setup and architecture guidance use .NET 10; the earlier .NET 8 entries are retained as historical planning context.

### README Update — Sprint 03 Delivery

Updated the root README to mark Sprint 03 complete, document the implemented BFF endpoints and chaos/latency behavior, provide the standalone .NET 10 run and test commands, and distinguish the implemented backend/shared client from frontend work planned for Sprints 4–6.

### Sprint 04 — User Feature Package (2026-09-25)

- **Prompt:** “start sprint 04”
- **Action:** Implemented `createUserSchema`; TanStack Query hooks for listing, loading, and creating users; and accessible create form, directory, and profile components in `packages/users`. The create hook invalidates the user list after success, and all package functionality is exported through the package root.
- **Architecture:** The feature depends only on `@todo/shared` and package dependencies; it introduces no users-to-todos dependency. Form input is Zod-validated before the mutation runs, with inline associated errors and toast feedback.
- **Historical verification record:** This delivery originally recorded `pnpm --filter @todo/users test` (7 tests), typecheck, and build as passing. Those user-package tests and the test script are not present in the current tree after the Sprint 6 package restoration; the reproducible Story 9.1 baseline therefore excludes them, and Story 9.3 owns restoring dedicated coverage.

### Sprint 05 — ToDo Feature Package & Optimistic Mutation (2026-09-25)

- **Prompt:** “Start sprint 05”
- **Action:** Implemented the Zod create-task schema, per-user TanStack Query hook, and `useCreateTodo` with query cancellation, cache snapshot, temporary optimistic record, exact rollback on failure, error toast, chaos-mode forwarding, and settled invalidation. Added the task creation form, task list with loading/error/empty states, row with amber “Saving...” status and subdued opacity, and package-root exports.
- **Architecture:** `packages/todos` imports only from `@todo/shared` and its declared external dependencies; no import from `packages/users` was introduced. Form fields use the shared accessible `Input` and `Button` primitives.
- **Follow-up:** Added package Vitest configuration and a `test` script. Schema tests cover trimming, title length, and required assignee; mutation tests cover immediate optimistic insertion, settled invalidation, exact rollback with an error toast, and removal when there was no prior cache.
- **Documentation:** Updated README package status, current sprint status, testing instructions, and roadmap. Clarified that `apps/web` remains a placeholder and feature package composition is Sprint 6 work.
- **Verification:** `pnpm --filter @todo/todos typecheck`, `pnpm --filter @todo/todos build`, `pnpm --filter @todo/todos test` (6 tests), and `git diff --check` pass.

### Sprint 06 — Shippable Web App Shell & TanStack Router (2026-09-25)

- **Prompt:** “Start sprint 06”
- **Action:** Replaced the Vite placeholder with the app shell, responsive navigation, dashboard, people directory/profile routes, and task board route. Added the React Query and Jotai providers, validated `/todos` search using Zod, active-user selection, chaos-mode control, backend/mock status, accessible skip link, and toast viewport.
- **Composition repair:** The repository’s `packages/users` implementation was only a placeholder despite Sprint 04 being recorded as complete. Restored the package’s public user hooks, Zod schema, accessible create form, directory, and profile components so `apps/web` can compose the intended feature APIs without importing internal files or adding cross-feature package dependencies.
- **Runtime configuration:** Applied `VITE_API_MODE` in the Vite entrypoint so `mock`, `bff`, and `auto` choices reach the shared API client.
- **Verification:** Initial checks exposed an invalid pnpm v11 workspace permission value (`allowBuilds.esbuild` contained an unresolved placeholder). Replaced it with `true`, restored dependencies from the package store, and confirmed `pnpm --filter @todo/web typecheck` and `pnpm --filter @todo/web build` pass. Started Vite and confirmed `GET /` returns the app HTML. `git diff --check` passes. No tests were run.

### Sprint 07 — Production Reflections, AI Journey & README (2026-09-25)

- **Prompt:** “start the final sprint”
- **Plan:** Reviewed the final sprint stories and current README, package scripts, route loading, query options, and existing interaction log before editing. The task was documentation and local development handover; no feature coding skill applied. The session ran in Codex (GPT-6); no model-switch decision was made for this sprint.
- **Story 7.1:** Updated the README to explain package boundaries, mock fallback, BFF placement, and the actual mock/full-stack startup commands. Corrected stale placeholder and sprint-status statements.
- **Startup improvement:** Added `pnpm dev:full` via `scripts/dev-full.mjs` to start the .NET BFF and Vite app together and stop both processes when one exits.
- **Story 7.2:** Added `docs/reflection.md` covering query cache freshness/retention, Jotai render scope, route loading, the four testing layers, and an ordered optimistic rollback verification flow. Explicitly recorded that feature queries currently use 30s `staleTime` (rather than the roadmap's 60s target), and route modules are currently eager, so code splitting is a follow-up opportunity.
- **Story 7.3:** Updated this log with the prompt, planning approach, implementation decisions, and verification boundary. No developer override was needed.
- **Verification:** `node --check scripts/dev-full.mjs` and `git diff --check` pass. No test suite was run. The full-stack launcher was not started in this turn, so its runtime behavior still needs a local .NET 10 run.

### Sprint 08 — React Showcase Planning (2026-09-27)

- **Prompt:** “Ok, before moving forwards, update the plan for these and I will review them”.
- **Action:** Added Sprint 8 to the engineering roadmap as one reviewable, time-boxed showcase sprint. Core scope is optimistic task completion, editing, and deletion; Zod-validated URL-synced task discovery; query-derived dashboard insights; and deterministic feature/browser verification. Bulk actions with undo and draft/theme/density personalization are deliberately marked stretch to protect core quality.
- **Architecture and UX constraints:** Preserved package ownership (`packages/todos` for task behavior, `apps/web` for composition), the no-sideways-import rule, TanStack Router ownership of shareable filters, Jotai only for ephemeral UI state, and full optimistic rollback with visible saving, disabled conflicting controls, inline validation, focus treatment, and accessible failure feedback.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` informed the plan’s boundary, accessibility, and verification acceptance criteria.
- **Developer override:** The developer chose one sprint instead of several. The plan accommodates that decision by separating core delivery from explicitly non-blocking stretch stories; no implementation began in this planning step.
- **README update:** Added the planned Sprint 8 scope and changed the roadmap to eight sprints. Removed personal React and Angular study-guide links from the project documentation index; the underlying study-guide files were intentionally left untouched.

### Sprint 08 — Story 8.1: Optimistic Task Lifecycle (2026-09-27)

- **Prompt:** “Start sprint 08”.
- **Action:** Started core implementation with typed shared API write options so Chaos Mode reaches mock and BFF toggle, update, and delete requests. Added isolated `useToggleTodo`, `useUpdateTodo`, and `useDeleteTodo` hooks, each canceling queries, snapshotting the owning per-user cache, updating optimistically, restoring the exact snapshot on failure, and invalidating after settlement. The existing create mutation now has the same retryable rollback feedback.
- **UI and accessibility:** Extended task rows with accessible status controls, a Zod-validated inline title editor, explicit inline delete confirmation, disabled conflicting controls while saving, and a programmatic “Saving…” state. Toasts now support a keyboard-accessible retry action for reverted writes.
- **Verification:** Added lifecycle hook tests for immediate toggle/update/delete effects, settled invalidation, exact rollback including original delete position, and retryable error toasts. `pnpm --filter @todo/todos test` (9 tests), `build`, `pnpm --filter @todo/shared test` (29 tests), `typecheck`, and `git diff --check` pass.
- **Status:** Story 8.1 is implemented; Sprint 8 remains in progress pending Stories 8.2–8.4. Existing untracked study-guide documents were preserved.

### Sprint 08 — Story 8.3: Task Insights Dashboard (2026-09-27)

- **Prompt:** “Start story 8.3”.
- **Action:** Completed the existing dashboard draft with task-only derived insight utilities, a `useTaskInsights` query composition hook, and an application-owned dashboard presentation. The dashboard now shows total, active, completed, and completion-rate metrics; the five most recent tasks; and up to five users ranked by active workload.
- **Architecture:** Insights observe the existing per-user `todoKeys.byUser` query caches, so optimistic creation, completion, rename, deletion, and rollback flow directly into the dashboard without Jotai or another server-data store. `packages/todos` owns task derivation and fetching; `apps/web` joins user names and owns cross-feature route composition. No sideways feature import was added.
- **UX and accessibility:** Added typed drill-down links to filtered task views and user profiles, stable metric/list skeletons, explicit unavailable and empty states, retry behavior, `aria-busy` regions, a saving announcement for optimistic data, and text labels for active/completed status.
- **Testing:** Added pure derivation tests, a hook test that exercises live cache updates and restoration, and dashboard component tests for typed links plus loading, error, retry, and empty states. The web test setup explicitly installs the Vitest DOM matchers and stubs router scrolling under JSDOM.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided package ownership, query-cache derivation, semantic status treatment, and the unit/component/integration coverage split.
- **Developer override:** None. Existing unrelated study-guide files were left untouched.

### Sprint 08 — Story 8.4: Showcase Verification (2026-09-27)

- **Prompt:** “Start story 8.4”.
- **Action:** Completed the core showcase verification layer. Expanded mutation hook coverage so create, toggle, edit, and delete each prove immediate optimistic cache state, successful settled reconciliation, and exact snapshot restoration with retryable toast feedback on failure. Added task-discovery tests for Zod URL normalization and deep-link restoration, the 300 ms search debounce, labelled controls, result empty states, and clear-filter behavior.
- **Browser verification:** Selected Playwright for the composed end-to-end layer and pinned the suite to the in-browser mock adapter so it remains independent of the optional BFF. The scenario selects Ada Lovelace, creates and reconciles a task, enables Chaos Mode, observes the optimistic “Saving...” state, and verifies that failure removes the temporary row while exposing a `role="alert"` message and keyboard-accessible retry action.
- **Quality tooling:** Replaced the root placeholder lint path with strict workspace typechecking plus `scripts/validate-boundaries.mjs`, which rejects users/todos sideways imports, shared-to-feature dependencies, workspace deep imports, and relative package crossings. Playwright output directories are ignored; browser installation and execution commands are documented in the README.
- **Verification:** `pnpm lint`, `pnpm build`, and `pnpm test` pass (59 JavaScript tests: shared 29, todos 22, web 8); `pnpm test:e2e` passes (1 Chromium flow); and `dotnet test services/bff.tests/Bff.Tests.csproj` passes (24 integration tests). `git diff --check` is clean.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` shaped package ownership, accessible assertions, mutation lifecycle coverage, and the four-layer verification split.
- **Developer override:** None. Existing untracked study-guide documents were preserved. Core Sprint 8 is complete; Stories 8.5–8.6 remain optional deferred stretch work.

### Sprint 08 — Story 8.5: Bulk Actions with Undo (2026-09-27)

- **Prompt:** “Start story 8.5”.
- **Action:** Added local task selection and select-visible controls to `TodoList`, explicit bulk-delete confirmation, and a dedicated `useBulkTodoActions` orchestration hook. Bulk completion and deletion optimistically update the owning per-user query cache while tracking each selected task independently.
- **Resilience:** Each failed item restores only its own cached snapshot and original surviving-list position; successful siblings remain committed. A successful or partially successful action exposes an 8-second, keyboard-focusable Undo toast. Completion undo restores prior completion values, while deletion undo recreates removed tasks through the shared API adapter before canonical query reconciliation.
- **Architecture and accessibility:** Selection remains local component state because prop composition is sufficient; no Jotai atom or server-data duplication was added. Optimistic items cannot be selected, per-row progress is conveyed with text and `aria-busy`, selection counts use a polite live region, controls have visible focus treatment, and destructive bulk actions require confirmation.
- **Testing:** Added hook integration coverage for immediate per-item progress, isolated partial rollback, preserved delete ordering, time-bounded completion undo, delete recreation, and a focusable Undo control. Component coverage verifies labelled multi-selection, per-task live progress announcements, and bulk-delete confirmation.
- **Verification:** `pnpm --filter @todo/todos test` passed with 28 tests at delivery; the then-current full JavaScript suite passed with 65 tests, along with `pnpm lint`, `pnpm build`, the existing Playwright flow, and `git diff --check`.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided query-cache ownership, interaction states, accessibility, and deterministic partial-failure tests. No developer override was needed; unrelated untracked study-guide documents were preserved.

### Sprint 08 — Story 8.5 Regression: Durable Mock State & Stable BFF Mode (2026-09-27)

- **Prompt:** The developer reported that bulk-completed tasks reverted after refresh, `pnpm dev:full` sometimes appeared in mock mode and sometimes BFF mode, and mock users/tasks needed browser persistence.
- **Root cause:** `dev:full` launched Vite concurrently with the compiling BFF. Early queries could hit a connection error and switch the shared client to a fresh mock store; the health poll could later switch back to the seeded BFF, creating a split-brain cache. The mock engine itself was memory-only, so a true mock-mode refresh also reseeded it.
- **Fix:** The dual-mode client now performs one deduplicated auto-mode health decision per page session and never redirects later BFF failures into a different store. Explicit BFF mode remains BFF and exposes an unavailable state. The full-stack launcher waits for Kestrel’s listening signal, then starts Vite with fixed `VITE_API_MODE=bff` and an explicit loopback BFF URL.
- **Mock persistence:** Added defensive, versioned `localStorage` hydration and persistence for mock users and tasks. Every successful create, toggle, update, and delete persists; invalid stored data falls back to the seed safely.
- **Testing and verification:** Added adapter tests for stable auto/BFF selection, mock hydration and corruption recovery tests, and a Playwright regression that bulk-completes tasks and confirms they remain complete after `page.reload()`. At delivery, `pnpm lint`, `pnpm test` (69 JavaScript tests), `pnpm build`, `pnpm test:e2e` (2 tests), and the 24 BFF integration tests passed. A live `pnpm dev:full` run confirmed the BFF listening gate, fixed BFF mode, and rendered “BFF connected” status before shutdown.
- **Skills used:** `frontend-coding`, `frontend-testing`, and `backend-dotnet` guided state ownership, regression coverage, and full-stack readiness behavior. No developer override was needed; unrelated untracked study-guide documents were preserved.

### Sprint 08 — Story 8.6: Resilience and Personalization Polish (2026-09-27)

- **Prompt:** “Start the story 8.6”.
- **Action:** Added schema-gated, per-user task draft persistence in `packages/todos`. Valid unfinished titles restore from local storage after refresh without invoking a mutation; invalid, malformed, submitted, and cleared drafts are not restored.
- **Personalization:** Added persisted Jotai atoms for light/dark/system theme and compact/comfortable density, plus labelled header controls. The app resolves system theme through `prefers-color-scheme`, reacts to operating-system theme changes, applies document-level theme/density attributes, and provides dark-mode surface, text, control, and focus treatments.
- **Architecture:** Drafts remain local form state rather than server cache. Display preferences are minimal cross-cutting UI state in `packages/shared`; no task records or URL filters moved into Jotai, and no sideways package dependency was introduced.
- **Testing:** Added hook tests for valid restoration, per-user isolation, malformed/invalid rejection, updates, and clearing. Added component tests for persisted preference selection, fresh-provider restoration, and live system-theme changes, plus a composed browser test proving that draft and display preferences survive a real page reload without creating a task.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided local-state ownership, WCAG focus/contrast behavior, and the unit/component verification split.
- **Developer override:** None. Story 8.5 was already complete, and existing unrelated study-guide files were preserved.

### Sprint 08 — Architecture and Study Guide Refresh (2026-09-27)

- **Prompt:** “For the newly finished sprint 08, I need you to update the architecture guide and study guide to reflect the changes”.
- **Action:** Updated the Angular-to-React architecture guide and React interview study guide to reflect the completed optimistic task lifecycle, URL-driven discovery, query-derived dashboard, package-boundary validation, draft persistence, display preferences, and current layered verification evidence. Removed stale statements that described Playwright and boundary enforcement as future work.
- **Guide delivery:** Kept both Markdown sources and styled standalone HTML editions aligned. Added `scripts/render-study-guides.mjs` and the `pnpm docs:guides` command so future guide revisions can regenerate accessible tables of contents, printable styling, and correct cross-guide links deterministically.
- **Developer override:** None. This documentation update does not change application runtime behavior.

### Interview Workflow Presentation (2026-09-27)

- **Prompt:** “Create an HTML file as powerpoint style to walkthrough interviewer the application workflow, highlight the technical essential to clarity the intent to use these techniques for building the app.”
- **Action:** Added `docs/application-workflow-deck.html`, a standalone 12-slide interview presentation covering the operator workflow, state ownership, monorepo boundaries, dual-mode API behavior, optimistic mutation contract, URL-driven discovery, component seams, accessibility, personalization, verification strategy, and engineering thesis.
- **Interaction design:** Implemented dependency-free CSS slide transitions with staggered content reveals, keyboard controls (arrows, Page Up/Down, Space, Home, End), touch swipes, hash-addressable slides, progress state, responsive layouts, print-to-PDF sizing, and `prefers-reduced-motion` support.
- **Developer override:** The initial request mentioned a CDN motion library. The developer correctly redirected the implementation to CSS keyframes to reduce time and resource use; no external runtime library or downloaded package was added.
- **Skills used:** `frontend-coding` and `frontend-design` shaped the architecture narrative, technique rationale, keyboard operation, semantic controls, contrast, and reduced-motion behavior.
- **Verification:** Static structure checks confirmed 12 matched slide sections, a single initial active slide, navigation handlers, print styling, and reduced-motion handling. A local-file browser render was unavailable because the browser surface blocks `file://` URLs; no workaround was attempted.

### Sprint 09 Planning — Interview Readiness & Repository Cleanup (2026-09-28)

- **Prompt:** “Ok, then create a cleanup sprint for current status of the project”.
- **Assessment baseline:** Reviewed the implemented React architecture and reran the current quality gates. Package-boundary/type validation, the production build, 75 JavaScript tests, 24 BFF integration tests, and 2 Playwright flows passed. The review also identified conflict residue in the AI-journey narrative, contradictory Story 8.6 documentation, placeholder package lint scripts, missing dedicated `packages/users` tests, raw-anchor internal navigation, acknowledged eager route loading, dashboard query fan-out, and imprecise bulk-delete undo language.
- **Action:** Added Sprint 9 to `docs/sprint-planning.md` as a no-new-features cleanup sprint. Its prioritized stories cover repository truth, real React/TypeScript linting, user-feature test and navigation parity, runtime/error/loading boundaries with measured performance evidence, mutation semantics, and a concise interview handoff.
- **Documentation alignment:** Corrected the Sprint 8 planning and README baseline to record Stories 8.1–8.6 as delivered, identify user-package tests and ESLint as planned gaps, and add Sprint 9 to the roadmap.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` shaped the cleanup guardrails, accessibility requirements, package independence, and evidence-based definition of done.
- **Developer override:** None. The pre-existing narrative conflict in this file was intentionally left for Story 9.1 so the Story 8.5, persistence-regression, and Story 8.6 histories could be reconciled explicitly rather than silently choosing one side during sprint planning.

### Sprint 09 — Story 9.1: Repository Truth & Clean Baseline (2026-09-28)

- **Prompt:** “Start user story 9.1”.
- **Action:** Reconstructed the lost Story 8.5 bulk-action and persistence-regression entries from Git history, corrected the mislabeled Story 8.6 entry, and aligned the Sprint 8 summary with all six delivered stories. Confirmed that the Git index has no unmerged paths and that tracked source and documentation contain no conflict markers.
- **Documentation alignment:** Updated the README, sprint plan, and reflection to use the same evidence: 75 JavaScript tests (33 shared, 31 todos, 11 web), 2 Playwright flows, and 24 BFF integration tests. At the Story 9.1 baseline—before Story 9.2—the documentation explicitly recorded that `pnpm lint` performed package-boundary validation plus strict TypeScript checks rather than ESLint, and that route modules remained eagerly loaded.
- **Artifact classification:** The Markdown study guides and renderer are source artifacts; the corresponding HTML guides are review outputs intended for version control and regenerated with `pnpm docs:guides`; the standalone workflow deck is a hand-authored source artifact. No documentation artifact in the reviewed set is designated local-only.
- **Verification:** `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, and `dotnet test services/bff.tests/Bff.Tests.csproj` pass. The first sandboxed Playwright attempt could not bind `127.0.0.1:5173`; the identical command passed after local-server permission was granted. `git diff --check`, conflict-marker inspection, and deterministic guide regeneration also pass.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided boundary preservation, accessibility-claim precision, and evidence-based test reporting. No runtime behavior or product scope changed.

### Sprint 09 — Story 9.2: Real React Linting & Maintainable Source Formatting (2026-09-28)

- **Prompt:** “Start user 9.2”.
- **Tooling:** Added a repository flat ESLint configuration using the supported ESLint 9 major, TypeScript ESLint, React, React Hooks, and JSX accessibility plugins. ESLint 10 was initially resolved but replaced because the current React and JSX accessibility plugins declare peer support through ESLint 9. All dependency peers are satisfied.
- **Policy:** The root `pnpm lint` command now runs the existing boundary validator, zero-warning ESLint, strict workspace TypeScript, and the deterministic Prettier check. Each frontend workspace has a real independent `lint` script. ESLint owns correctness and import architecture; Prettier is the sole formatter and is scoped to the user-feature source and ESLint configuration normalized in this story.
- **Source cleanup:** Reformatted the compressed user components, hooks, schema, and public export file without changing behavior. Static analysis also corrected type-only and duplicate imports, removed an unused optimistic flag binding, expressed the public ToDo alias as a type, and made `CardTitle` children explicit so the accessibility rule can verify heading content.
- **Rule verification:** A stdin-only negative probe confirmed that a missing Hook dependency and an image without alternative text both fail ESLint as errors. No probe file was written to the repository.
- **Verification:** Root `pnpm lint`, all four independent workspace lint scripts, `pnpm test` (75 JavaScript tests), `pnpm build`, and `pnpm test:e2e` (2 browser flows) pass with zero lint warnings. `pnpm peers check` reports no dependency issues.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided rule scope, package-boundary duplication, accessibility enforcement, and verification. No product feature or architectural layer was added.

### Sprint 09 — Story 9.3: User Feature Quality Parity & Router-Agnostic Navigation (2026-09-28)

- **Prompt:** “Start user story 9.3”.
- **Package composition:** Removed raw application anchors from `packages/users`. `UserList` and `UserDetailCard` now accept typed link renderers, allowing `apps/web` to supply TanStack Router `Link` components for profile, task-filter, and directory navigation without adding a router dependency to the feature package.
- **Accessible recovery:** User-list and user-detail query failures now render keyboard-accessible “Try again” buttons wired to TanStack Query refetching, with visible focus treatment, in-button loading feedback, and directory recovery navigation on profile failures.
- **Independent verification:** Added a package-local Vitest configuration and test script plus 15 tests covering schema trimming and validation; list/detail query hooks; create success, failure, and cache invalidation; accessible form validation and feedback; and loading, empty, error, retry, populated, and composed-navigation component states. Tests use only package public dependencies and do not import `apps/web`.
- **Verification:** `pnpm --filter @todo/users test` passes with 15 tests. Root `pnpm lint`, `pnpm test` (90 JavaScript tests: shared 33, todos 31, users 15, web 11), `pnpm build`, and `git diff --check` pass. Three Playwright flows also pass, including a composed navigation check that preserves a document marker across profile and filtered-task links to prove that neither interaction reloads the document. The initial sandboxed browser run could not bind `127.0.0.1:5173`; the same command passed with local-server permission.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided app-owned routing composition, feature-boundary preservation, retry accessibility, and deterministic query/form test coverage. No developer override was needed; unrelated untracked study-guide artifacts were preserved.
