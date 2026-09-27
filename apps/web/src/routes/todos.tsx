import { createRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { UserCreateForm, useUsers } from '@todo/users';
import { TodoCreateForm, TodoList, defaultTodoDiscoveryFilters } from '@todo/todos';
import { Route as rootRoute } from './__root';

import { TaskFilters } from '../components/TaskFilters';

const todosSearchSchema = z.object({
  userId: z.string().trim().min(1).optional(),
  status: z.enum(['all', 'active', 'completed']).catch('all'),
  query: z.string().trim().max(100).catch(''),
  sort: z.enum(['newest', 'oldest', 'title-asc']).catch('newest'),
});

export const Route = createRoute({ getParentRoute: () => rootRoute, path: '/todos', validateSearch: (search) => todosSearchSchema.parse(search), component: TodosPage });

function TodosPage(): JSX.Element {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: users = [] } = useUsers();
  const filters = { status: search.status, query: search.query, sort: search.sort };

  const updateSearch = (changes: Partial<typeof search>): void => {
    void navigate({ to: '/todos', search: (current) => ({ ...current, ...changes }) });
  };
  const clearFilters = (): void => {
    updateSearch(defaultTodoDiscoveryFilters);
  };

  return <div className="space-y-8">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Task board</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Tasks</h1><p className="mt-2 text-slate-600">Find, filter, and share a focused view of each person’s work.</p></header>
    <TaskFilters users={users} userId={search.userId} {...filters} onUserChange={(userId) => updateSearch({ userId })} onStatusChange={(status) => updateSearch({ status })} onQueryChange={(query) => updateSearch({ query })} onSortChange={(sort) => updateSearch({ sort })} onClear={clearFilters} />
    {search.userId ? <><TodoCreateForm userId={search.userId} /><TodoList userId={search.userId} filters={filters} onClearFilters={clearFilters} /></> : <div className="space-y-6"><p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">Choose an assignee above to see their tasks, or add a person to get started.</p><UserCreateForm /></div>}
  </div>;
}
