import { Card, CardContent, Spinner } from '@todo/shared';
import { useUsers } from '../hooks/useUsers';
export function UserList() {
  const { data: users, isPending, isError } = useUsers();
  if (isPending) return <div role="status" className="flex justify-center p-8"><Spinner label="Loading users" /></div>;
  if (isError) return <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Unable to load users. Refresh the page to try again.</p>;
  if (!users?.length) return <Card><CardContent className="p-8 text-center text-sm text-slate-500">No users yet. Add the first profile above.</CardContent></Card>;
  return <ul aria-label="Users" className="grid gap-3 sm:grid-cols-2">{users.map((user) => <li key={user.id}><a href={`/users/${encodeURIComponent(user.id)}`} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"><span className="font-semibold text-slate-900">{user.username}</span><span className="mt-1 block text-sm text-slate-500">{user.taskCount ?? 0} tasks</span></a></li>)}</ul>;
}
