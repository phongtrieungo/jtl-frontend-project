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
- **Testing:** Vitest, React Testing Library, and jsdom

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
| **`services/bff`** | Backend Service | **Ready for Sprint 3** | ASP.NET Core (.NET 10) Minimal API, REST endpoints (`/api/users`, `/api/todos`), concurrent collections in-memory store, Swagger/OpenAPI, and latency/chaos middleware. |
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

# Run build across all packages in topological order
pnpm build

# Run linter
pnpm lint
```

### Running the Application

```bash
# Mode 1: Zero-Dependency In-Browser Mock Engine (No .NET required)
pnpm dev

# Mode 2: Full-Stack with .NET 10 Minimal API BFF
pnpm dev:full
```

---

## 5. Core Architectural Highlights

1. **Optimistic Mutations with Verifiable Rollback:**
   - When creating a task, `useCreateTodo` injects the item into TanStack Query's cache immediately with an amber `Saving...` pulse badge.
   - The form resets instantly for uninterrupted productivity.
   - If the network request fails (or if the interactive **Chaos Mode** toggle is enabled), `onError` deterministically rolls back the cache to the pre-mutation snapshot and emits an accessible toast alert.
2. **Interactive Chaos Simulation Toggle:**
   - A dedicated UI toggle in the application header allows evaluators to simulate network/server 500 errors on demand to verify rollback behavior without proxy tools.
3. **Atomic Cross-Cutting State via Jotai:**
   - `activeUserIdAtom` stores the selected user and synchronizes context across the header, user directory, and task forms without prop drilling or heavy context providers.
4. **Dual-Mode Adapter with Auto-Fallback:**
   - `DualModeApiClient` connects to the ASP.NET Core .NET 10 BFF when available, but automatically catches network disconnections and transparently falls back to the in-browser mock engine so that evaluators never experience broken views.

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
- [ ] **Sprint 3:** .NET 10 Backend-for-Frontend Service (`services/bff`)
- [ ] **Sprint 4:** User Feature Package (`packages/users`)
- [ ] **Sprint 5:** ToDo Feature Package & Optimistic Mutation Engine (`packages/todos`)
- [ ] **Sprint 6:** Shippable Web Application Shell & TanStack Router (`apps/web`)
- [ ] **Sprint 7:** Production Reflections, AI Journey Artifacts & Final Polish
