import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner, type User } from '@todo/shared';
import { useUser } from '../hooks/useUser';

export interface UserDetailCardProps {
  user?: User;
  userId?: string;
  onViewTasks?: (user: User) => void;
}

export function UserDetailCard({ user: providedUser, userId, onViewTasks }: UserDetailCardProps) {
  const query = useUser(providedUser ? '' : userId ?? '');
  const user = providedUser ?? query.data;

  if (!providedUser && !userId) return <div role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">User not found.</div>;
  if (!user && query.isPending) return <div role="status" className="flex justify-center p-8"><Spinner label="Loading user profile" /></div>;
  if (!user && query.isError) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">User profile could not be loaded: {query.error.message}</div>;
  if (!user) return <div role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">User not found.</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div><CardDescription>User profile</CardDescription><CardTitle className="mt-1">{user.username}</CardTitle></div>
          <Badge variant="indigo">{user.taskCount ?? 0} tasks</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-medium text-slate-500">User ID</dt><dd className="mt-1 break-all text-slate-900">{user.id}</dd></div>
          <div><dt className="font-medium text-slate-500">Joined</dt><dd className="mt-1 text-slate-900">{new Date(user.createdAt).toLocaleString()}</dd></div>
        </dl>
        {onViewTasks && <Button onClick={() => onViewTasks(user)}>View tasks</Button>}
      </CardContent>
    </Card>
  );
}
