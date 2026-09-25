import { createRoute } from '@tanstack/react-router';
import { UserDetailCard } from '@todo/users';
import { TodoList } from '@todo/todos';
import { Route as rootRoute } from '../__root';
export const Route = createRoute({ getParentRoute: () => rootRoute, path: '/users/$id', component: UserDetailPage });
function UserDetailPage() { const { id } = Route.useParams(); return <div className="space-y-6"><header><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Profile</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Person details</h1></header><UserDetailCard userId={id} /><section aria-labelledby="assigned-tasks"><h2 id="assigned-tasks" className="mb-3 text-lg font-semibold text-slate-900">Assigned tasks</h2><TodoList userId={id} /></section></div>; }
