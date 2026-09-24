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
| **Sprint 4** | User Feature Module (`packages/users`) | Pending | | Planned |
| **Sprint 5** | ToDo Feature Module (`packages/todos`) | Pending | | Planned |
| **Sprint 6** | Shippable Web App Shell (`apps/web`) | Pending | | Planned |
| **Sprint 7** | Reflections, AI Journey & README | Pending | | Planned |


