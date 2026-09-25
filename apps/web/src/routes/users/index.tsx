import { createRoute } from '@tanstack/react-router';
import { UserCreateForm, UserList } from '@todo/users';
import { Route as rootRoute } from '../__root';
export const Route = createRoute({ getParentRoute: () => rootRoute, path: '/users', component: UsersPage });
function UsersPage() { return <div className="space-y-8"><header><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Directory</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">People</h1><p className="mt-2 text-slate-600">Manage the people and profiles connected to your work.</p></header><UserCreateForm /><section aria-labelledby="people-heading" className="space-y-4"><h2 id="people-heading" className="text-lg font-semibold text-slate-900">All people</h2><UserList /></section></div>; }
