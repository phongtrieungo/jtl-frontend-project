# Sprint Planning & Engineering Execution Roadmap

## Executive Overview
This document establishes the comprehensive development plan for the **User & ToDo Monorepo Platform**. Structured across 7 focused sprints, this plan guides implementation from repository foundation through feature packages, .NET 10 BFF service, optimistic mutation resilience, routing composition, and final documentation deliverables.

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
