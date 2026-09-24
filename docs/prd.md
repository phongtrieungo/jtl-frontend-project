# Product Requirements Document (PRD)

## Project: Monorepo User & ToDo Management Platform
**Role Target:** Senior Frontend Software Engineer  
**Evaluation Focus:** Architectural reasoning, strict module boundaries, data and UX resilience, optimistic mutations, state discipline, and deliberate AI usage.  
**Tech Stack:** React, TypeScript, Vite, Turborepo, TanStack Router, TanStack Query, Jotai, TailwindCSS, Zod.

---

## 1. Executive Summary & Vision

The objective of this project is to build a robust, scalable, and modular frontend application demonstrating senior-level architectural thinking and execution. The application provides two interconnected core capabilities:
1. **User Management:** Creating users and inspecting individual user profiles.
2. **ToDo Management:** Creating tasks assigned to specific users and viewing user-specific task lists with immediate optimistic feedback.

Rather than building a monolithic frontend application, the solution demonstrates production-grade structural separation through a **Turborepo monorepo** where business logic, data access, and presentation are decoupled into independent feature modules (`packages/users`, `packages/todos`) coordinated by a shared infrastructure core (`packages/shared`) and composed into a shippable application (`apps/web`).

A primary highlight of this system is **Data and UX Resilience**: implementing high-fidelity optimistic updates for task creation with deterministic rollback on simulated network failure, verified through an interactive chaos simulation toggle.

---

## 2. Core Personas & Problem Statement

### 2.1 Personas
- **Product User / Operator:** Needs an intuitive, snappy task tracking interface where actions (such as adding a task) feel instantaneous and clear feedback is provided when operations fail.
- **Frontend Team Member (Code Consumer):** Needs cleanly isolated packages where changes in the `users` domain do not unintentionally break or couple to the `todos` domain, and where shared utilities are centralized in `packages/shared`.
- **Engineering Evaluator:** Seeks evidence of structural discipline, clean boundary enforcement, correct TanStack Router and Query patterns, deliberate Jotai state usage, accessibility compliance, and transparent documentation.

### 2.2 Key Pain Points Addressed
- **Perceived Latency:** Server requests introduce UI lag. Solved via TanStack Query optimistic mutations.
- **Data Inconsistency on Failures:** Optimistic updates can lead to ghost data if network requests fail. Solved via query snapshotting and deterministic rollback in `onError`.
- **Architectural Spaghetti:** Features importing each other arbitrarily. Solved via Turborepo package boundaries with zero sideways dependencies.
- **State Fragmentation:** Complex global stores used as dumping grounds. Solved via scoped server cache (TanStack Query) and surgical atomic client state (Jotai).

---

## 3. Scope & Feature Specifications

### 3.1 Feature Module 1: User Management (`packages/users`)
- **F1.1: User Creation Form**
  - **Inputs:** `username` (string, required, 3-20 alphanumeric characters).
  - **Validation:** Zod-backed validation preventing empty or invalid usernames with explicit inline error messages.
  - **Behavior:** Submits to the User API service. On success, clears the form, shows a success notification, and refreshes the user list.
- **F1.2: User Directory & Selection**
  - Displays available users with their IDs, usernames, and creation timestamps.
  - Allows selecting a user as the active context for the session.
- **F1.3: User Detail View (`/users/:id`)**
  - Displays user profile information (ID, username, creation date).
  - Displays aggregated summary statistics (e.g., total assigned tasks count).
  - Provides navigation links to view all tasks assigned to this user or create a new task directly for this user.
  - Handles loading skeletons and "User Not Found" (404-style) error boundaries gracefully.

### 3.2 Feature Module 2: ToDo Management (`packages/todos`)
- **F2.1: ToDo Creation Form**
  - **Inputs:**
    - `title` (string, required, 3-100 characters).
    - `assigneeId` (string, user ID dropdown / pre-selected based on active user context).
  - **Validation:** Validates that `title` is non-empty and `assigneeId` references an existing user.
- **F2.2: User-Specific ToDo List (`/todos?userId=...` or `/users/:id/todos`)**
  - Fetches and displays all ToDos assigned to the specified user.
  - Displays status indicators (e.g., Pending, Completed, Optimistic/Saving).
  - Provides empty state when a user has no assigned tasks.
- **F2.3: Optimistic Mutation & Rollback (Mandatory Requirement)**
  - When the user submits the ToDo creation form:
    1. **Immediate Cache Mutation:** An optimistic item with a temporary ID (`temp-${Date.now()}`) and pending indicator is immediately injected into TanStack Query's cache for the target user's query key.
    2. **Instant UI Render:** The new task appears at the top/bottom of the list without waiting for the network response.
    3. **Form Reset:** The form resets immediately for uninterrupted user productivity.
    4. **Network Execution:** The request executes against the API layer (with simulated 300-800ms latency).
    5. **On Success:** The server returns the confirmed ToDo item with its permanent ID. The cache replaces the optimistic item or invalidates the query to fetch the canonical record.
    6. **On Error / Failure:** The mutation catches the error, accesses the previous cache snapshot captured in `onMutate`, and restores the exact previous state (rollback).
    7. **Feedback:** A non-blocking alert / toast informs the user that task creation failed, explaining the reason and allowing retry.
- **F2.4: Chaos Mode / Network Failure Simulation Toggle**
  - An interactive UI switch in the application toolbar to toggle "Simulate Network Failure".
  - Allows evaluators and developers to test and verify the optimistic rollback behavior deterministically at any time without external proxy tools.

### 3.3 Feature Module 3: Cross-Cutting UI State (`packages/shared` + Jotai)
- **F3.1: Active Selected User Atom**
  - Atom storing `selectedUserId: string | null`.
  - Accessible across the app: the user dropdown in the header, ToDo creation form default assignee, and filtering views.
  - Demonstrates Jotai's purpose: surgical cross-cutting UI state without prop drilling or heavy context providers.
- **F3.2: ToDo Filter Atom**
  - Atom storing task view preferences (e.g., status filter: `ALL | PENDING | COMPLETED`, search query).
- **F3.3: Network Chaos Mode Atom**
  - Atom storing `isChaosEnabled: boolean` controlling API mock failure rates.

### 3.4 Application Shell & Routing (`apps/web` + TanStack Router)
- **F4.1: Route Structure**
  - `/__root`: Base layout containing top navigation bar, global user switcher, chaos simulation toggle, notification container, and outlet.
  - `/`: Dashboard / Home route with quick statistics, recent users, and quick links.
  - `/users`: User directory and user creation form.
  - `/users/$id`: User detail view showing user profile and direct link/embed to assigned tasks.
  - `/todos`: Master task list with filter by assignee and optimistic task creation.
- **F4.2: Type-Safe Navigation & Params**
  - Full TypeScript type safety for route params (`$id`) and search params (`userId`, `filter`).
  - Active route highlighting in the main navigation.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Monorepo Architecture & Isolation
- **Boundary Rule:** `packages/users` and `packages/todos` MUST NOT import each other directly.
- Shared domain types, contracts, UI components, and state atoms reside in `packages/shared`.
- The consumer application `apps/web` composes the features into routes.
- Turborepo coordinates build, dev, and lint pipelines.

### 4.2 Data Fetching & Caching (TanStack Query v5)
- Standardized query key factory to prevent cache key collisions.
- Explicit query configuration: `staleTime: 60_000` (1 min), `gcTime: 300_000` (5 mins).
- Clean separation between API client functions and React custom hooks (`useUser`, `useCreateTodo`, etc.).

### 4.3 Form Validation & User Guidance
- Form schemas defined via **Zod**.
- Immediate inline field errors on blur/submit with clear descriptions (e.g., "Username must be at least 3 characters").
- Accessible labels, `aria-invalid`, and `aria-describedby` linking error text to inputs.

### 4.4 Accessibility (a11y) Standards
- WCAG 2.1 Level AA conformance.
- Semantic HTML: `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<form>`.
- Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-offset-2`).
- Accessible names for interactive elements (`aria-label`, `<label htmlFor="...">`).
- Live regions (`role="status"`, `aria-live="polite"`) for optimistic updates and toast notifications.

### 4.5 Styling & Design System
- Built with **TailwindCSS** utility classes.
- Consistent color palette: Slate neutrals, Indigo brand primary, Emerald success, Rose error/destructive, Amber pending/warning.
- Mobile-first responsive layout (collapsible sidebars / stacked grids on small viewports).

---

## 5. Deliverables & Documentation Plan

1. **Working Monorepo Source Code:**
   - Turborepo configuration (`turbo.json`, `package.json`, `pnpm-workspace.yaml`).
   - `apps/web`: React + Vite + TanStack Router application.
   - `packages/users`: Feature package for users.
   - `packages/todos`: Feature package for todos with optimistic update.
   - `packages/shared`: Shared types, UI components, mock database, Jotai atoms.
2. **Comprehensive README:**
   - Architectural decisions and trade-offs.
   - Justification for monorepo package splits and boundaries.
   - Installation and local development instructions.
3. **Written Reflection:**
   - **Performance Considerations:** Query cache strategy, re-render avoidance with Jotai, route code-splitting with TanStack Router.
   - **Testing Strategy:** Production testing pyramid (Unit, Integration, Component, E2E), mocking strategy, and verification of optimistic rollback.
4. **`ai-journey/` Documentation:**
   - Master AI journey document detailing prompts, skills, MCP servers used, evaluation of outputs, and explicit override decisions.

---

## 6. Explicit Non-Requirements (Out of Scope)
- No real cloud backend (in-memory mock API client with localStorage persistence is required).
- No production CI/CD deployment pipelines.
- No authentication or authorization flows.
- No heavy tooling or micro-frontend runtimes.
- No exhaustive 100% test coverage (strategy outline in reflection is the evaluation requirement).
