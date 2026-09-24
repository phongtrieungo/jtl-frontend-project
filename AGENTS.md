# Agent Guidance & Repository Directives

## 1. Project Context & Purpose
This repository is a **Senior Frontend Engineer Take-Home Project** built as a **Turborepo monorepo** using **React, TypeScript, Vite, TanStack Router, TanStack Query, Jotai, and TailwindCSS**.

Every agent interaction must align with the architecture, product requirements, and development plan established in:
- **Product Requirements Document:** [docs/prd.md](file:///Users/ngotrieuphong/Projects/jtl/todo/docs/prd.md)
- **Architecture Specification:** [docs/architecture.md](file:///Users/ngotrieuphong/Projects/jtl/todo/docs/architecture.md)
- **Sprint Planning & User Stories:** [docs/sprint-planning.md](file:///Users/ngotrieuphong/Projects/jtl/todo/docs/sprint-planning.md)
- **Specialized Skills:**
  - Coding Standards: [.agents/skills/frontend-coding/SKILL.md](file:///Users/ngotrieuphong/Projects/jtl/todo/.agents/skills/frontend-coding/SKILL.md)
  - UI/UX & A11y Standards: [.agents/skills/frontend-design/SKILL.md](file:///Users/ngotrieuphong/Projects/jtl/todo/.agents/skills/frontend-design/SKILL.md)
  - Testing & Rollback Verification: [.agents/skills/frontend-testing/SKILL.md](file:///Users/ngotrieuphong/Projects/jtl/todo/.agents/skills/frontend-testing/SKILL.md)

---

## 2. Inviolable Architectural Rules

### Rule 1: Zero Sideways Package Dependencies
- `packages/users` MUST NEVER import from `packages/todos`.
- `packages/todos` MUST NEVER import from `packages/users`.
- Any type, utility, or component shared across features MUST be placed in `packages/shared`.
- The application container `apps/web` composes features into routes.

### Rule 2: Optimistic Mutation & Rollback Contract
For ToDo creation (`useCreateTodo`), the agent must strictly preserve:
1. `onMutate`: Cancel in-flight queries -> snapshot previous cache -> optimistically inject temporary item -> return snapshot context.
2. `onError`: Revert cache to snapshot -> display non-blocking error notification.
3. `onSettled`: Invalidate cache to reconcile with server state.

### Rule 3: Cross-Cutting State via Jotai
- Jotai atoms (`activeUserIdAtom`, `isChaosModeAtom`, `toastsAtom`) must only be used for ephemeral cross-cutting UI concerns.
- Never duplicate server cache data into Jotai; use TanStack Query for server state.

### Rule 4: Accessibility & Form Validation
- All forms must be validated via **Zod** with explicit inline error messages.
- Input elements must be tied to labels via `htmlFor`/`id` and error messages via `aria-describedby` and `aria-invalid`.
- All interactive controls must render a distinct focus ring on keyboard navigation.

### Rule 5: Dual-Mode API Adapter & Evaluator Independence
- The frontend must never strictly require `services/bff` to be running. If the .NET service is offline or uninstalled, the application must seamlessly fall back to the in-browser mock engine.
- All HTTP communication with `services/bff` (.NET 8 Minimal API) is mediated through `packages/shared`.

---

## 3. Working Procedure for Subsequent Prompts & Sprints

Whenever an agent receives a prompt to implement, modify, or review code in this repository:
1. **Identify the Target Sprint & Story:** Check `docs/sprint-planning.md` to identify which story is being tackled.
2. **Review the Respective Skill:** Consult `frontend-coding`, `frontend-design`, or `frontend-testing` before writing code.
3. **Verify Boundary Invariants:** Ensure that no cross-feature imports are introduced.
4. **Log the AI Interaction:** When completing a significant step or milestone, update `ai-journey/master-journey.md` with the prompt, action taken, and any developer override.
