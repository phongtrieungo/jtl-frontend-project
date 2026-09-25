import { createRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { UserCreateForm } from '@todo/users';
import { TodoCreateForm, TodoList } from '@todo/todos';
import { Route as rootRoute } from './__root';
const todosSearchSchema = z.object({ userId: z.string().optional() });
export const Route = createRoute({ getParentRoute: () => rootRoute, path: '/todos', validateSearch: (search) => todosSearchSchema.parse(search), component: TodosPage });
function TodosPage() {
  const { userId } = Route.useSearch();
  return <div className="space-y-8"><header><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Task board</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Tasks</h1><p className="mt-2 text-slate-600">Create and track work for each person.</p></header>{userId ? <><TodoCreateForm userId={userId} /><TodoList userId={userId} /></> : <div className="space-y-6"><p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">Choose a user from the header to see their tasks, or add a person to get started.</p><UserCreateForm /></div>}</div>;
}
