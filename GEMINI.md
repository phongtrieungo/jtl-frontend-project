# Antigravity Instructions for User & ToDo Monorepo

Refer to [AGENTS.md](file:///Users/ngotrieuphong/Projects/jtl/todo/AGENTS.md) for full context.

## Summary Directives:
- **Monorepo Structure:** Turborepo with `apps/web`, `packages/users`, `packages/todos`, and `packages/shared`.
- **Strict Boundary:** `packages/users` and `packages/todos` must NOT depend on each other. Shared logic lives in `packages/shared`.
- **Optimistic Updates:** Must include full `onMutate` snapshotting and `onError` rollback for ToDo creation.
- **Skills Reference:**
  - Coding: [.agents/skills/frontend-coding/SKILL.md](file:///Users/ngotrieuphong/Projects/jtl/todo/.agents/skills/frontend-coding/SKILL.md)
  - Design & A11y: [.agents/skills/frontend-design/SKILL.md](file:///Users/ngotrieuphong/Projects/jtl/todo/.agents/skills/frontend-design/SKILL.md)
  - Testing & Recipes: [.agents/skills/frontend-testing/SKILL.md](file:///Users/ngotrieuphong/Projects/jtl/todo/.agents/skills/frontend-testing/SKILL.md)
- **Sprint Plan:** Refer to [docs/sprint-planning.md](file:///Users/ngotrieuphong/Projects/jtl/todo/docs/sprint-planning.md).
