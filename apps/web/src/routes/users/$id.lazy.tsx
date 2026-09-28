import { Link } from '@tanstack/react-router';
import { TodoList } from '@todo/todos';
import { UserDetailCard } from '@todo/users';
import { Route } from './$id';

export function UserDetailPage(): JSX.Element {
  const { id } = Route.useParams();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Profile</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Person details</h1>
      </header>
      <UserDetailCard
        userId={id}
        renderUsersLink={({ children, className }) => <Link to="/users" className={className}>{children}</Link>}
        renderTasksLink={({ user, children, className }) => (
          <Link to="/todos" search={{ userId: user.id, status: 'all', query: '', sort: 'newest' }} className={className}>{children}</Link>
        )}
      />
      <section aria-labelledby="assigned-tasks">
        <h2 id="assigned-tasks" className="mb-3 text-lg font-semibold text-slate-900">Assigned tasks</h2>
        <TodoList userId={id} />
      </section>
    </div>
  );
}
