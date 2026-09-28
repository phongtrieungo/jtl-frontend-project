# My AI collaboration journey: planning, building, checking, correcting

This is a record of how I used AI to solve the take-home project: what I asked it to do, what it produced, where I steered the work, and what the checks revealed. The application is the result; the collaboration and judgment behind it are the subject of this document.

I started by asking AI to help define the requirements, architecture, and delivery plan. I then used sprint and story prompts to work through bounded changes. Along the way, I asked for tests, reported behavior that was wrong, changed the scope, and requested a cleanup pass before the interview handoff. The record includes those corrections because they show more about the process than a list of completed features alone.

## How to read this record

Each chapter explains a stage of the collaboration. Expand its **prompt and delivery records** for the original implementation details, commands, test results, and overrides. Those records are retained here in the main file; the archive is only an unchanged historical copy.

| Stage | How I used AI | What to look for |
| --- | --- | --- |
| [1. Establish context](#1-establish-context-before-implementation) | Draft requirements, architecture, skills, and a sprint plan | How constraints made later short prompts meaningful |
| [2. Build in increments](#2-delegate-bounded-work-and-ask-for-evidence) | Implement one sprint at a time; request a feature branch and tests | What was delegated, and what verification was actually recorded |
| [3. Review expanded scope](#3-review-the-plan-before-expanding-the-product) | Review a showcase plan before implementation | The one-sprint decision and core-versus-stretch scope |
| [4. Bring back a real failure](#4-use-observed-failures-to-redirect-the-ai) | Report lost state and inconsistent runtime behavior | Diagnosis, changed assumptions, and regression evidence |
| [5. Audit the result](#5-ask-ai-to-audit-and-refine-its-own-output) | Request a cleanup sprint, then deliver it story by story | Missing coverage, misleading claims, and concurrency fixes |
| [6. Refine the handoff](#6-use-ai-for-explanation-and-correct-its-editorial-judgment) | Produce study material and an interview deck; correct an over-shortened journey | Human direction applies to documentation as well as code |

**Reading the evidence:** quoted prompts below are recorded wording, not reconstructed conversations. Other requests are labeled as summaries. The detailed entries are historical delivery reports, not fresh verification results from this editorial revision. They preserve earlier gaps and superseded decisions rather than quietly rewriting history.

## 1. Establish context before implementation

**My request:** ask for a PRD, architecture specification, coding/design/testing skills, and a sprint development plan with stories and acceptance criteria. This initial request is summarized in the original record rather than presented as a verbatim transcript.

**AI's contribution:** turn the brief into repository documents and repeatable instructions. The result included the package structure, shared contracts, optimistic mutation expectations, and a sequence of sprints.

**My direction:** keep `users` and `todos` independent; put shared concerns in `shared`; keep server records in Query; make failed writes demonstrable through Chaos Mode; and let the frontend run without requiring the reviewer to install .NET. The initial backend choice was .NET 8, later explicitly changed to .NET 10. The palette and placement of the backend under `services/bff` were also recorded decisions.

This context explains why later prompts could be as short as “start sprint 2.” The scope and acceptance criteria lived in the repository, so each prompt could refer to a defined unit of work instead of restating the whole project.

### Tools and persistent instructions

The original setup identifies Antigravity and “Gemini 3.8 Flash (High)”; the Sprint 7 record identifies Codex (GPT-6). These are labels recorded by the sessions. The log does not document a comparative model evaluation or a reason for every tool transition, so it should not imply one.

`AGENTS.md`, `GEMINI.md`, and the specialized skills carried constraints between sessions. The early tool log records file creation, editing, and command execution; later entries record the skills used and specific verification commands. The useful evidence is what those tools produced and checked.

<details>
<summary>Tooling record — original model label, methodology, and custom skills</summary>

- **AI Model:** Gemini 3.8 Flash (High) / Antigravity Agentic Platform
- **Methodology:** Contract-first planning, strict modular boundaries, and agent self-steering via localized skills.
- **Custom Skills Created:**
  - `frontend-coding` (TypeScript, React, Turborepo boundaries, TanStack Query/Router, Jotai, Zod)
  - `frontend-design` (Tailwind tokens, optimistic UX states, WCAG 2.1 AA a11y)
  - `frontend-testing` (Testing pyramid, RTL recipes, optimistic update rollback verification)
  - `backend-dotnet` (ASP.NET Core .NET 8 Minimal API, thread-safe stores, latency/chaos middleware)

</details>

<details>
<summary>Planning record — initial request, architectural decisions, and repository baseline</summary>

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

</details>

## 2. Delegate bounded work and ask for evidence

> “Proceed sprint 01 with a feature branch so that I can review each PR to have a best understand of code change”

This request established a reviewable delivery unit. AI scaffolded the workspace, then implemented the shared core, BFF, user feature, task feature, and app composition through separate sprint requests. The records below retain branch names, generated components, and verification commands rather than replacing that history with a feature summary.

**A specific follow-up:** after “Start sprint 05,” I asked, “Write the unit test and update the README with current state of the project.” The resulting record includes schema and optimistic-mutation coverage, and documentation that separated delivered packages from the still-pending app composition.

**Where the process fell short:** Sprint 6 found the user package was a placeholder despite Sprint 4 having been recorded as complete. AI restored its implementation; dedicated package tests were still missing from the later baseline and were restored in Story 9.3. This discrepancy is retained because it shows why a delivery statement alone was insufficient evidence.

Verification was not uniform at every step. Sprint 6 records a build, typecheck, and HTML response check, but no tests. Sprint 7 records syntax and diff checks, and explicitly says the new full-stack launcher had not been run in that turn. The distinction between “implemented,” “checked,” and “still unverified” matters when evaluating AI-assisted work.

<details>
<summary>Sprint 1 — feature-branch prompt and workspace scaffold</summary>

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

</details>

<details>
<summary>Sprint 2 — shared API, mock engine, UI primitives, and 29 recorded tests</summary>

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

</details>

<details>
<summary>Sprint 3 — BFF implementation, runtime adaptation, and 24 integration tests</summary>

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

</details>

<details>
<summary>Developer override — confirm .NET 10 after the initial .NET 8 plan</summary>

The original planning entries above record the initial .NET 8 choice. The developer has since confirmed that this repository will use .NET 10. Current implementation and specifications target `net10.0`, including ASP.NET Core OpenAPI and `Microsoft.AspNetCore.Mvc.Testing` 10.0.0. Current setup and architecture guidance use .NET 10; the earlier .NET 8 entries are retained as historical planning context.

</details>

<details>
<summary>Sprint 3 follow-up — align README with delivered backend scope</summary>

Updated the root README to mark Sprint 03 complete, document the implemented BFF endpoints and chaos/latency behavior, provide the standalone .NET 10 run and test commands, and distinguish the implemented backend/shared client from frontend work planned for Sprints 4–6.

</details>

<details>
<summary>Sprint 4 — user feature delivery and the later coverage discrepancy</summary>

- **Prompt:** “start sprint 04”
- **Action:** Implemented `createUserSchema`; TanStack Query hooks for listing, loading, and creating users; and accessible create form, directory, and profile components in `packages/users`. The create hook invalidates the user list after success, and all package functionality is exported through the package root.
- **Architecture:** The feature depends only on `@todo/shared` and package dependencies; it introduces no users-to-todos dependency. Form input is Zod-validated before the mutation runs, with inline associated errors and toast feedback.
- **Historical verification record:** This delivery originally recorded `pnpm --filter @todo/users test` (7 tests), typecheck, and build as passing. Those user-package tests and the test script are not present in the current tree after the Sprint 6 package restoration; the reproducible Story 9.1 baseline therefore excludes them, and Story 9.3 owns restoring dedicated coverage.

</details>

<details>
<summary>Sprint 5 — task creation, requested tests, and README follow-up</summary>

- **Prompt:** “Start sprint 05”
- **Action:** Implemented the Zod create-task schema, per-user TanStack Query hook, and `useCreateTodo` with query cancellation, cache snapshot, temporary optimistic record, exact rollback on failure, error toast, chaos-mode forwarding, and settled invalidation. Added the task creation form, task list with loading/error/empty states, row with amber “Saving...” status and subdued opacity, and package-root exports.
- **Architecture:** `packages/todos` imports only from `@todo/shared` and its declared external dependencies; no import from `packages/users` was introduced. Form fields use the shared accessible `Input` and `Button` primitives.
- **Follow-up:** Added package Vitest configuration and a `test` script. Schema tests cover trimming, title length, and required assignee; mutation tests cover immediate optimistic insertion, settled invalidation, exact rollback with an error toast, and removal when there was no prior cache.
- **Documentation:** Updated README package status, current sprint status, testing instructions, and roadmap. Clarified that `apps/web` remains a placeholder and feature package composition is Sprint 6 work.
- **Verification:** `pnpm --filter @todo/todos typecheck`, `pnpm --filter @todo/todos build`, `pnpm --filter @todo/todos test` (6 tests), and `git diff --check` pass.

</details>

<details>
<summary>Sprint 6 — app composition, missing-package repair, and verification limits</summary>

- **Prompt:** “Start sprint 06”
- **Action:** Replaced the Vite placeholder with the app shell, responsive navigation, dashboard, people directory/profile routes, and task board route. Added the React Query and Jotai providers, validated `/todos` search using Zod, active-user selection, chaos-mode control, backend/mock status, accessible skip link, and toast viewport.
- **Composition repair:** The repository’s `packages/users` implementation was only a placeholder despite Sprint 04 being recorded as complete. Restored the package’s public user hooks, Zod schema, accessible create form, directory, and profile components so `apps/web` can compose the intended feature APIs without importing internal files or adding cross-feature package dependencies.
- **Runtime configuration:** Applied `VITE_API_MODE` in the Vite entrypoint so `mock`, `bff`, and `auto` choices reach the shared API client.
- **Verification:** Initial checks exposed an invalid pnpm v11 workspace permission value (`allowBuilds.esbuild` contained an unresolved placeholder). Replaced it with `true`, restored dependencies from the package store, and confirmed `pnpm --filter @todo/web typecheck` and `pnpm --filter @todo/web build` pass. Started Vite and confirmed `GET /` returns the app HTML. `git diff --check` passes. No tests were run.

</details>

<details>
<summary>Sprint 7 — handoff documentation and a launcher not yet runtime-verified</summary>

- **Prompt:** “start the final sprint”
- **Plan:** Reviewed the final sprint stories and current README, package scripts, route loading, query options, and existing interaction log before editing. The task was documentation and local development handover; no feature coding skill applied. The session ran in Codex (GPT-6); no model-switch decision was made for this sprint.
- **Story 7.1:** Updated the README to explain package boundaries, mock fallback, BFF placement, and the actual mock/full-stack startup commands. Corrected stale placeholder and sprint-status statements.
- **Startup improvement:** Added `pnpm dev:full` via `scripts/dev-full.mjs` to start the .NET BFF and Vite app together and stop both processes when one exits.
- **Story 7.2:** Added `docs/reflection.md` covering query cache freshness/retention, Jotai render scope, route loading, the four testing layers, and an ordered optimistic rollback verification flow. Explicitly recorded that feature queries currently use 30s `staleTime` (rather than the roadmap's 60s target), and route modules are currently eager, so code splitting is a follow-up opportunity.
- **Story 7.3:** Updated this log with the prompt, planning approach, implementation decisions, and verification boundary. No developer override was needed.
- **Verification:** `node --check scripts/dev-full.mjs` and `git diff --check` pass. No test suite was run. The full-stack launcher was not started in this turn, so its runtime behavior still needs a local .NET 10 run.

</details>

## 3. Review the plan before expanding the product

> “Ok, before moving forwards, update the plan for these and I will review them”.

Before the React showcase work began, I asked for a plan I could review. I chose one sprint instead of several. AI translated that constraint into core stories—task lifecycle, shareable discovery, dashboard insights, and verification—with bulk actions and personalization explicitly separated as stretch work.

The subsequent story prompts delegated implementation against that plan. AI extended the mutation hooks, added URL-driven discovery and derived dashboard data, and introduced browser coverage. The detailed records preserve the boundaries used during this work: task behavior in the task package, composition in the app, URL filters in Router, and no duplicated server records in Jotai.

This stage also shows the difference between a plan and its later outcome. Story 8.4 initially described stretch work as deferred; the following requests delivered Stories 8.5 and 8.6. Those earlier status statements remain dated history, not a claim that the features are still pending.

<details>
<summary>Sprint 8 planning — review-first prompt and the one-sprint override</summary>

- **Prompt:** “Ok, before moving forwards, update the plan for these and I will review them”.
- **Action:** Added Sprint 8 to the engineering roadmap as one reviewable, time-boxed showcase sprint. Core scope is optimistic task completion, editing, and deletion; Zod-validated URL-synced task discovery; query-derived dashboard insights; and deterministic feature/browser verification. Bulk actions with undo and draft/theme/density personalization are deliberately marked stretch to protect core quality.
- **Architecture and UX constraints:** Preserved package ownership (`packages/todos` for task behavior, `apps/web` for composition), the no-sideways-import rule, TanStack Router ownership of shareable filters, Jotai only for ephemeral UI state, and full optimistic rollback with visible saving, disabled conflicting controls, inline validation, focus treatment, and accessible failure feedback.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` informed the plan’s boundary, accessibility, and verification acceptance criteria.
- **Developer override:** The developer chose one sprint instead of several. The plan accommodates that decision by separating core delivery from explicitly non-blocking stretch stories; no implementation began in this planning step.
- **README update:** Added the planned Sprint 8 scope and changed the roadmap to eight sprints. Removed personal React and Angular study-guide links from the project documentation index; the underlying study-guide files were intentionally left untouched.

</details>

<details>
<summary>Story 8.1 — task lifecycle implementation and failure-path tests</summary>

- **Prompt:** “Start sprint 08”.
- **Action:** Started core implementation with typed shared API write options so Chaos Mode reaches mock and BFF toggle, update, and delete requests. Added isolated `useToggleTodo`, `useUpdateTodo`, and `useDeleteTodo` hooks, each canceling queries, snapshotting the owning per-user cache, updating optimistically, restoring the exact snapshot on failure, and invalidating after settlement. The existing create mutation now has the same retryable rollback feedback.
- **UI and accessibility:** Extended task rows with accessible status controls, a Zod-validated inline title editor, explicit inline delete confirmation, disabled conflicting controls while saving, and a programmatic “Saving…” state. Toasts now support a keyboard-accessible retry action for reverted writes.
- **Verification:** Added lifecycle hook tests for immediate toggle/update/delete effects, settled invalidation, exact rollback including original delete position, and retryable error toasts. `pnpm --filter @todo/todos test` (9 tests), `build`, `pnpm --filter @todo/shared test` (29 tests), `typecheck`, and `git diff --check` pass.
- **Status:** Story 8.1 is implemented; Sprint 8 remains in progress pending Stories 8.2–8.4. Existing untracked study-guide documents were preserved.

</details>

<details>
<summary>Story 8.2 — URL discovery prompt, state ownership, and accessibility</summary>

- **Prompt:** “Start user story 8.2”
- **Action:** Added validated `/todos` URL state for assignee, status, query, and sort; a keyboard-accessible filter panel; and a 300ms debounced title search. The task list now derives its displayed items with pure filtering/sorting utilities from the existing TanStack Query cache and announces the visible result count.
- **Resilience & accessibility:** Deep links restore their valid state without a server write. Empty states distinguish a user with no tasks from a filtered view with no matches; the latter offers a clear-filter action. Controls are explicitly labelled and inherit visible keyboard focus treatment.
- **Architecture:** URL state remains exclusively in TanStack Router, task records remain exclusively in TanStack Query, and no Jotai state or cross-feature dependency was added.

</details>

<details>
<summary>Story 8.3 — query-derived insights and composition boundaries</summary>

- **Prompt:** “Start story 8.3”.
- **Action:** Completed the existing dashboard draft with task-only derived insight utilities, a `useTaskInsights` query composition hook, and an application-owned dashboard presentation. The dashboard now shows total, active, completed, and completion-rate metrics; the five most recent tasks; and up to five users ranked by active workload.
- **Architecture:** Insights observe the existing per-user `todoKeys.byUser` query caches, so optimistic creation, completion, rename, deletion, and rollback flow directly into the dashboard without Jotai or another server-data store. `packages/todos` owns task derivation and fetching; `apps/web` joins user names and owns cross-feature route composition. No sideways feature import was added.
- **UX and accessibility:** Added typed drill-down links to filtered task views and user profiles, stable metric/list skeletons, explicit unavailable and empty states, retry behavior, `aria-busy` regions, a saving announcement for optimistic data, and text labels for active/completed status.
- **Testing:** Added pure derivation tests, a hook test that exercises live cache updates and restoration, and dashboard component tests for typed links plus loading, error, retry, and empty states. The web test setup explicitly installs the Vitest DOM matchers and stubs router scrolling under JSDOM.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided package ownership, query-cache derivation, semantic status treatment, and the unit/component/integration coverage split.
- **Developer override:** None. Existing unrelated study-guide files were left untouched.

</details>

<details>
<summary>Story 8.4 — deterministic mutation tests, Playwright, and boundary checks</summary>

- **Prompt:** “Start story 8.4”.
- **Action:** Completed the core showcase verification layer. Expanded mutation hook coverage so create, toggle, edit, and delete each prove immediate optimistic cache state, successful settled reconciliation, and exact snapshot restoration with retryable toast feedback on failure. Added task-discovery tests for Zod URL normalization and deep-link restoration, the 300 ms search debounce, labelled controls, result empty states, and clear-filter behavior.
- **Browser verification:** Selected Playwright for the composed end-to-end layer and pinned the suite to the in-browser mock adapter so it remains independent of the optional BFF. The scenario selects Ada Lovelace, creates and reconciles a task, enables Chaos Mode, observes the optimistic “Saving...” state, and verifies that failure removes the temporary row while exposing a `role="alert"` message and keyboard-accessible retry action.
- **Quality tooling:** Replaced the root placeholder lint path with strict workspace typechecking plus `scripts/validate-boundaries.mjs`, which rejects users/todos sideways imports, shared-to-feature dependencies, workspace deep imports, and relative package crossings. Playwright output directories are ignored; browser installation and execution commands are documented in the README.
- **Verification:** `pnpm lint`, `pnpm build`, and `pnpm test` pass (59 JavaScript tests: shared 29, todos 22, web 8); `pnpm test:e2e` passes (1 Chromium flow); and `dotnet test services/bff.tests/Bff.Tests.csproj` passes (24 integration tests). `git diff --check` is clean.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` shaped package ownership, accessible assertions, mutation lifecycle coverage, and the four-layer verification split.
- **Developer override:** None. Existing untracked study-guide documents were preserved. Core Sprint 8 is complete; Stories 8.5–8.6 remain optional deferred stretch work.

</details>

<details>
<summary>Story 8.5 — bulk actions, per-item recovery, and original Undo wording</summary>

- **Prompt:** “Start story 8.5”.
- **Action:** Added local task selection and select-visible controls to `TodoList`, explicit bulk-delete confirmation, and a dedicated `useBulkTodoActions` orchestration hook. Bulk completion and deletion optimistically update the owning per-user query cache while tracking each selected task independently.
- **Resilience:** Each failed item restores only its own cached snapshot and original surviving-list position; successful siblings remain committed. A successful or partially successful action exposes an 8-second, keyboard-focusable Undo toast. Completion undo restores prior completion values, while deletion undo recreates removed tasks through the shared API adapter before canonical query reconciliation.
- **Architecture and accessibility:** Selection remains local component state because prop composition is sufficient; no Jotai atom or server-data duplication was added. Optimistic items cannot be selected, per-row progress is conveyed with text and `aria-busy`, selection counts use a polite live region, controls have visible focus treatment, and destructive bulk actions require confirmation.
- **Testing:** Added hook integration coverage for immediate per-item progress, isolated partial rollback, preserved delete ordering, time-bounded completion undo, delete recreation, and a focusable Undo control. Component coverage verifies labelled multi-selection, per-task live progress announcements, and bulk-delete confirmation.
- **Verification:** `pnpm --filter @todo/todos test` passed with 28 tests at delivery; the then-current full JavaScript suite passed with 65 tests, along with `pnpm lint`, `pnpm build`, the existing Playwright flow, and `git diff --check`.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided query-cache ownership, interaction states, accessibility, and deterministic partial-failure tests. No developer override was needed; unrelated untracked study-guide documents were preserved.

</details>

## 4. Use observed failures to redirect the AI

**My feedback, summarized from the record:** bulk-completed tasks reverted after refresh, `pnpm dev:full` sometimes showed mock mode and sometimes BFF mode, and mock users/tasks needed browser persistence.

This was a concrete behavior report rather than a request for another feature. AI traced two interacting problems: the mock store was memory-only, and startup/health behavior could move the frontend between separate BFF and mock datasets.

**The response:** persist mock records in versioned browser storage, make automatic backend selection stable for the page session, and wait for BFF readiness before starting the full-stack frontend. A later BFF failure would now remain a failure instead of silently writing to a different store.

**Recorded evidence:** adapter tests, hydration/corruption tests, a browser reload regression, and a live full-stack startup check. The delivery record reports those checks passing at that stage. The significance is the feedback loop: observed user behavior challenged an earlier assumption, and the response added a test for the actual failure.

The next personalization request added valid per-user drafts and display preferences. That work had to keep form recovery separate from both Query records and mock database persistence.

<details>
<summary>Regression record — developer report, diagnosis, fix, and reload/startup verification</summary>

- **Prompt:** The developer reported that bulk-completed tasks reverted after refresh, `pnpm dev:full` sometimes appeared in mock mode and sometimes BFF mode, and mock users/tasks needed browser persistence.
- **Root cause:** `dev:full` launched Vite concurrently with the compiling BFF. Early queries could hit a connection error and switch the shared client to a fresh mock store; the health poll could later switch back to the seeded BFF, creating a split-brain cache. The mock engine itself was memory-only, so a true mock-mode refresh also reseeded it.
- **Fix:** The dual-mode client now performs one deduplicated auto-mode health decision per page session and never redirects later BFF failures into a different store. Explicit BFF mode remains BFF and exposes an unavailable state. The full-stack launcher waits for Kestrel’s listening signal, then starts Vite with fixed `VITE_API_MODE=bff` and an explicit loopback BFF URL.
- **Mock persistence:** Added defensive, versioned `localStorage` hydration and persistence for mock users and tasks. Every successful create, toggle, update, and delete persists; invalid stored data falls back to the seed safely.
- **Testing and verification:** Added adapter tests for stable auto/BFF selection, mock hydration and corruption recovery tests, and a Playwright regression that bulk-completes tasks and confirms they remain complete after `page.reload()`. At delivery, `pnpm lint`, `pnpm test` (69 JavaScript tests), `pnpm build`, `pnpm test:e2e` (2 tests), and the 24 BFF integration tests passed. A live `pnpm dev:full` run confirmed the BFF listening gate, fixed BFF mode, and rendered “BFF connected” status before shutdown.
- **Skills used:** `frontend-coding`, `frontend-testing`, and `backend-dotnet` guided state ownership, regression coverage, and full-stack readiness behavior. No developer override was needed; unrelated untracked study-guide documents were preserved.

</details>

<details>
<summary>Story 8.6 — draft and preference request, implementation, and recorded tests</summary>

- **Prompt:** “Start the story 8.6”.
- **Action:** Added schema-gated, per-user task draft persistence in `packages/todos`. Valid unfinished titles restore from local storage after refresh without invoking a mutation; invalid, malformed, submitted, and cleared drafts are not restored.
- **Personalization:** Added persisted Jotai atoms for light/dark/system theme and compact/comfortable density, plus labelled header controls. The app resolves system theme through `prefers-color-scheme`, reacts to operating-system theme changes, applies document-level theme/density attributes, and provides dark-mode surface, text, control, and focus treatments.
- **Architecture:** Drafts remain local form state rather than server cache. Display preferences are minimal cross-cutting UI state in `packages/shared`; no task records or URL filters moved into Jotai, and no sideways package dependency was introduced.
- **Testing:** Added hook tests for valid restoration, per-user isolation, malformed/invalid rejection, updates, and clearing. Added component tests for persisted preference selection, fresh-provider restoration, and live system-theme changes, plus a composed browser test proving that draft and display preferences survive a real page reload without creating a task.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided local-state ownership, WCAG focus/contrast behavior, and the unit/component verification split.
- **Developer override:** None. Story 8.5 was already complete, and existing unrelated study-guide files were preserved.

</details>

**Current evidence note:** the Story 8.6 entry reports a composed browser test for drafts/preferences. The current browser suite contains create/Chaos rollback, bulk reload persistence, and SPA navigation flows; draft/preference coverage is in hook/component suites. The historical claim is retained below the stage narrative so the discrepancy is visible, not presented as current browser coverage.

## 5. Ask AI to audit and refine its own output

> “Ok, then create a cleanup sprint for current status of the project”.

I shifted the task from adding features to reviewing the delivered repository. AI's assessment found problems that a “sprints complete” summary had obscured: contradictory documentation, placeholder lint commands, missing user-package tests, full-page internal navigation, eager route loading, and imprecise recovery language.

I then requested Stories 9.1–9.5 individually. AI reconciled the records, added actual static analysis, restored independent user tests, improved route recovery/loading, and audited overlapping writes. These are AI contributions reported in the delivery log; the record does not attribute every discovered issue or implementation choice to a separate manual finding by me.

Three examples make this stage useful in an interview:

- **Check the checker.** Story 9.2 records a negative probe: a missing Hook dependency and an image without alternative text had to fail ESLint. A successful lint command was not enough if it did not enforce the intended rules.
- **Measure the trade-off.** Story 9.4 records both the smaller entry bundle and the larger total emitted JavaScript. It does not equate that measurement with proven runtime speed.
- **Challenge a successful-looking mutation.** Story 9.5 tests out-of-order independent writes. Whole-list rollback became operation-scoped recovery so an earlier failure could not erase a later success. Delete recovery was renamed Restore because recreation can change identity.

The final recorded gate was 96 JavaScript tests, three Playwright flows, and 24 BFF integration tests, with lint, types, and build checks. The counts below show how that evidence evolved; none were rerun for this documentation-only revision.

<details>
<summary>Sprint 9 planning — cleanup request, assessment, and explicit no-new-features scope</summary>

- **Prompt:** “Ok, then create a cleanup sprint for current status of the project”.
- **Assessment baseline:** Reviewed the implemented React architecture and reran the current quality gates. Package-boundary/type validation, the production build, 75 JavaScript tests, 24 BFF integration tests, and 2 Playwright flows passed. The review also identified conflict residue in the AI-journey narrative, contradictory Story 8.6 documentation, placeholder package lint scripts, missing dedicated `packages/users` tests, raw-anchor internal navigation, acknowledged eager route loading, dashboard query fan-out, and imprecise bulk-delete undo language.
- **Action:** Added Sprint 9 to `docs/sprint-planning.md` as a no-new-features cleanup sprint. Its prioritized stories cover repository truth, real React/TypeScript linting, user-feature test and navigation parity, runtime/error/loading boundaries with measured performance evidence, mutation semantics, and a concise interview handoff.
- **Documentation alignment:** Corrected the Sprint 8 planning and README baseline to record Stories 8.1–8.6 as delivered, identify user-package tests and ESLint as planned gaps, and add Sprint 9 to the roadmap.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` shaped the cleanup guardrails, accessibility requirements, package independence, and evidence-based definition of done.
- **Developer override:** None. The pre-existing narrative conflict in this file was intentionally left for Story 9.1 so the Story 8.5, persistence-regression, and Story 8.6 histories could be reconciled explicitly rather than silently choosing one side during sprint planning.

</details>

<details>
<summary>Story 9.1 — restore history and reconcile repository claims</summary>

- **Prompt:** “Start user story 9.1”.
- **Action:** Reconstructed the lost Story 8.5 bulk-action and persistence-regression entries from Git history, corrected the mislabeled Story 8.6 entry, and aligned the Sprint 8 summary with all six delivered stories. Confirmed that the Git index has no unmerged paths and that tracked source and documentation contain no conflict markers.
- **Documentation alignment:** Updated the README, sprint plan, and reflection to use the same evidence: 75 JavaScript tests (33 shared, 31 todos, 11 web), 2 Playwright flows, and 24 BFF integration tests. At the Story 9.1 baseline—before Story 9.2—the documentation explicitly recorded that `pnpm lint` performed package-boundary validation plus strict TypeScript checks rather than ESLint, and that route modules remained eagerly loaded.
- **Artifact classification:** The Markdown study guides and renderer are source artifacts; the corresponding HTML guides are review outputs intended for version control and regenerated with `pnpm docs:guides`; the standalone workflow deck is a hand-authored source artifact. No documentation artifact in the reviewed set is designated local-only.
- **Verification:** `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, and `dotnet test services/bff.tests/Bff.Tests.csproj` pass. The first sandboxed Playwright attempt could not bind `127.0.0.1:5173`; the identical command passed after local-server permission was granted. `git diff --check`, conflict-marker inspection, and deterministic guide regeneration also pass.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided boundary preservation, accessibility-claim precision, and evidence-based test reporting. No runtime behavior or product scope changed.

</details>

<details>
<summary>Story 9.2 — real linting, dependency correction, and negative probes</summary>

- **Prompt:** “Start user 9.2”.
- **Tooling:** Added a repository flat ESLint configuration using the supported ESLint 9 major, TypeScript ESLint, React, React Hooks, and JSX accessibility plugins. ESLint 10 was initially resolved but replaced because the current React and JSX accessibility plugins declare peer support through ESLint 9. All dependency peers are satisfied.
- **Policy:** The root `pnpm lint` command now runs the existing boundary validator, zero-warning ESLint, strict workspace TypeScript, and the deterministic Prettier check. Each frontend workspace has a real independent `lint` script. ESLint owns correctness and import architecture; Prettier is the sole formatter and is scoped to the user-feature source and ESLint configuration normalized in this story.
- **Source cleanup:** Reformatted the compressed user components, hooks, schema, and public export file without changing behavior. Static analysis also corrected type-only and duplicate imports, removed an unused optimistic flag binding, expressed the public ToDo alias as a type, and made `CardTitle` children explicit so the accessibility rule can verify heading content.
- **Rule verification:** A stdin-only negative probe confirmed that a missing Hook dependency and an image without alternative text both fail ESLint as errors. No probe file was written to the repository.
- **Verification:** Root `pnpm lint`, all four independent workspace lint scripts, `pnpm test` (75 JavaScript tests), `pnpm build`, and `pnpm test:e2e` (2 browser flows) pass with zero lint warnings. `pnpm peers check` reports no dependency issues.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided rule scope, package-boundary duplication, accessibility enforcement, and verification. No product feature or architectural layer was added.

</details>

<details>
<summary>Story 9.3 — user test parity and evidence that navigation stays in the SPA</summary>

- **Prompt:** “Start user story 9.3”.
- **Package composition:** Removed raw application anchors from `packages/users`. `UserList` and `UserDetailCard` now accept typed link renderers, allowing `apps/web` to supply TanStack Router `Link` components for profile, task-filter, and directory navigation without adding a router dependency to the feature package.
- **Accessible recovery:** User-list and user-detail query failures now render keyboard-accessible “Try again” buttons wired to TanStack Query refetching, with visible focus treatment, in-button loading feedback, and directory recovery navigation on profile failures.
- **Independent verification:** Added a package-local Vitest configuration and test script plus 15 tests covering schema trimming and validation; list/detail query hooks; create success, failure, and cache invalidation; accessible form validation and feedback; and loading, empty, error, retry, populated, and composed-navigation component states. Tests use only package public dependencies and do not import `apps/web`.
- **Verification:** `pnpm --filter @todo/users test` passes with 15 tests. Root `pnpm lint`, `pnpm test` (90 JavaScript tests: shared 33, todos 31, users 15, web 11), `pnpm build`, and `git diff --check` pass. Three Playwright flows also pass, including a composed navigation check that preserves a document marker across profile and filtered-task links to prove that neither interaction reloads the document. The initial sandboxed browser run could not bind `127.0.0.1:5173`; the same command passed with local-server permission.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided app-owned routing composition, feature-boundary preservation, retry accessibility, and deterministic query/form test coverage. No developer override was needed; unrelated untracked study-guide artifacts were preserved.

</details>

<details>
<summary>Story 9.4 — recovery boundaries, measured bundle sizes, and documented scaling limits</summary>

- **Prompt:** “Start user story 9.4”.
- **Runtime boundaries:** Added root-level accessible loading, unexpected-error, and not-found experiences. Lazy route delays use a stable skeleton with a polite status announcement; errors expose retry and typed dashboard recovery without leaking internal error details; unknown URLs provide a clear 404 recovery path.
- **Route loading:** Kept route definitions eager for immediate matching and moved the dashboard, people directory, user profile, and task board behind TanStack Router lazy components with intent preloading. The pre-change build had one 429.94 kB JavaScript bundle (130.71 kB gzip). The post-change entry is 394.66 kB (122.42 kB gzip), with route/shared async chunks from 0.40–15.05 kB. Total emitted JavaScript increased to 437.31 kB (138.32 kB summed gzip), so documentation records the smaller initial entry and additional splitting overhead without claiming unmeasured runtime improvement.
- **Cache policy:** Centralized the normal 30-second stale and 300-second garbage-collection policy in the application QueryClient; user/task feature queries now inherit it. The polled backend-health query retains its explicit 10-second stale window as a documented availability-specific exception.
- **Dashboard trade-off:** Documented why per-user query reuse keeps optimistic updates and rollback coherent, alongside its N+1 request shape. More than 20 active workspace users or an observed p95 fan-out/latency budget breach is the stated trigger to design an aggregate endpoint; no endpoint was added in this cleanup story.
- **Testing:** Added web component coverage for the accessible pending state, error retry and recovery link, private-error suppression, and unknown-route recovery. Root `pnpm lint`, `pnpm test` (93 JavaScript tests), `pnpm build`, `pnpm test:e2e` (3 Playwright flows), and the 24 BFF integration tests pass. The first sandboxed Playwright attempt could not bind `127.0.0.1:5173`; the identical suite passed with local-server permission.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided app-owned route composition, accessible resilience states, cache ownership, and deterministic boundary coverage. Existing unrelated study-guide files were left untouched.

</details>

<details>
<summary>Story 9.5 — overlap audit, precise recovery language, and final quality gate</summary>

- **Prompt:** “Start user story 9.5”.
- **Mutation audit:** Replaced whole-list failure restoration in create, toggle, edit, and delete with operation-scoped rollback. Create removes only its own temporary ID; toggle and edit restore only their affected task; delete reinserts only its removed record at the snapshotted position. Successful create/toggle/edit responses now replace their optimistic record before reconciliation. Per-user mutation coordination coalesces invalidation until the last overlapping operation settles, preventing an intermediate refetch from erasing another pending optimistic record.
- **Conflict boundary:** Independent task records may mutate concurrently. Deterministic out-of-order tests prove that an earlier failed create/edit cannot erase a later confirmed edit/toggle. Conflicting same-task controls remain unavailable while that record is optimistic, and a component regression test proves the interaction lock. Bulk operations already isolate progress and rollback per item.
- **Recovery language:** Bulk completion retains identity-preserving **Undo**. Bulk deletion now offers **Restore** and explains before and after recovery that deleted records are recreated through the API with new server IDs; it no longer promises identity-preserving undo.
- **Evaluator handoff:** Rewrote the README around a five-minute launch/success/Chaos rollback/test path, followed by the architecture thesis, verified evidence, and explicit trade-offs. Added `docs/interview-walkthrough.md`, which leads with React state ownership, optimistic transaction semantics, URL state, accessibility, and transition-focused testing; optional BFF and scaling details are follow-up material.
- **Documentation alignment:** Updated the PRD, architecture sequence, testing reflection, and Sprint 9 status to describe operation-scoped rollback and the 96-test baseline. Sprint 9 is complete and product scope is frozen for interview use.
- **Verification:** `pnpm lint`, `pnpm typecheck` (through both lint and build gates), `pnpm test` (96 JavaScript tests: shared 33, todos 34, users 15, web 14), `pnpm build`, `pnpm test:e2e` (3 Playwright flows), and `dotnet test services/bff.tests/Bff.Tests.csproj` (24 integration tests) pass. The sandboxed Playwright attempt could not bind `127.0.0.1:5173`; the identical suite passed with local-server permission.
- **Skills used:** `frontend-coding`, `frontend-design`, and `frontend-testing` guided query-cache ownership, explicit conflict UX, accessible recovery copy, and deterministic concurrency verification. Existing developer-owned untracked guide/deck artifacts were preserved.

</details>

## 6. Use AI for explanation and correct its editorial judgment

I also used AI to prepare learning and presentation material: an architecture guide, a practical study guide, and an HTML workflow deck. The request was to help explain what the application does and why the implementation takes this approach.

**A recorded implementation override:** the presentation initially considered a CDN motion library. I redirected it to CSS keyframes to reduce time and resource use. The result stayed dependency-free.

**A later editorial correction:** I asked for the master journey to be more natural to scan and read. AI interpreted that as permission to reduce the main file from 327 lines to 86 and move the detailed evidence to an archive. That preserved a project story, but weakened this document's purpose: showing how I actually used AI.

> “The master-journey is the file to record how I use AI to solve the problem, the interviewer will read it to understand the way I use AI so that you cut off all the content I dont think it is the correct approach. I think you should find another way for this file”

This correction changed the editing approach. The main file now has a readable chapter narrative and expandable original records in the same document. The prompts, technical contributions, verification limits, and developer overrides remain available to the interviewer without requiring a separate archive visit.

This is another example of the collaboration: AI can produce a polished artifact and still optimize for the wrong goal. My feedback clarified the purpose, and the revision changed the structure rather than continuing to remove evidence.

<details>
<summary>Study material request — guide refresh and reproducible HTML generation</summary>

- **Prompt:** “For the newly finished sprint 08, I need you to update the architecture guide and study guide to reflect the changes”.
- **Action:** Updated the Angular-to-React architecture guide and React interview study guide to reflect the completed optimistic task lifecycle, URL-driven discovery, query-derived dashboard, package-boundary validation, draft persistence, display preferences, and current layered verification evidence. Removed stale statements that described Playwright and boundary enforcement as future work.
- **Guide delivery:** Kept both Markdown sources and styled standalone HTML editions aligned. Added `scripts/render-study-guides.mjs` and the `pnpm docs:guides` command so future guide revisions can regenerate accessible tables of contents, printable styling, and correct cross-guide links deterministically.
- **Developer override:** None. This documentation update does not change application runtime behavior.

</details>

<details>
<summary>Presentation request — original scope, CSS override, and verification boundary</summary>

- **Prompt:** “Create an HTML file as powerpoint style to walkthrough interviewer the application workflow, highlight the technical essential to clarity the intent to use these techniques for building the app.”
- **Action:** Added `docs/application-workflow-deck.html`, a standalone 12-slide interview presentation covering the operator workflow, state ownership, monorepo boundaries, dual-mode API behavior, optimistic mutation contract, URL-driven discovery, component seams, accessibility, personalization, verification strategy, and engineering thesis.
- **Interaction design:** Implemented dependency-free CSS slide transitions with staggered content reveals, keyboard controls (arrows, Page Up/Down, Space, Home, End), touch swipes, hash-addressable slides, progress state, responsive layouts, print-to-PDF sizing, and `prefers-reduced-motion` support.
- **Developer override:** The initial request mentioned a CDN motion library. The developer correctly redirected the implementation to CSS keyframes to reduce time and resource use; no external runtime library or downloaded package was added.
- **Skills used:** `frontend-coding` and `frontend-design` shaped the architecture narrative, technique rationale, keyboard operation, semantic controls, contrast, and reduced-motion behavior.
- **Verification:** Static structure checks confirmed 12 matched slide sections, a single initial active slide, navigation handlers, print styling, and reduced-motion handling. A local-file browser render was unavailable because the browser surface blocks `file://` URLs; no workaround was attempted.

</details>

<details>
<summary>Final documentation refinement — initial request, over-compression, and corrected approach (2026-09-28)</summary>

- **Initial request, summarized:** make the journey natural to skim, make interview study material practical and source-specific, and align the workflow deck with the interview. Do not touch application code.
- **First AI response:** rewrote the journey as five project turning points, moved the full log into an archive, and revised the study guide, walkthrough, and deck. The journey lost too much visible evidence of AI usage.
- **Developer override:** the exact correction is quoted above. Preserve the file's role as a record of how the developer uses AI to solve problems.
- **Revised action:** restore all original stage records to this file; group them chronologically; introduce the prompts, delegation, feedback, and checks in a readable narrative; use expandable details for technical depth. Preserve historical claims with explicit notes where later implementation supersedes them.
- **Verification for this revision:** check that every original delivery entry is represented, retained record bodies match the archive, internal navigation works, and the Markdown diff has no whitespace errors. These are documentation checks; application tests are not rerun.
- **Scope:** only `ai-journey/master-journey.md` is revised in this follow-up. Application code and the other interview materials remain as they were.

</details>

### Presenter playbook — turn implementation into demo scenarios (2026-09-28)

**My request:** use the workflow deck’s visual style to create an HTML backbone for presenting application scenarios, with technical and UI/UX decisions highlighted.

**AI contribution:** reviewed the implemented controls, mutation hooks, route composition, validation, persistence, and test coverage; then created [the presenter playbook](../docs/interview-presenter-playbook.html) with 28 scenarios. Each includes preparation, exact actions, expected behavior, technical and UX reasoning, a spoken explanation, recovery notes, and source links. A core route, topic/search filters, single-scenario focus, rehearsal checkmarks, and printing support make the material usable during preparation and the interview.

**Judgment applied:** separated reliable live demonstrations from prepared BFF scenarios and test-backed edge cases. The notes explicitly distinguish whole-batch Chaos failure from controlled mixed outcomes, Restore from identity-preserving Undo, and URL context from the header’s active-user value. The playbook covers implemented workflows and meaningful failure branches rather than claiming every possible input combination.

<details>
<summary>Presenter playbook delivery — prompt, scope, and verification</summary>

- **Prompt:** “Lastly, I need you write a HTML using style similar to application-workflow-deck.html to create all possible scenarios to run the application with highlight point I need to focus during presentation about technical and UI/UX decision. It will be a backbone note for me during interview presentation”.
- **Action:** Added `docs/interview-presenter-playbook.html` as a standalone, dependency-free document with the deck’s navy, lime, and cyan visual language. The eight-card core route sits within the full 28-scenario reference.
- **Skill used:** `frontend-design` guided keyboard focus, semantic controls, readable feedback, and responsive document layout. Source reading supplied the actual application behavior rather than assuming every design guideline was already implemented.
- **Verification:** Checked internal anchors, unique IDs, and local source links. Local headless-browser checks passed for filtering, focus mode, next/previous navigation, keyboard shortcuts, session-only rehearsal persistence, empty search, expandable notes, and all-scenario print visibility. Desktop and mobile screenshots were inspected; the mobile page had no horizontal overflow and the browser reported no script errors.
- **Verification boundary:** These checks exercised the HTML playbook, not every application scenario or the application test suites. The local browser needed sandbox escalation to launch; no application source changes were needed.
- **Developer constraints:** Documentation only; preserve the detailed AI collaboration record. No new override beyond those existing constraints.

</details>

## Historical sprint index

The original index is retained for traceability. It predates the detailed Sprint 9 completion entries above; its references to future repairs describe that earlier point in the journey.

<details>
<summary>Original sprint index — prompts, tools, output evaluations, and status at the time</summary>

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

</details>

## Evidence and further reading

- [Repository instructions](../AGENTS.md): the persistent constraints supplied to AI sessions.
- [Sprint plan](../docs/sprint-planning.md): the scope behind short sprint/story prompts.
- [Performance and testing reflection](../docs/reflection.md): measured results and current verification context.
- [Interview study guide](../docs/react-interview-study-guide.md): source-reading exercises for explaining the implementation.
- [Unchanged original delivery log](archive/delivery-log-through-sprint-09.md): the pre-refinement record, preserved for comparison rather than required reading.

This record was organized with AI assistance. The detailed entries remain session reports, not an independently audited chat transcript. Where the record supplies only a summarized request or no model-selection rationale, the narrative does not invent the missing conversation.
