---
name: frontend-design
description: UI/UX design guidelines, TailwindCSS styling tokens, component design patterns, accessibility (WCAG 2.1 AA) standards, and UX feedback states (optimistic pending indicators, skeletons, rollback alerts) for this project.
---

# Frontend Design & Accessibility Guidelines

This skill guides the visual styling, layout structure, interaction design, and accessibility implementation across all packages and applications in this repository.

---

## 1. Visual Hierarchy & Design System Foundations

### 1.1 Color Palette & Token Semantics
The design uses a clean, modern, and accessible palette built upon TailwindCSS color ramps:

- **Neutral Surface / Slate:**
  - Page Background: `bg-slate-50`
  - Card & Container Surface: `bg-white`
  - High-Contrast Text: `text-slate-900`
  - Subdued / Secondary Text: `text-slate-500` (meets 4.5:1 contrast against white)
  - Borders: `border-slate-200`
- **Primary Brand / Indigo:**
  - Primary Action / Buttons: `bg-indigo-600 hover:bg-indigo-700 text-white`
  - Interactive Accents: `text-indigo-600`, `ring-indigo-500`
- **Success / Emerald:**
  - Completed items, successful submissions: `bg-emerald-50 text-emerald-700 border-emerald-200`
- **Destructive / Error / Rose:**
  - Validation errors, failed mutations, rollback alerts: `bg-rose-50 text-rose-700 border-rose-200`
- **Warning / Optimistic Pending / Amber:**
  - Pending mutations, chaos mode active indicator: `bg-amber-50 text-amber-800 border-amber-200`

### 1.2 Elevation & Container Shapes
- Cards: `rounded-xl border border-slate-200 bg-white p-6 shadow-sm`
- Buttons: `inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors`
- Inputs: `w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`

---

## 2. Interaction Design & UX Resilience States

### 2.1 Optimistic UI Visual Language
When an item is added optimistically before server confirmation, the user must receive clear, non-jarring feedback that the item is currently syncing:

1. **Immediate Placement:** Insert the item into the list immediately with standard dimensions.
2. **Visual Status Badge:**
   - Display a subtle badge: `<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 animate-pulse">Saving...</span>`.
3. **Subdued Opacity:**
   - Apply `opacity-80` to the item card while `isOptimistic === true`.
4. **Interaction Lock:**
   - Disable delete or toggle buttons on optimistic items until the server responds and assigns a permanent ID.
5. **Settled Transition:**
   - When the server confirms the creation, smoothly remove the pending badge and restore full opacity.

### 2.2 Rollback & Error Communication
When a mutation fails (e.g. during chaos mode or an API outage):
1. **Immediate Removal:** The optimistic item is cleanly removed from the DOM via query rollback.
2. **Accessible Toast / Alert:**
   - Render a high-priority alert with `role="alert"`:
     > *"Unable to save task '[Task Title]'. Network error occurred. Your changes were reverted."*
3. **Retry Action:** Include an accessible "Try Again" or "Dismiss" action within the alert.

### 2.3 Loading Skeletons vs Spinners
- For page navigation and content lists, use animated skeleton placeholders (`animate-pulse bg-slate-200 rounded`) matching the shape of cards instead of blocking full-page spinners.
- For form submission buttons, use an inline spinner (`animate-spin h-4 w-4 mr-2`) while keeping the button text visible to avoid layout shifts.

---

## 3. Accessibility (WCAG 2.1 AA) Standard

### 3.1 Semantic HTML Structure
- Always use proper Landmark elements:
  - `<header role="banner">` for top navigation.
  - `<nav aria-label="Main Navigation">` for primary links.
  - `<main id="main-content">` for primary view content.
  - `<section aria-labelledby="...">` for distinct logical page sections.
  - `<form aria-label="...">` with explicit submit buttons.

### 3.2 Form Accessibility Contract
Every form control must comply with the following:
```tsx
<div className="space-y-1.5">
  <label htmlFor="todo-title" className="block text-sm font-medium text-slate-700">
    Task Title
  </label>
  <input
    id="todo-title"
    name="title"
    type="text"
    aria-invalid={Boolean(errors.title)}
    aria-describedby={errors.title ? "todo-title-error" : undefined}
    className="border rounded-lg px-3 py-2 text-sm ..."
  />
  {errors.title && (
    <p id="todo-title-error" role="alert" className="text-sm text-rose-600 font-medium">
      {errors.title}
    </p>
  )}
</div>
```

### 3.3 Keyboard Navigation & Focus Management
- **Visible Focus Ring:** All interactive elements (`<button>`, `<a>`, `<input>`, `<select>`) must include:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2`
- **Tab Sequence:** Natural DOM tab order must never be disrupted with positive `tabIndex`.
- **Skip Link:** Provide a `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>` link at the root of `apps/web`.

### 3.4 Live Regions & Screen Reader Feedback
- Use an `aria-live="polite"` region for notifying users of newly added items and rollbacks.
- Use `role="status"` for non-critical confirmations, and `role="alert"` for mutation errors.
