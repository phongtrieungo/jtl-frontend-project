import { Button, Card, CardContent, Spinner, type User } from "@todo/shared";
import type { ReactNode } from "react";
import { useUsers } from "../hooks/useUsers";

export interface UserLinkRenderProps {
  user: User;
  children: ReactNode;
  className: string;
}

export interface UserListProps {
  renderUserLink: (props: UserLinkRenderProps) => ReactNode;
}

export function UserList({ renderUserLink }: UserListProps) {
  const { data: users, isPending, isError, isFetching, refetch } = useUsers();
  if (isPending)
    return (
      <div className="flex justify-center p-8">
        <Spinner label="Loading users" />
      </div>
    );
  if (isError)
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
      >
        <p>Unable to load users.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={isFetching}
          onClick={() => void refetch()}
        >
          Try again
        </Button>
      </div>
    );
  if (!users?.length)
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-slate-500">
          No users yet. Add the first profile above.
        </CardContent>
      </Card>
    );
  return (
    <ul aria-label="Users" className="grid gap-3 sm:grid-cols-2">
      {users.map((user) => (
        <li key={user.id}>
          {renderUserLink({
            user,
            className:
              "block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
            children: (
              <>
                <span className="font-semibold text-slate-900">
                  {user.username}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {user.taskCount ?? 0} tasks
                </span>
              </>
            ),
          })}
        </li>
      ))}
    </ul>
  );
}
