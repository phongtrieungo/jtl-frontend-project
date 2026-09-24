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

---

## 3. Sprint Execution Tracking Log

| Sprint | Story / Topic | Key AI Prompts / Tools | Output Evaluation & Overrides | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Sprint 0** | PRD, Architecture, Skills & Sprint Plan | `write_to_file`, Markdown generation | Enforced strict Gherkin acceptance criteria and zero sideways dependencies. | **Done** |
| **Sprint 1** | Monorepo & Tooling Setup | Pending | | Planned |
| **Sprint 2** | Shared Package & In-Memory Engine | Pending | | Planned |
| **Sprint 3** | User Feature Module | Pending | | Planned |
| **Sprint 4** | ToDo Feature Module (Optimistic UI) | Pending | | Planned |
| **Sprint 5** | Shippable App & TanStack Router | Pending | | Planned |
| **Sprint 6** | Jotai Cross-Cutting & Chaos Mode | Pending | | Planned |
| **Sprint 7** | Final README, Reflections & Review | Pending | | Planned |
