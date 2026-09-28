import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
  type User,
} from "@todo/shared";
import type { ReactNode } from "react";
import { useUser } from "../hooks/useUser";

interface NavigationRenderProps {
  children: ReactNode;
  className: string;
}

export interface UserTasksLinkRenderProps extends NavigationRenderProps {
  user: User;
}

export interface UserDetailCardProps {
  userId: string;
  renderTasksLink: (props: UserTasksLinkRenderProps) => ReactNode;
  renderUsersLink: (props: NavigationRenderProps) => ReactNode;
}

export function UserDetailCard({
  userId,
  renderTasksLink,
  renderUsersLink,
}: UserDetailCardProps) {
  const {
    data: user,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useUser(userId);
  if (isPending)
    return (
      <div className="flex justify-center p-8">
        <Spinner label="Loading profile" />
      </div>
    );
  if (isError)
    return (
      <div
        role="alert"
        className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700"
      >
        <p>Unable to load this user.</p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isFetching}
            onClick={() => void refetch()}
          >
            Try again
          </Button>
          {renderUsersLink({
            className:
              "inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
            children: "Return to users",
          })}
        </div>
      </div>
    );
  if (!user)
    return (
      <div
        role="alert"
        className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700"
      >
        This user could not be found.{" "}
        {renderUsersLink({
          className:
            "rounded underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
          children: "Return to users",
        })}
        .
      </div>
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.username}</CardTitle>
        <CardDescription>User profile</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          {user.taskCount ?? 0} assigned tasks
        </p>
        {renderTasksLink({
          user,
          className:
            "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
          children: "View tasks",
        })}
      </CardContent>
    </Card>
  );
}
