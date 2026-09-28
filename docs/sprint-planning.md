# Sprint Planning & Engineering Execution Roadmap

## Executive Overview
This document establishes the comprehensive development plan for the **User & ToDo Monorepo Platform**. Structured across 8 focused sprints, this plan guides implementation from repository foundation through feature packages, .NET 10 BFF service, optimistic mutation resilience, routing composition, showcase verification, and final documentation deliverables.

Each story adheres to standard agile requirements:
- **User Story Statement** (`As a... I want... So that...`)
- **Technical Scope & File Targets**
- **Strict Acceptance Criteria** (`Given... When... Then...`)
- **Boundary & Architectural Integrity Checks**

---

## Sprint 1: Monorepo Foundation & Tooling Setup
**Goal:** Establish an efficient, type-safe Turborepo monorepo with workspace isolation, unified TypeScript configurations, and multi-service development pipelines.

### Story 1.1: Monorepo Topology & Turborepo Pipeline Configuration
- **ID:** `STORY-101`
- **User Story:**  
  *As an engineer, I want a cleanly configured Turborepo monorepo with defined workspace packages so that tasks (`build`, `lint`, `dev`) execute predictably across all modules.*
- **Scope & Targets:**
  - `package.json` (root workspace definition)
  - `pnpm-workspace.yaml` (defining `apps/*`, `packages/*`, and `services/*`)
  - `turbo.json` (pipeline rules for `build`, `lint`, `dev`, `check-types`)
  - `.gitignore` (standard Node, Turbo, Vite, and .NET ignores)
- **Acceptance Criteria:**
  - **Given** the monorepo root directory,
  - **When** running package manager install,
  - **Then** workspaces `apps/web`, `packages/shared`, `packages/users`, `packages/todos`, and `services/bff` are recognized and linked without warnings.
  - **When** executing `turbo build`,
  - **Then** build tasks execute in topological order without circular dependency deadlocks.
- **Architectural Check:** Ensure no workspace package has direct file dependencies outside the monorepo structure.

### Story 1.2: Shared TypeScript, ESLint & Tailwind Configurations
- **ID:** `STORY-102`
- **User Story:**  
  *As an engineer, I want shared configuration packages for TypeScript, ESLint, and TailwindCSS so that all frontend packages maintain identical quality standards and style tokens.*
- **Scope & Targets:**
  - `tsconfig.base.json` (strict type-checking rules)
  - Boundary lint rules prohibiting cross-feature imports between `users` and `todos`.
- **Acceptance Criteria:**
  - **Given** any frontend package in the repository,
  - **When** compiling with TypeScript,
  - **Then** strict null checks, no implicit any, and composite project references are enforced.
  - **Given** code in `packages/users`,
  - **When** attempting to import from `packages/todos`,
  - **Then** the linter/typechecker reports an immediate error.

---

## Sprint 2: Core Domain, Dual-Mode API Adapter & Shared UI Kit (`packages/shared`)
**Goal:** Deliver the foundational building blocks: shared domain contracts, atomic Jotai primitives, dual-mode API client adapter (BFF + In-Browser Mock), and reusable presentation components.

### Story 2.1: Domain Type Contracts & Query Key Factories
- **ID:** `STORY-201`
- **User Story:**  
  *As a developer, I want centralized domain contracts (`User`, `Todo`) and query key factories so that feature packages share standardized types and cache keys without coupling to each other.*
- **Scope & Targets:**
  - `packages/shared/src/types/domain.ts`
  - `packages/shared/src/api/queryKeys.ts`
  - `packages/shared/src/index.ts`
- **Acceptance Criteria:**
  - **Given** `packages/shared`,
  - **When** exporting `User`, `Todo`, `UserSummary`, `CreateUserInput`, and `CreateTodoInput`,
  - **Then** types are strictly declared with immutable IDs and ISO date strings.
  - **Given** `userKeys` and `todoKeys` factories,
  - **Then** calling `todoKeys.byUser('123')` returns `['todos', 'list', { userId: '123' }]` typed as const tuple.

### Story 2.2: Dual-Mode API Client & In-Browser Mock Engine
- **ID:** `STORY-202`
- **User Story:**  
  *As an evaluator or tester, I want a dual-mode API client that connects to the .NET 10 BFF when available and automatically falls back to an in-browser mock engine if the backend is absent.*
- **Scope & Targets:**
  - `packages/shared/src/api/apiClient.ts`
  - `packages/shared/src/api/mockDb.ts`
  - `packages/shared/src/api/httpBffClient.ts`
- **Acceptance Criteria:**
  - **Given** `VITE_API_MODE=mock` or BFF offline,
  - **When** calling any API method,
  - **Then** the request resolves using the in-browser mock engine with 200-400ms simulated latency.
  - **Given** `VITE_API_MODE=bff` and BFF running,
  - **When** calling any API method,
  - **Then** the request forwards to `http://localhost:5000/api` over HTTP.

### Story 2.3: Shared UI Primitives & Accessible Feedback Components
- **ID:** `STORY-203`
- **User Story:**  
  *As a user, I want accessible, consistently styled UI primitives (Buttons, Inputs, Cards, Badges, Alert Toasts) using the Slate + Indigo palette so that interactions are clear and responsive.*
- **Scope & Targets:**
  - `packages/shared/src/components/Button.tsx`
  - `packages/shared/src/components/Input.tsx`
  - `packages/shared/src/components/Card.tsx`
  - `packages/shared/src/components/Badge.tsx`
  - `packages/shared/src/components/Alert.tsx`
  - `packages/shared/src/components/Spinner.tsx`
- **Acceptance Criteria:**
  - **Given** an `Input` component,
  - **When** an error prop is passed,
  - **Then** it sets `aria-invalid="true"` and renders the error message associated via `aria-describedby`.
  - **Given** any interactive element (Button, Input),
  - **Then** it renders a prominent visible focus ring on keyboard focus (`focus-visible:ring-2 focus-visible:ring-indigo-600`).

### Story 2.4: Cross-Cutting Jotai Atoms
- **ID:** `STORY-204`
- **User Story:**  
  *As a user, I want global active user selection, chaos mode, and toast notifications managed via lightweight Jotai atoms.*
- **Scope & Targets:**
  - `packages/shared/src/state/userAtom.ts` (`activeUserIdAtom`, `isUserSelectedAtom`)
  - `packages/shared/src/state/chaosAtom.ts` (`isChaosActiveAtom`)
  - `packages/shared/src/state/toastAtom.ts` (`toastsAtom`, `useToast` hook)
- **Acceptance Criteria:**
  - **Given** `activeUserIdAtom` is updated to `'user-1'`,
  - **Then** `isUserSelectedAtom` immediately derives `true`.
  - **Given** a toast is dispatched via `useToast`,
  - **Then** it appears in `toastsAtom` with auto-dismissal after 4 seconds.

---

## Sprint 3: .NET 10 Backend-for-Frontend Service (`services/bff`)
**Goal:** Deliver the ASP.NET Core .NET 10 Minimal API service: endpoints for users and todos, thread-safe in-memory store, Swagger documentation, and latency/chaos middleware.

### Story 3.1: ASP.NET Core Project Setup & Minimal API Endpoints
- **ID:** `STORY-301`
- **User Story:**  
  *As a frontend consumer, I want RESTful endpoints for users and todos in a lightweight .NET 10 Minimal API service so that data is served efficiently.*
- **Scope & Targets:**
  - `services/bff/bff.csproj` (.NET 10 Minimal API, Swagger)
  - `services/bff/Program.cs`
  - `services/bff/Endpoints/UserEndpoints.cs`
  - `services/bff/Endpoints/TodoEndpoints.cs`
- **Acceptance Criteria:**
  - **Given** the .NET 10 service running on port 5000,
  - **When** requesting `GET /api/users`,
  - **Then** it returns a 200 OK JSON list of users with assigned task counts.
  - **When** requesting `GET /api/todos?userId={id}`,
  - **Then** it returns the todos filtered for that user.

### Story 3.2: Thread-Safe In-Memory Store & Seed Data
- **ID:** `STORY-302`
- **User Story:**  
  *As a developer, I want a zero-configuration, thread-safe in-memory data store seeded with demo users and tasks so that the service runs without any external database.*
- **Scope & Targets:**
  - `services/bff/Services/InMemoryUserStore.cs`
  - `services/bff/Services/InMemoryTodoStore.cs`
- **Acceptance Criteria:**
  - **Given** the service boots up,
  - **Then** demo users (e.g. "Ada Lovelace", "Alan Turing") and their respective tasks are pre-populated.
  - **When** new users or todos are created via POST,
  - **Then** they are stored safely in concurrent collections.

### Story 3.3: Chaos & Latency Simulation Middleware
- **ID:** `STORY-303`
- **User Story:**  
  *As an evaluator, I want the backend to support artificial latency and simulated failure when requested so that optimistic rollbacks can be verified across a real HTTP boundary.*
- **Scope & Targets:**
  - `services/bff/Middleware/ChaosAndLatencyMiddleware.cs`
- **Acceptance Criteria:**
  - **Given** any HTTP request,
  - **Then** the middleware introduces 200-400ms delay to emulate realistic network conditions.
  - **Given** a request with header `X-Simulate-Chaos: true` (or server chaos enabled),
  - **When** submitting `POST /api/todos`,
  - **Then** the server responds with `500 Internal Server Error` and message `"Simulated Network Failure"`.

---

## Sprint 4: User Feature Package (`packages/users`)
**Goal:** Deliver the complete User domain module: Zod validation schemas, data access hooks, user creation form, user detail profile, and directory components.

### Story 4.1: User Schemas & Custom Hooks
- **ID:** `STORY-401`
- **User Story:**  
  *As a developer, I want Zod validation schemas and TanStack Query hooks for users so that inputs are validated client-side and queries are cached cleanly.*
- **Scope & Targets:**
  - `packages/users/src/schemas/userSchemas.ts`
  - `packages/users/src/hooks/useUsers.ts`
  - `packages/users/src/hooks/useUser.ts`
  - `packages/users/src/hooks/useCreateUser.ts`
- **Acceptance Criteria:**
  - **Given** an invalid username (under 3 chars),
  - **Then** `createUserSchema` rejects with a descriptive message.
  - **Given** `useCreateUser()` succeeds,
  - **Then** `userKeys.lists()` is invalidated automatically.

### Story 4.2: User Presentation & Profile Components
- **ID:** `STORY-402`
- **User Story:**  
  *As a user, I want a user creation form and a detailed user profile card so that I can create users and inspect their profiles.*
- **Scope & Targets:**
  - `packages/users/src/components/UserCreateForm.tsx`
  - `packages/users/src/components/UserDetailCard.tsx`
  - `packages/users/src/components/UserList.tsx`
  - `packages/users/src/index.ts`
- **Acceptance Criteria:**
  - **Given** `UserCreateForm`,
  - **When** submitted with empty input,
  - **Then** inline accessible error is displayed without dispatching a network call.
  - **Given** `UserDetailCard` receiving a valid user,
  - **Then** it renders user metadata and a button to view their tasks.

---

## Sprint 5: ToDo Feature Package & Optimistic Mutation Engine (`packages/todos`)
**Goal:** Implement the ToDo feature module with specific emphasis on high-fidelity optimistic creation and deterministic rollback upon simulated error.

### Story 5.1: ToDo Schemas & Optimistic Mutation Hook (`useCreateTodo`)
- **ID:** `STORY-501`
- **User Story:**  
  *As a user, I want newly created tasks to appear immediately in my task list before the server responds, and revert smoothly if the network request fails.*
- **Scope & Targets:**
  - `packages/todos/src/schemas/todoSchemas.ts`
  - `packages/todos/src/hooks/useCreateTodo.ts`
  - `packages/todos/src/hooks/useTodosByUser.ts`
- **Acceptance Criteria:**
  - **Given** a user views their task list,
  - **When** `useCreateTodo` mutation is triggered,
  - **Then** `onMutate` cancels active queries for `todoKeys.byUser(userId)`, snapshots previous cache data, and injects a temporary optimistic item with `isOptimistic: true`.
  - **Given** the API mutation rejects (e.g. Chaos Mode active),
  - **When** `onError` fires,
  - **Then** the cache is reverted to the snapshot (the temporary item disappears), and a rollback error toast is dispatched.
  - **Given** the API mutation resolves successfully,
  - **When** `onSettled` fires,
  - **Then** `todoKeys.byUser(userId)` is invalidated to synchronize canonical server data.

### Story 5.2: ToDo Presentation Components & Status Visuals
- **ID:** `STORY-502`
- **User Story:**  
  *As a user, I want a responsive ToDo creation form and task list that clearly displays optimistic status badges and empty states.*
- **Scope & Targets:**
  - `packages/todos/src/components/TodoCreateForm.tsx`
  - `packages/todos/src/components/TodoList.tsx`
  - `packages/todos/src/components/TodoItemRow.tsx`
  - `packages/todos/src/index.ts`
- **Acceptance Criteria:**
  - **Given** an optimistic item in `TodoList`,
  - **Then** it renders with an amber "Saving..." pulse badge and subdued opacity.
  - **Given** a user with no tasks,
  - **Then** `TodoList` displays a helpful empty state with a call to action.

---

## Sprint 6: Shippable Web App Shell & TanStack Router (`apps/web`)
**Goal:** Build the deliverable web application, compose features into pages, and configure type-safe TanStack Router routing with search params.

### Story 6.1: TanStack Router Route Tree & Layout Shell
- **ID:** `STORY-601`
- **User Story:**  
  *As a user, I want a clean application layout with header navigation, active user switcher, chaos toggle, and backend status indicator.*
- **Scope & Targets:**
  - `apps/web/src/routes/__root.tsx`
  - `apps/web/src/routes/index.tsx`
  - `apps/web/src/components/Header.tsx`
  - `apps/web/src/components/ChaosToggle.tsx`
  - `apps/web/src/components/BackendStatusBadge.tsx`
  - `apps/web/src/main.tsx`
- **Acceptance Criteria:**
  - **Given** the app launches,
  - **Then** the header displays navigation links (`Dashboard`, `Users`, `Todos`), the global user switcher, backend status (BFF vs Mock), and the chaos simulation toggle.

### Story 6.2: Users Routes & ToDos Route Composition
- **ID:** `STORY-602`
- **User Story:**  
  *As a user, I want to navigate to `/users`, `/users/:id`, and `/todos` seamlessly.*
- **Scope & Targets:**
  - `apps/web/src/routes/users/index.tsx`
  - `apps/web/src/routes/users/$id.tsx`
  - `apps/web/src/routes/todos.tsx`
- **Acceptance Criteria:**
  - **Given** a user navigates to `/users/user-1`,
  - **Then** the `$id` parameter is extracted type-safely and renders the user detail profile.
  - **Given** `/todos?userId=user-2`,
  - **Then** TanStack Router validates search params and filters tasks for that user.

---

## Sprint 7: Production Reflections, AI Journey & README Documentation
**Goal:** Deliver the required architectural README, performance & testing reflections, and comprehensive AI journey documentation.

### Story 7.1: Architectural README & Handover Documentation
- **ID:** `STORY-701`
- **User Story:**  
  *As an evaluating engineering manager, I want a concise README explaining architectural trade-offs, package boundaries, BFF integration, and local setup instructions.*
- **Scope & Targets:**
  - `README.md` (root)
- **Acceptance Criteria:**
  - **Given** `README.md`,
  - **Then** it clearly explains the monorepo splits, `services/bff` placement, dual-mode fallback, and execution commands (`pnpm dev` for mock mode, `pnpm dev:full` for full-stack).

### Story 7.2: Performance & Testing Reflections
- **ID:** `STORY-702`
- **User Story:**  
  *As an evaluator, I want written reflections analyzing performance considerations and testing strategies.*
- **Scope & Targets:**
  - Section in `README.md` and `docs/reflection.md`
- **Acceptance Criteria:**
  - **Given** the performance reflection,
  - **Then** it covers query caching (`staleTime`/`gcTime`), re-render isolation via Jotai, and route code-splitting via TanStack Router.
  - **Given** the testing reflection,
  - **Then** it outlines the 4-layer testing pyramid and the step-by-step verification of optimistic rollbacks.

### Story 7.3: AI Journey Artifacts (`ai-journey/`)
- **ID:** `STORY-703`
- **User Story:**  
  *As an evaluator, I want an `ai-journey/` folder documenting how AI was steered, what prompts were used, which skills were leveraged, and where agent outputs were overridden.*
- **Scope & Targets:**
  - `ai-journey/master-journey.md`
- **Acceptance Criteria:**
  - **Given** `ai-journey/master-journey.md`,
  - **Then** it details the planning strategy, prompt logs, model decisions, and explicit developer overrides that shaped the final codebase.

---

## Sprint 8: React Showcase — Resilient Task Lifecycle & Discovery
**Status:** Complete (2026-09-27) — Stories 8.1–8.6 delivered
**Goal:** Extend the completed take-home into a concise interview showcase. The sprint demonstrates advanced React state management without widening the architecture: optimistic task mutations, type-safe URL-driven discovery, derived dashboard insights, and evidence-backed resilience.

### Sprint Guardrails
- This is one time-boxed showcase sprint. Core stories are required; stretch stories start only after all core acceptance criteria and tests pass.
- `packages/todos` owns task-domain hooks, schemas, and presentational components. `apps/web` composes those exports into routes and dashboard views. `packages/users` remains independent of `packages/todos`.
- Shared API contracts, query keys, reusable UI primitives, and cross-cutting atoms belong in `packages/shared`. No feature package performs direct HTTP calls.
- Every write mutation preserves the established contract: cancel relevant queries, snapshot cache, optimistically update, restore the exact snapshot on error with an accessible toast, and invalidate on settlement.
- URL search state is validated with Zod and owned by TanStack Router. Jotai remains limited to ephemeral UI state such as a bulk-selection or panel-open state; it must not duplicate task records or filters persisted in the URL.

### Story 8.1: Optimistic Task Lifecycle
- **ID:** `STORY-801`
- **Priority:** Core
- **Status:** Complete (2026-09-27)
- **User Story:**
  *As an operator, I want to complete, rename, and delete tasks immediately so that routine work is fast while failures remain safe and understandable.*
- **Scope & Targets:**
  - `packages/shared/src/api/*` and shared domain contracts only where an existing task operation needs an explicit typed adapter.
  - `packages/todos/src/hooks/useToggleTodo.ts`
  - `packages/todos/src/hooks/useUpdateTodo.ts`
  - `packages/todos/src/hooks/useDeleteTodo.ts`
  - `packages/todos/src/components/TodoItemRow.tsx` and related presentation-only components.
  - `packages/todos/src/index.ts` public exports.
- **Acceptance Criteria:**
  - **Given** a confirmed task, **when** its completion control is activated, **then** its status changes immediately, is temporarily non-interactive while saving, and reconciles to the canonical response when settled.
  - **Given** a task title is edited, **when** the form is submitted, **then** Zod validation renders an inline, associated error for invalid input and an optimistic title is shown for valid input.
  - **Given** a task is deleted, **when** the action is confirmed, **then** it immediately disappears and its original list position is restored if the request fails.
  - **Given** Chaos Mode causes any lifecycle write to fail, **then** the exact prior query-cache snapshot is restored and a `role="alert"` toast explains the reverted action and exposes a retry path.
  - **Given** an optimistic task is in flight, **then** conflicting task controls are disabled and its saving status remains visually and programmatically clear.

### Story 8.2: Shareable Task Discovery
- **ID:** `STORY-802`
- **Priority:** Core
- **Status:** Complete (2026-09-27)
- **User Story:**
  *As an operator, I want to filter, search, and sort tasks through a shareable URL so that I can quickly return to or send a precise work view.*
- **Scope & Targets:**
  - `apps/web/src/routes/todos.tsx`
  - `apps/web/src/components/TaskFilters.tsx`
  - `packages/todos/src/components/TodoList.tsx` and pure filtering/sorting utilities.
- **Acceptance Criteria:**
  - **Given** `/todos`, **when** a user chooses an assignee, status (`all`, `active`, or `completed`), search query, or sort order, **then** the validated route search state updates without losing the other selections.
  - **Given** a copied task-board URL, **when** it is opened in a new session, **then** the same validated filter, query, and sort view renders.
  - **Given** a user types in search, **then** filtering is debounced, case-insensitive, and does not trigger a server write or move server data into Jotai.
  - **Given** a query produces no matching tasks, **then** the UI distinguishes “no tasks for this user” from “no tasks match these filters” and offers a clear-filter action.
  - **Given** all controls are used with a keyboard or screen reader, **then** labels, focus rings, selected states, and result-count announcements are available.

### Story 8.3: Task Insights Dashboard
- **ID:** `STORY-803`
- **Priority:** Core
- **Status:** Complete (2026-09-27)
- **User Story:**
  *As an interviewer or operator, I want a concise dashboard of task progress and recent work so that the application communicates useful value at a glance.*
- **Scope & Targets:**
  - `apps/web/src/routes/index.tsx`
  - `apps/web/src/components/*` dashboard-only composition components.
  - Pure, tested derived-insight utilities in the owning package or `packages/shared` only if they are genuinely cross-domain.
- **Acceptance Criteria:**
  - **Given** users and tasks are available, **then** the dashboard presents total, active, completed, and completion-rate metrics plus recent tasks and users needing attention.
  - **Given** data is loading, unavailable, or empty, **then** metric and list regions use meaningful skeleton, error, and empty states without layout shift.
  - **Given** a dashboard insight is activated, **then** it navigates with typed links to the corresponding filtered `/todos` or user route.
  - **Given** task data changes through an optimistic lifecycle action, **then** insights update from the Query cache without introducing a second source of truth.
  - **Given** a visual metric conveys a status, **then** text—not color alone—communicates its meaning.

### Story 8.4: Showcase Verification
- **ID:** `STORY-804`
- **Priority:** Core
- **Status:** Complete (2026-09-27)
- **User Story:**
  *As an evaluator, I want deterministic evidence that advanced task interactions remain correct, accessible, and resilient under failure.*
- **Scope & Targets:**
  - Feature-level Vitest/React Testing Library suites in `packages/todos` and `apps/web`.
  - An end-to-end suite for the composed app (tooling to be selected during implementation).
  - `README.md`, `docs/reflection.md`, and `ai-journey/master-journey.md` updates after delivery.
- **Acceptance Criteria:**
  - **Given** each create, toggle, edit, and delete mutation, **then** tests prove immediate optimistic UI/cache state, successful reconciliation, and exact rollback plus toast on failure.
  - **Given** filters and sorting, **then** tests prove Zod-validated URL state, deep-link restoration, debounce behavior, and accessible empty states.
  - **Given** the composed app, **then** a browser test covers selecting a user, creating a task, enabling Chaos Mode, observing the saving state, and observing rollback feedback.
  - **Given** Sprint 8 is complete, **then** typecheck, build, the root lint command's boundary validation, JavaScript tests, and BFF integration tests pass in a normal local or CI environment. ESLint remains Story 9.2 scope.

### Story 8.5: Bulk Actions with Undo
- **ID:** `STORY-805`
- **Priority:** Stretch
- **Status:** Complete (2026-09-27)
- **User Story:**
  *As an operator, I want to complete or delete multiple selected tasks and undo a recent bulk action so that repetitive work is efficient and recoverable.*
- **Scope & Targets:**
  - Selection controls and bulk-action UI in `packages/todos`.
  - A minimal ephemeral selection atom only if prop composition becomes impractical; task data remains in TanStack Query.
- **Acceptance Criteria:**
  - **Given** multiple non-optimistic tasks are selected, **when** a bulk action is confirmed, **then** each item reports progress accessibly and partial failures restore only their own snapshots.
  - **Given** a successful bulk action, **then** a time-bounded, keyboard-accessible undo toast is available and its behavior is tested.

### Story 8.6: Resilience and Personalization Polish
- **ID:** `STORY-806`
- **Priority:** Stretch
- **Status:** Complete (2026-09-27)
- **User Story:**
  *As an operator, I want unfinished input and display preferences to survive a refresh so that the app feels dependable during everyday use.*
- **Scope & Targets:**
  - Local-only draft persistence for the task form.
  - Light/dark/system theme and compact/comfortable density preferences.
- **Acceptance Criteria:**
  - **Given** a user refreshes while writing a valid task draft, **then** the draft is restored without creating a server record.
  - **Given** a user changes theme or density, **then** the preference persists locally, honors system theme where selected, and all interactive controls retain required contrast and focus treatment.

### Delivery Sequence
1. Confirm API contract parity for toggle, update, and delete in BFF and mock modes; build the lifecycle hooks and their rollback tests.
2. Deliver accessible task-row interactions, then complete the URL-driven filters, search, and sort experience.
3. Compose query-derived dashboard insights and typed drill-down links.
4. Add composed browser coverage and delivery documentation; evaluate stretch work only after the core quality gate is green.

---

## Sprint 9: Interview Readiness & Repository Cleanup
**Status:** In progress — Stories 9.1–9.3 complete (2026-09-28)
**Goal:** Convert the completed showcase into a concise, trustworthy senior React interview artifact. This sprint adds no product features; it removes contradictory claims, closes quality-tooling gaps, brings the user feature to the same testing standard as the task feature, and makes the strongest React decisions easy to review and demonstrate.

### Sprint Guardrails
- No new product capabilities, state libraries, services, or architectural layers.
- Preserve the zero-sideways-dependency rule and the existing optimistic mutation contract.
- Prefer deleting, simplifying, or documenting over adding abstractions.
- Do not weaken accessibility, mock/BFF parity, or deterministic rollback coverage.
- Treat all pre-existing working-tree changes as developer-owned; review them explicitly before tracking, ignoring, or removing them.
- Every documentation claim must point to implemented code or a passing verification command.

### Story 9.1: Repository Truth & Clean Baseline
- **ID:** `STORY-901`
- **Priority:** P0
- **Status:** Complete (2026-09-28)
- **User Story:**
  *As an evaluator, I want the repository status and documentation to agree with the implementation so that I can trust the engineering claims before reviewing the code.*
- **Scope & Targets:**
  - Resolve the existing conflict in `ai-journey/master-journey.md` while preserving the completed Story 8.5, persistence regression, Story 8.6, and guide/deck history.
  - Reconcile Sprint 8 status, README feature summaries, test counts, and delivered/deferred language.
  - Review currently modified and untracked documentation artifacts and intentionally classify each as source, generated output, or local-only material.
  - Remove stale statements that claim unsupported tooling or behavior.
- **Acceptance Criteria:**
  - **Given** the repository is inspected with Git, **then** no file is unmerged and no conflict marker remains in tracked source or documentation.
  - **Given** the README, sprint plan, reflection, and AI journey are compared, **then** Story 8.6, test coverage, lint behavior, and route-loading status are described consistently.
  - **Given** an evaluator reads a capability claim, **then** the related implementation or verification command exists and is reproducible.
  - **Given** generated guides or decks exist, **then** their tracking policy and regeneration path are explicit without deleting developer-owned work.

### Story 9.2: Real React Linting & Maintainable Source Formatting
- **ID:** `STORY-902`
- **Priority:** P0
- **Status:** Complete (2026-09-28)
- **User Story:**
  *As a frontend maintainer, I want actual static analysis for React and TypeScript so that hook, accessibility, import, and maintainability regressions are caught before review.*
- **Scope & Targets:**
  - Add a repository-level ESLint configuration for TypeScript, React, React Hooks, and JSX accessibility.
  - Replace package placeholder lint scripts with real lint commands while retaining `scripts/validate-boundaries.mjs` as an architectural check.
  - Reformat compressed user-feature components into readable, reviewable source without changing behavior.
  - Decide on and document one deterministic formatting check; avoid a second overlapping style system.
- **Acceptance Criteria:**
  - **Given** `pnpm lint` runs, **then** it executes ESLint, strict TypeScript validation, and package-boundary validation rather than success-message placeholders.
  - **Given** hooks and interactive JSX are linted, **then** hook dependency and baseline accessibility violations fail the command.
  - **Given** each workspace package is linted independently, **then** it passes with zero warnings.
  - **Given** source files are reviewed, **then** component bodies are formatted for maintainability and no behavior-only diff is hidden inside mechanical formatting.

### Story 9.3: User Feature Quality Parity & Router-Agnostic Navigation
- **ID:** `STORY-903`
- **Priority:** P0
- **Status:** Complete (2026-09-28)
- **User Story:**
  *As an evaluator, I want the user feature to be as testable and composition-friendly as the task feature so that package boundaries do not come at the cost of SPA behavior or confidence.*
- **Scope & Targets:**
  - Add a Vitest configuration and package test script for `packages/users`.
  - Cover the user schema, query hooks, creation success/failure, validation, loading, empty, error, and populated component states.
  - Replace internal raw-anchor navigation with router-agnostic callbacks or render composition owned by `apps/web`; do not add a TanStack Router dependency to `packages/users`.
  - Provide accessible retry behavior for failed user list/detail queries where appropriate.
- **Acceptance Criteria:**
  - **Given** `pnpm --filter @todo/users test` runs, **then** the package executes independently and covers its public behavior without importing `apps/web`.
  - **Given** a user opens a profile or task link through the composed application, **then** navigation uses typed TanStack Router behavior without a full document reload.
  - **Given** user creation succeeds or fails, **then** cache invalidation, form state, and accessible feedback are verified deterministically.
  - **Given** the user list or detail query fails, **then** the UI exposes a keyboard-accessible retry action.

### Story 9.4: Runtime Boundaries, Loading Strategy & Honest Performance Evidence
- **ID:** `STORY-904`
- **Priority:** P1
- **Status:** Planned
- **User Story:**
  *As an evaluator, I want failures and loading boundaries to be deliberate and performance claims to be measured so that the application demonstrates production judgment rather than checklist architecture.*
- **Scope & Targets:**
  - Add route-level not-found and unexpected-error experiences with accessible recovery actions.
  - Introduce route-level lazy loading where it produces a meaningful bundle split, then record before/after build output.
  - Reconcile Query defaults with feature-specific `staleTime` and `gcTime` settings, documenting intentional exceptions.
  - Document the dashboard's per-user query fan-out and the production threshold at which an aggregate endpoint would replace it; do not add that endpoint in this cleanup sprint.
- **Acceptance Criteria:**
  - **Given** a route render or data boundary fails, **then** the user receives an accessible fallback and a recovery path rather than a blank application.
  - **Given** a production build completes, **then** route chunks and before/after bundle sizes are recorded in `docs/reflection.md` without claiming unmeasured improvement.
  - **Given** caching configuration is reviewed, **then** global and feature defaults are consistent or explicitly justified.
  - **Given** the dashboard architecture is discussed, **then** its optimistic-cache coherence benefit and N+1 scaling trade-off are both documented.

### Story 9.5: Mutation Semantics & Interview Handoff
- **ID:** `STORY-905`
- **Priority:** P1
- **Status:** Planned
- **User Story:**
  *As an interviewer, I want mutation behavior and the project walkthrough to use precise language so that I can distinguish implemented guarantees from demo conveniences.*
- **Scope & Targets:**
  - Audit overlapping create, row, and bulk mutation behavior for stale-snapshot or conflicting-action risks and add focused regression tests where concurrency is supported.
  - Clarify bulk-delete recovery semantics: recreating a task is a restore with a potentially new ID, not identity-preserving undo. Update UI copy and documentation, or narrow undo to operations whose identity can be preserved.
  - Reduce the README opening to a fast evaluator path: run, demo, architecture thesis, verification, and known trade-offs.
  - Produce one concise interview walkthrough centered on state ownership, optimistic rollback, URL state, accessibility, and testing; move optional BFF, personalization, and bulk details to follow-up material.
- **Acceptance Criteria:**
  - **Given** supported mutations overlap, **then** deterministic tests prove that a rollback cannot erase a later confirmed change; unsupported conflicts are prevented in the UI and documented.
  - **Given** a deleted task is recovered through recreation, **then** user-facing and technical language does not promise preservation of its original identity.
  - **Given** an evaluator has five minutes, **then** the README provides a direct path to launch the app, trigger a successful optimistic write, trigger Chaos Mode rollback, and locate the supporting tests.
  - **Given** the project is discussed in an interview, **then** the primary narrative explains React-specific ownership and rendering decisions before optional infrastructure.

### Delivery Sequence
1. Complete Story 9.1 first so every later change starts from a trustworthy baseline.
2. Deliver Stories 9.2 and 9.3 to close the most visible React quality gaps.
3. Complete Story 9.4 with measured output rather than speculative optimization claims.
4. Finish Story 9.5, rerun the full quality gate, and freeze feature scope for interview use.

### Definition of Done
- The Git index has no unmerged paths and tracked files contain no conflict markers.
- README, sprint plan, reflection, and AI journey agree on delivered scope and verification evidence.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, and `dotnet test services/bff.tests/Bff.Tests.csproj` pass.
- `packages/users` has independent tests and no internal navigation causes a full-page reload in the composed SPA.
- Error boundaries, lazy-route behavior, caching choices, dashboard fan-out, and mutation recovery semantics are documented truthfully.
- No new product feature or architectural layer is introduced.
