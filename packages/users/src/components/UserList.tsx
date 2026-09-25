import { Badge, Button, Card, CardContent, Spinner, type User } from '@todo/shared';
import { useUsers } from '../hooks/useUsers';

export interface UserListProps {
  activeUserId?: string | null;
  onSelectUser?: (user: User) => void;
  onViewUser?: (user: User) => void;
}

export function UserList({ activeUserId, onSelectUser, onViewUser }: UserListProps) {
  const { data: users, isPending, isError, error, refetch } = useUsers();

  if (isPending) return <div role="status" className="flex justify-center p-8"><Spinner label="Loading users" /></div>;
  if (isError) return <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error.message || 'Unable to load users.'} <Button variant="outline" size="sm" className="ml-2" onClick={() => void refetch()}>Try again</Button></div>;
  if (!users?.length) return <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No users yet. Create a user to get started.</p>;

  return (
    <ul aria-label="User directory" className="grid gap-3 sm:grid-cols-2">
      {users.map((user) => (
        <li key={user.id}>
          <Card className="h-full p-5">
            <CardContent className="flex h-full flex-col gap-4 p-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{user.username}</h3>
                  <p className="mt-1 break-all text-xs text-slate-500">ID: {user.id}</p>
                  <p className="mt-1 text-xs text-slate-500">Created {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                {activeUserId === user.id && <Badge variant="indigo">Active</Badge>}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="text-sm text-slate-600">{user.taskCount ?? 0} tasks</span>
                <div className="flex gap-2">
                  {onSelectUser && <Button size="sm" variant="outline" onClick={() => onSelectUser(user)} aria-pressed={activeUserId === user.id}>Select</Button>}
                  {onViewUser && <Button size="sm" variant="ghost" onClick={() => onViewUser(user)}>View profile</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
