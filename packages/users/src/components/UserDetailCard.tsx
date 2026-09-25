import { Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@todo/shared';
import { useUser } from '../hooks/useUser';
export function UserDetailCard({ userId }: { userId: string }) {
  const { data: user, isPending, isError } = useUser(userId);
  if (isPending) return <div role="status" className="flex justify-center p-8"><Spinner label="Loading profile" /></div>;
  if (isError || !user) return <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700">This user could not be found. <a href="/users" className="underline">Return to users</a>.</div>;
  return <Card><CardHeader><CardTitle>{user.username}</CardTitle><CardDescription>User profile</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-slate-600">{user.taskCount ?? 0} assigned tasks</p><a className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" href={`/todos?userId=${encodeURIComponent(user.id)}`}>View tasks</a></CardContent></Card>;
}
