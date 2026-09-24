# Sprint Planning & Engineering Execution Roadmap

## Executive Overview
This document establishes the comprehensive development plan for the **User & ToDo Monorepo Platform**. Structured across 7 focused sprints, this plan guides implementation from initial repository foundation through feature development, optimistic mutation resilience, routing composition, and final documentation deliverables.

Each story adheres to standard agile requirements:
- **User Story Statement** (`As a... I want... So that...`)
- **Technical Scope & File Targets**
- **Strict Acceptance Criteria** (`Given... When... Then...`)
- **Boundary & Architectural Integrity Checks**

---

## Sprint 1: Monorepo Foundation & Tooling Setup
**Goal:** Establish an efficient, type-safe Turborepo monorepo with workspace isolation, unified TypeScript configurations, and zero-overhead build pipelines.

### Story 1.1: Monorepo Topology & Turborepo Pipeline Configuration
- **ID:** `STORY-101`
- **User Story:**  
  *As an engineer, I want a cleanly configured Turborepo monorepo with defined workspace packages so that tasks (`build`, `lint`, `dev`) execute predictably across all modules.*
- **Scope & Targets:**
  - `package.json` (root workspace definition)
  - `pnpm-workspace.yaml` (defining `apps/*` and `packages/*`)
  - `turbo.json` (pipeline rules for `build`, `lint`, `dev`, `check-types`)
  - `.gitignore` (standard Node, Turbo, Vite, and macOS ignores)
- **Acceptance Criteria:**
  - **Given** the monorepo root directory,
  - **When** running package manager install,
  - **Then** workspaces `apps/web`, `packages/shared`, `packages/users`, and `packages/todos` are recognized and linked without warnings.
  - **When** executing `turbo build`,
  - **Then** build tasks execute in topological order without circular dependency deadlocks.
- **Architectural Check:** Ensure no workspace package has direct file dependencies outside the monorepo structure.

### Story 1.2: Shared TypeScript, ESLint & Tailwind Configurations
- **ID:** `STORY-102`
- **User Story:**  
  *As an engineer, I want shared configuration packages for TypeScript, ESLint, and TailwindCSS so that all packages maintain identical quality standards and style tokens.*
- **Scope & Targets:**
  - `tsconfig.base.json` (strict type-checking rules)
  - Boundary lint rules prohibiting cross-feature imports between `users` and `todos`.
- **Acceptance Criteria:**
  - **Given** any package in the repository,
  - **When** compiling with TypeScript,
  - **Then** strict null checks, no implicit any, and composite project references are enforced.
  - **Given** code in `packages/users`,
  - **When** attempting to import from `packages/todos`,
  - **Then** the linter/typechecker reports an immediate error.

---

## Sprint 2: Core Domain, Shared UI Kit & In-Memory Mock Engine (`packages/shared`)
**Goal:** Deliver the foundational building blocks: shared domain contracts, atomic Jotai primitives, in-memory data engine with latency/chaos support, and reusable presentation components.

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

### Story 2.2: In-Memory Mock Database & Chaos Simulation Engine
- **ID:** `STORY-202`
- **User Story:**  
  *As an evaluator or tester, I want an in-memory database with artificial latency and a toggleable chaos mode so that I can observe realistic loading states and deterministically test optimistic rollbacks.*
- **Scope & Targets:**
  - `packages/shared/src/api/mockDb.ts`
  - `packages/shared/src/api/chaosEngine.ts`
- **Acceptance Criteria:**
  - **Given** the mock DB initialized with seed users and todos,
  - **When** any query method is called (`getUsers`, `getUserById`, `getTodosByUser`),
  - **Then** it resolves with data after an artificial delay of 200-400ms.
  - **Given** chaos mode is activated (`isChaosMode = true`),
  - **When** calling `createTodo` or `createUser`,
  - **Then** the request rejects with a `500 Simulated Network Failure` error after the latency duration.

### Story 2.3: Shared UI Primitives & Accessible Feedback Components
- **ID:** `STORY-203`
- **User Story:**  
  *As a user, I want accessible, consistently styled UI primitives (Buttons, Inputs, Cards, Badges, Alert Toasts) so that interactions are clear, responsive, and keyboard-friendly.*
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
  - **Then** it renders a prominent visible focus ring on keyboard focus (`focus-visible:ring-2`).

### Story 2.4: Cross-Cutting Jotai Atoms
- **ID:** `STORY-204`
- **User Story:**  
  *As a user, I want a global active user selection and chaos toggle managed via lightweight Jotai atoms so that my context persists across different screens without page reloads.*
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

## Sprint 3: User Feature Package (`packages/users`)
**Goal:** Deliver the complete User domain module: Zod validation schemas, data access hooks, user creation form, user detail profile, and directory components.

### Story 3.1: User Schemas & API Client
- **ID:** `STORY-301`
- **User Story:**  
  *As a developer, I want Zod validation schemas and typed API client methods for users so that invalid inputs are rejected client-side before sending requests.*
- **Scope & Targets:**
  - `packages/users/src/schemas/userSchemas.ts`
  - `packages/users/src/api/userApi.ts`
- **Acceptance Criteria:**
  - **Given** an input `{ username: 'ab' }`,
  - **When** validated against `createUserSchema`,
  - **Then** validation fails with "Username must be at least 3 characters".
  - **Given** a valid input `{ username: 'johndoe' }`,
  - **Then** validation succeeds and passes sanitized data to `createUserApi`.

### Story 3.2: User Query Hooks (`useUsers`, `useUser`, `useCreateUser`)
- **ID:** `STORY-302`
- **User Story:**  
  *As a frontend consumer, I want TanStack Query hooks for user operations so that caching, background refetching, and mutation states are handled out-of-the-box.*
- **Scope & Targets:**
  - `packages/users/src/hooks/useUsers.ts`
  - `packages/users/src/hooks/useUser.ts`
  - `packages/users/src/hooks/useCreateUser.ts`
- **Acceptance Criteria:**
  - **Given** `useUsers()` is invoked,
  - **Then** it queries `userKeys.lists()` and returns `{ users, isLoading, error }`.
  - **Given** `useCreateUser()` succeeds,
  - **Then** it automatically invalidates `userKeys.lists()` so that the user directory updates immediately.

### Story 3.3: User Presentation & Form Components
- **ID:** `STORY-303`
- **User Story:**  
  *As a user, I want a user creation form and a detailed user profile card so that I can create new users and inspect their profiles by ID.*
- **Scope & Targets:**
  - `packages/users/src/components/UserCreateForm.tsx`
  - `packages/users/src/components/UserDetailCard.tsx`
  - `packages/users/src/components/UserList.tsx`
  - `packages/users/src/components/UserSelector.tsx`
  - `packages/users/src/index.ts`
- **Acceptance Criteria:**
  - **Given** the `UserCreateForm`,
  - **When** submitted with empty input,
  - **Then** an inline accessible error is displayed without triggering any network request.
  - **Given** `UserDetailCard` receiving a valid user,
  - **Then** it displays their username, ID, member since date, and an action button to view their tasks.

---

## Sprint 4: ToDo Feature Package & Optimistic Mutation Engine (`packages/todos`)
**Goal:** Implement the ToDo feature module with specific emphasis on high-fidelity optimistic creation and deterministic rollback upon simulated error.

### Story 4.1: ToDo Schemas & API Client
- **ID:** `STORY-401`
- **User Story:**  
  *As a developer, I want Zod validation schemas and API functions for todos so that task creation is typed and validated prior to dispatch.*
- **Scope & Targets:**
  - `packages/todos/src/schemas/todoSchemas.ts`
  - `packages/todos/src/api/todoApi.ts`
- **Acceptance Criteria:**
  - **Given** a ToDo input missing a title or assignee ID,
  - **Then** `createTodoSchema` rejects with descriptive validation errors.

### Story 4.2: Optimistic Mutation Hook (`useCreateTodo`) with Rollback
- **ID:** `STORY-402`
- **User Story:**  
  *As a user, I want newly created tasks to appear immediately in my task list before the server responds, and revert smoothly if the network request fails.*
- **Scope & Targets:**
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

### Story 4.3: ToDo Presentation Components & Status Visuals
- **ID:** `STORY-403`
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

## Sprint 5: Shippable Web Application & TanStack Router (`apps/web`)
**Goal:** Build the deliverable web application, compose features into pages, and configure type-safe TanStack Router routing with search params.

### Story 5.1: TanStack Router Route Tree & Layout Shell
- **ID:** `STORY-501`
- **User Story:**  
  *As a user, I want a clean application layout with header navigation, route transitions, and responsive page containers.*
- **Scope & Targets:**
  - `apps/web/src/routes/__root.tsx`
  - `apps/web/src/routes/index.tsx`
  - `apps/web/src/router.ts`
  - `apps/web/src/main.tsx`
- **Acceptance Criteria:**
  - **Given** the app launches,
  - **Then** the header displays navigation links (`Dashboard`, `Users`, `Todos`), the global user switcher, and the chaos simulation toggle.
  - **Given** navigation between links,
  - **Then** TanStack Router swaps active route views without full-page reloads.

### Story 5.2: Users Routes (`/users` and `/users/:id`)
- **ID:** `STORY-502`
- **User Story:**  
  *As a user, I want to navigate to `/users` to create/browse users, and navigate to `/users/:id` to inspect an individual user's profile and tasks.*
- **Scope & Targets:**
  - `apps/web/src/routes/users/index.tsx`
  - `apps/web/src/routes/users/$id.tsx`
- **Acceptance Criteria:**
  - **Given** a user navigates to `/users/user-1`,
  - **Then** the `$id` parameter is extracted in a type-safe manner and passed to the user detail container.
  - **Given** an invalid or non-existent user ID,
  - **Then** a graceful "User not found" view is displayed with a link back to `/users`.

### Story 5.3: ToDos Route (`/todos`) with Filtering & Composition
- **ID:** `STORY-503`
- **User Story:**  
  *As a user, I want to navigate to `/todos` to view and create tasks, with the option to filter by specific user or view tasks for the globally active user.*
- **Scope & Targets:**
  - `apps/web/src/routes/todos.tsx`
- **Acceptance Criteria:**
  - **Given** the `/todos` page,
  - **When** an active user is selected in the global header,
  - **Then** the task list filters to that user's tasks, and the creation form pre-selects that user as assignee.
  - **Given** search param `?userId=user-2` in the URL,
  - **Then** TanStack Router validates the search param and synchronizes the view.

---

## Sprint 6: Cross-Cutting Jotai Integration, Resilience & Polish
**Goal:** Verify interactive chaos testing, smooth notification feedback, keyboard accessibility audits, and performance tuning.

### Story 6.1: Interactive Chaos Mode Toolbar & Rollback Verification
- **ID:** `STORY-601`
- **User Story:**  
  *As an evaluator, I want a toggle switch in the UI header to turn on "Simulate Network Failure" so that I can immediately verify optimistic rollback in real-time.*
- **Scope & Targets:**
  - `apps/web/src/components/ChaosToggle.tsx`
  - Integration with `packages/shared` chaos engine
- **Acceptance Criteria:**
  - **Given** Chaos Mode is toggled ON,
  - **When** the user creates a new ToDo item,
  - **Then** the item appears in the list immediately (optimistic update),
  - **And** after the artificial delay (e.g. 400ms), the item disappears from the list (rollback),
  - **And** a clear error toast appears explaining that the operation failed and was reverted.

### Story 6.2: Accessibility (a11y) & Keyboard Audit
- **ID:** `STORY-602`
- **User Story:**  
  *As a keyboard or screen-reader user, I want to navigate the entire app and perform all operations without a mouse.*
- **Scope & Targets:**
  - Focus indicators across all buttons, inputs, links
  - Skip to main content link
  - Screen reader announcements on mutations
- **Acceptance Criteria:**
  - **Given** only a keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`),
  - **When** navigating from home to user creation, to task creation,
  - **Then** all inputs and buttons receive visible focus rings and can be activated via keyboard.
  - **Then** automated axe-core audit reports zero critical or serious accessibility violations.

---

## Sprint 7: Documentation, Reflections & AI Journey
**Goal:** Deliver the required architectural README, performance & testing reflections, and comprehensive AI journey documentation.

### Story 7.1: Architectural README & Handover Documentation
- **ID:** `STORY-701`
- **User Story:**  
  *As an evaluating engineering manager or peer frontend team, I want a concise README explaining architectural trade-offs, package boundaries, and local setup instructions.*
- **Scope & Targets:**
  - `README.md` (root)
- **Acceptance Criteria:**
  - **Given** `README.md`,
  - **Then** it clearly explains why the monorepo was split into `web`, `users`, `todos`, and `shared`.
  - **Then** it provides quick-start commands: install (`pnpm install`), dev (`pnpm dev`), build (`pnpm build`).

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
  - **Then** it outlines the 4-layer testing pyramid, mocking approach, and the step-by-step verification of optimistic rollbacks.

### Story 7.3: AI Journey Artifacts (`ai-journey/`)
- **ID:** `STORY-703`
- **User Story:**  
  *As an evaluator, I want an `ai-journey/` folder documenting how AI was steered, what prompts were used, which skills were leveraged, and where agent outputs were overridden.*
- **Scope & Targets:**
  - `ai-journey/master-journey.md`
- **Acceptance Criteria:**
  - **Given** `ai-journey/master-journey.md`,
  - **Then** it details the planning strategy, prompt logs, model decisions, and explicit developer overrides that shaped the final codebase.
