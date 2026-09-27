import { Link } from '@tanstack/react-router';
import type { TaskInsightsResult, TodoStatusFilter } from '@todo/todos';

const focus = 'rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2';
const panel = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';

interface DashboardInsightsProps {
  users: readonly { id: string; username: string }[];
  tasks: TaskInsightsResult;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function DashboardInsights({ users, tasks, isPending, isError, onRetry }: DashboardInsightsProps): JSX.Element {
  const { insights } = tasks;
  const metrics: { label: string; value: string | number; status: TodoStatusFilter }[] = [
    { label: 'Total tasks', value: insights.total, status: 'all' },
    { label: 'Active tasks', value: insights.active, status: 'active' },
    { label: 'Completed tasks', value: insights.completed, status: 'completed' },
    { label: 'Completion rate', value: `${insights.completionRate}%`, status: 'completed' },
  ];
  const unavailable = isError || isPending;
  const username = (id: string): string => users.find((user) => user.id === id)?.username ?? 'Unknown user';
  return <section aria-labelledby="overview-heading" className="space-y-4">
    <div><h2 id="overview-heading" className="text-lg font-semibold text-slate-900">Workspace overview</h2>
      <p className="text-sm text-slate-600">Progress across all people. Recent tasks are ordered by creation date.</p></div>
    {isError && <div role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-800">Workspace insights are unavailable. Some data could not be loaded. <button type="button" onClick={onRetry} className={`${focus} px-2 font-semibold underline`}>Try again</button></div>}
    {isPending && !isError && <p role="status" className="sr-only">Loading workspace insights</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy={isPending}>
      {metrics.map((metric) => <div key={metric.label} className={`${panel} min-h-32`}>
        {unavailable ? <><p className="text-sm text-slate-600">{metric.label}</p>{isError ? <p className="mt-2 text-slate-600">Unavailable</p> : <div aria-hidden="true" className="mt-3 h-9 w-20 animate-pulse rounded bg-slate-200" />}</> :
          <Link to="/todos" search={{ status: metric.status, query: '', sort: 'newest' }} className={`${focus} block`}>
            <p className="text-sm text-slate-600">{metric.label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</p>
          </Link>}
      </div>)}
    </div>
    <p role="status" className="min-h-5 text-sm text-amber-800">{!unavailable && insights.saving ? 'Saving changes… Insights include pending updates.' : ''}</p>
    <div className="grid gap-4 lg:grid-cols-2">
      <section aria-labelledby="recent-heading" aria-busy={isPending} className={`${panel} min-h-96`}>
        <h3 id="recent-heading" className="font-semibold text-slate-900">Recent tasks</h3>
        {unavailable ? <ListPlaceholder error={isError} /> : insights.recent.length ? <ul className="mt-4 divide-y divide-slate-100">
          {insights.recent.map((todo) => <li key={todo.id} className="py-3">
            <Link to="/todos" search={{ userId: todo.assigneeId, status: 'all', query: todo.title, sort: 'newest' }} className={`${focus} block p-1`}>
              <p className="break-words font-medium text-indigo-700">{todo.title}</p>
              <p className="mt-1 text-sm text-slate-600">{username(todo.assigneeId)} · {todo.completed ? 'Completed' : 'Active'}{todo.isOptimistic ? ' · Saving…' : ''}</p>
            </Link>
          </li>)}
        </ul> : <p className="mt-4 text-slate-600">No tasks yet. Open the task board and choose a person to create their first task.</p>}
      </section>
      <section aria-labelledby="attention-heading" aria-busy={isPending} className={`${panel} min-h-96`}>
        <h3 id="attention-heading" className="font-semibold text-slate-900">Users needing attention</h3>
        <p className="mt-1 text-sm text-slate-600">People with the most active tasks, up to five.</p>
        {unavailable ? <ListPlaceholder error={isError} /> : insights.attention.length ? <ul className="mt-4 divide-y divide-slate-100">
          {insights.attention.map(({ userId, active }) => <li key={userId} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <Link to="/users/$id" params={{ id: userId }} className={`${focus} p-1 font-medium text-indigo-700`}>{username(userId)}</Link>
            <Link to="/todos" search={{ userId, status: 'active', query: '', sort: 'newest' }} className={`${focus} p-1 text-sm text-indigo-700`}>{active} active {active === 1 ? 'task' : 'tasks'}{' '}<span className="sr-only"> for {username(userId)}</span></Link>
          </li>)}
        </ul> : <p className="mt-4 text-slate-600">{users.length ? 'No active tasks. Everyone is caught up.' : 'No people yet. Add a person to get started.'}</p>}
      </section>
    </div>
  </section>;
}

function ListPlaceholder({ error }: { error: boolean }): JSX.Element {
  return error ? <p className="mt-4 text-slate-600">This list is unavailable until workspace data loads.</p> :
    <div aria-hidden="true" className="mt-4 space-y-4">{[0, 1, 2, 3, 4].map((key) => <div key={key} className="h-12 animate-pulse rounded bg-slate-200" />)}</div>;
}
