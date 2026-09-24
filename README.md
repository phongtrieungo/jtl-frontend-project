# User & ToDo Management Platform

> **Senior Frontend Engineer Take-Home Assessment**  
> A Turborepo monorepo demonstrating production-grade architecture, strict package boundaries, resilient optimistic mutations, type-safe routing, atomic cross-cutting state, and an evaluator-first dual-mode backend adapter.

---

## 1. Quick Overview & Tech Stack

- **Monorepo Engine:** [Turborepo](https://turbo.build/repo) + [pnpm](https://pnpm.io/) workspaces
- **Web Application (`apps/web`):** React 18, TypeScript, Vite, [TanStack Router](https://tanstack.com/router)
- **Shared Core Library (`packages/shared`):** Centralized domain types, query key factories, Dual-Mode API client, in-browser mock engine, Jotai atoms, accessible UI kit primitives
- **Backend Service (`services/bff`):** ASP.NET Core (.NET 10) Minimal API with thread-safe in-memory store and latency/chaos simulation middleware
- **Data Fetching & Caching:** [TanStack Query v5](https://tanstack.com/query) with hierarchical query key factories
- **State Management:** [Jotai](https://jotai.org/) for atomic cross-cutting UI state (`activeUserIdAtom`, `isChaosActiveAtom`, `toastsAtom`)
- **Styling & Tokens:** TailwindCSS (Slate + Indigo palette)
- **Form Validation:** Zod with accessible inline error binding
- **Accessibility:** WCAG 2.1 AA compliant, semantic HTML, visible keyboard focus rings, ARIA contracts
- **Testing:** Vitest, React Testing Library, jsdom, and xUnit integration tests for the BFF

---

## 2. Monorepo Architecture & Package Boundaries

```
                              ┌────────────────┐
                              │    apps/web    │  (Composition & Routes)
                              └───────┬────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      ┌─────────────────────┐                   ┌─────────────────────┐
      │   packages/users    │                   │   packages/todos    │
      │   (User Domain)     │                   │   (Todo Domain)     │
      └──────────┬──────────┘                   └──────────┬──────────┘
                 │                                         │
                 │     NO SIDEWAYS DEPENDENCY ALLOWED     │
                 │     (users ⇎ todos: strictly isolated)  │
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │   packages/shared   │
                           │  (Dual-Mode Client, │
                           │  UI Kit, Atoms, DB) │
                           └──────────┬──────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │ (Dual-Mode Adapter Resolution)  │
                     ▼                                 ▼
         ┌───────────────────────┐         ┌───────────────────────┐
         │     services/bff      │         │  In-Browser Mock DB   │
         │  (ASP.NET Core .NET 10 │         │   (Zero-Dependency    │
         │     Minimal API)      │         │   Reviewer Fallback)  │
         └───────────────────────┘         └───────────────────────┘
```

### Boundary Guarantees:
- **Zero Sideways Imports (Rule 1):** `packages/users` and `packages/todos` never import each other directly. All shared domain contracts, cross-cutting state atoms, and UI primitives flow through `packages/shared`.
- **Decoupled Backend Service (Rule 5):** `services/bff` is a standalone .NET 10 service. Frontend interaction is mediated strictly over HTTP REST contracts defined in `packages/shared`.
- **Evaluator-First Dual-Mode Adapter:** Evaluators without the .NET SDK installed can run the complete frontend immediately with the in-browser mock engine (`pnpm dev`). Evaluators with .NET 10 can run the full-stack experience (`pnpm dev:full`).

---

## 3. Package & Service Directory Breakdown

| Path | Type | Status | Responsibilities |
| :--- | :--- | :--- | :--- |
| **`packages/shared`** | Core Library | **Ready (Sprint 2)** | Domain types, query keys (`userKeys`, `todoKeys`), Dual-Mode API Client, In-Browser Mock DB, Jotai atoms (`activeUserIdAtom`, `isChaosActiveAtom`, `toastsAtom`), UI primitives (`Button`, `Input`, `Card`, `Badge`, `Alert`, `Spinner`, `ToastViewport`). |
| **`services/bff`** | Backend Service | **Complete (Sprint 3)** | ASP.NET Core (.NET 10) Minimal API with health, user, todo, and chaos endpoints; seeded thread-safe in-memory stores; Swagger/OpenAPI; and latency/chaos middleware. Includes 24 xUnit integration tests. |
| **`packages/users`** | Feature Module | *Scheduled (Sprint 4)* | User schemas, TanStack Query hooks (`useUsers`, `useUser`, `useCreateUser`), user forms, profiles, and directory components. |
| **`packages/todos`** | Feature Module | *Scheduled (Sprint 5)* | ToDo schemas, optimistic mutation engine (`useCreateTodo`), task list, task rows, and status indicators. |
| **`apps/web`** | Web Application | *Scheduled (Sprint 6)* | TanStack Router file-based route tree, layout shell, active user switcher, chaos toggle, and backend status indicator. |

---

## 4. Getting Started & Local Development

### Prerequisites
- **Node.js:** `>= 18.0.0` (Tested on `v22.x`)
- **Package Manager:** `pnpm >= 9.x`
- **.NET SDK (Optional for Mock Mode):** `.NET 10.0 SDK` (only needed for `services/bff`)

### Installation
```bash
git clone https://github.com/phongtrieungo/jtl-frontend-project.git
cd jtl-frontend-project
pnpm install
```

### Verification & Testing
```bash
# Run typechecking across all packages
pnpm typecheck

# Run test suites across all packages
pnpm test

# Run the BFF integration tests (.NET 10)
dotnet test services/bff.tests/Bff.Tests.csproj

# Run build across all packages in topological order
pnpm build

# Run linter
pnpm lint
```

### Running the Application

```bash
# Mode 1: Zero-Dependency In-Browser Mock Engine (No .NET required)
pnpm dev

# Mode 2: Run the BFF in one terminal
dotnet run --project services/bff/bff.csproj -- --urls http://localhost:5000

# Then run the web workspace in another terminal
pnpm dev
```

The BFF is available at `http://localhost:5000`. Its health endpoint is `/api/health`; Swagger UI is available at `/swagger` in the Development environment. The web app is currently a shell, so the BFF runs independently until frontend composition is delivered in later sprints. The root `pnpm test` command runs JavaScript workspace tests; use the `dotnet test` command above for BFF coverage.

---

## 5. Sprint 03 BFF

The BFF targets .NET 10 and uses seeded `ConcurrentDictionary` stores, so no external database is needed. Its API includes:

- `GET /api/health`
- `GET /api/users`, `GET /api/users/{id}`, and `POST /api/users`
- `GET /api/todos?userId={id}`, `GET /api/todos/{id}`, `POST /api/todos`, `PUT /api/todos/{id}`, `PUT /api/todos/{id}/toggle`, and `DELETE /api/todos/{id}`
- `GET /api/chaos`, `POST /api/chaos`, and `POST /api/chaos/toggle`

Requests receive 200–400 ms of simulated latency by default. Send `X-Simulate-Chaos: true`, or enable server-side chaos through `/api/chaos`, to make mutating user and todo requests return a simulated 500 response. The integration tests use `X-Skip-Latency: true` to keep test runs fast.

The shared package provides the dual-mode API client and mock engine. The user and todo feature packages, optimistic mutation UI, and routed application experience are planned in Sprints 4–6; they are not yet wired into the current web shell.

---

## 6. Documentation & Specifications Index

All project specifications, agent directives, and development roadmaps are tracked under version control:

| Document | Path | Purpose |
| :--- | :--- | :--- |
| **Product Requirements (PRD)** | [docs/prd.md](docs/prd.md) | Exhaustive requirements, feature scope, NFRs, and evaluation alignment. |
| **System Architecture** | [docs/architecture.md](docs/architecture.md) | Detailed topology, .NET 10 BFF specification, sequence diagrams, and trade-offs. |
| **Sprint Planning Roadmap** | [docs/sprint-planning.md](docs/sprint-planning.md) | 7-sprint agile delivery plan with user stories and Gherkin acceptance criteria. |
| **Frontend Coding Skill** | [.agents/skills/frontend-coding/SKILL.md](.agents/skills/frontend-coding/SKILL.md) | TypeScript, boundary enforcement, query key factories, and optimistic update patterns. |
| **Frontend Design Skill** | [.agents/skills/frontend-design/SKILL.md](.agents/skills/frontend-design/SKILL.md) | Slate + Indigo design system, optimistic visual states, and WCAG AA guidelines. |
| **Frontend Testing Skill** | [.agents/skills/frontend-testing/SKILL.md](.agents/skills/frontend-testing/SKILL.md) | 4-layer testing pyramid and canonical Vitest/RTL optimistic rollback test recipes. |
| **Backend .NET Skill** | [.agents/skills/backend-dotnet/SKILL.md](.agents/skills/backend-dotnet/SKILL.md) | ASP.NET Core .NET 10 Minimal API, thread-safe in-memory stores, chaos/latency middleware. |
| **Agent Directives** | [AGENTS.md](AGENTS.md) / [GEMINI.md](GEMINI.md) | Continuous instructions keeping all agent operations aligned to specifications. |
| **AI Journey Log** | [ai-journey/master-journey.md](ai-journey/master-journey.md) | Audit trail of prompts, skills, decisions, and engineer overrides. |

---

## 7. Development Roadmap (7 Sprints)

- [x] **Sprint 0:** Product Requirements, Architecture, Skills & Sprint Planning Baseline
- [x] **Sprint 1:** Monorepo Foundation & Tooling Setup (`turbo.json`, `pnpm-workspace.yaml`, configs)
- [x] **Sprint 2:** Core Domain, Dual-Mode API Adapter & Shared UI Kit (`packages/shared`)
- [x] **Sprint 3:** .NET 10 Backend-for-Frontend Service (`services/bff`)
- [ ] **Sprint 4:** User Feature Package (`packages/users`)
- [ ] **Sprint 5:** ToDo Feature Package & Optimistic Mutation Engine (`packages/todos`)
- [ ] **Sprint 6:** Shippable Web Application Shell & TanStack Router (`apps/web`)
- [ ] **Sprint 7:** Production Reflections, AI Journey Artifacts & Final Polish
