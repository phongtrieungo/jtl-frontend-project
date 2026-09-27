import type { Todo } from '@todo/shared';

/** Task-only derivation; user names are composed by the application. */
export function deriveTaskInsights(todos: readonly Todo[]) {
  const completed = todos.filter((todo) => todo.completed).length;
  const activeByUser = new Map<string, number>();
  for (const todo of todos) {
    if (!todo.completed) activeByUser.set(todo.assigneeId, (activeByUser.get(todo.assigneeId) ?? 0) + 1);
  }
  return {
    total: todos.length,
    active: todos.length - completed,
    completed,
    completionRate: todos.length ? Math.round(completed / todos.length * 100) : 0,
    saving: todos.some((todo) => todo.isOptimistic),
    recent: [...todos].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id)).slice(0, 5),
    attention: [...activeByUser].map(([userId, active]) => ({ userId, active }))
      .sort((a, b) => b.active - a.active || a.userId.localeCompare(b.userId)).slice(0, 5),
  };
}
