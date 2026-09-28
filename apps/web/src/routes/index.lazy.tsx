import { Link } from '@tanstack/react-router';
import { useTaskInsights } from '@todo/todos';
import { useUsers } from '@todo/users';
import { DashboardInsights } from '../components/DashboardInsights';

export function DashboardPage(): JSX.Element {
  const users = useUsers();
  const tasks = useTaskInsights((users.data ?? []).map((user) => user.id));
  return <div className="space-y-8">
    <section className="rounded-2xl bg-slate-900 px-6 py-10 text-white sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-300">Your workspace</p>
      <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Make room for the work that matters.</h1>
      <p className="mt-3 max-w-xl text-slate-300">Keep your team and tasks moving in one clear place.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/todos" search={{ status: 'all', query: '', sort: 'newest' }} className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Open tasks</Link>
        <Link to="/users" className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Manage people</Link>
      </div>
    </section>
    <DashboardInsights users={users.data ?? []} tasks={tasks} isPending={users.isPending || tasks.isPending}
      isError={users.isError || tasks.isError} onRetry={() => { void users.refetch(); tasks.retry(); }} />
  </div>;
}
