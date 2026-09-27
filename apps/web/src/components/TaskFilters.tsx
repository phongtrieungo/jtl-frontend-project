import { useEffect, useState } from 'react';
import { Button, Card, CardContent, type UserSummary } from '@todo/shared';
import type { TodoSortOrder, TodoStatusFilter } from '@todo/todos';

export interface TaskFiltersProps {
  readonly users: readonly UserSummary[];
  readonly userId?: string;
  readonly status: TodoStatusFilter;
  readonly query: string;
  readonly sort: TodoSortOrder;
  readonly onUserChange: (userId: string | undefined) => void;
  readonly onStatusChange: (status: TodoStatusFilter) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSortChange: (sort: TodoSortOrder) => void;
  readonly onClear: () => void;
}

const controlClassName = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2';

export function TaskFilters({
  users,
  userId,
  status,
  query,
  sort,
  onUserChange,
  onStatusChange,
  onQueryChange,
  onSortChange,
  onClear,
}: TaskFiltersProps): JSX.Element {
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    if (searchInput === query) return undefined;
    const timeoutId = window.setTimeout(() => onQueryChange(searchInput), 300);
    return () => window.clearTimeout(timeoutId);
  }, [onQueryChange, query, searchInput]);

  return <Card>
    <CardContent className="p-5">
      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="sr-only">Task filters</legend>
        <label className="block text-sm font-medium text-slate-700" htmlFor="task-assignee">
          Assignee
          <select id="task-assignee" className={controlClassName} value={userId ?? ''} onChange={(event) => onUserChange(event.target.value || undefined)}>
            <option value="">Choose an assignee</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700" htmlFor="task-status">
          Status
          <select id="task-status" className={controlClassName} value={status} onChange={(event) => onStatusChange(event.target.value as TodoStatusFilter)}>
            <option value="all">All tasks</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700" htmlFor="task-search">
          Search tasks
          <input id="task-search" type="search" className={controlClassName} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by title" />
        </label>
        <label className="block text-sm font-medium text-slate-700" htmlFor="task-sort">
          Sort by
          <select id="task-sort" className={controlClassName} value={sort} onChange={(event) => onSortChange(event.target.value as TodoSortOrder)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title-asc">Title A–Z</option>
          </select>
        </label>
      </fieldset>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClear}>Clear filters</Button>
      </div>
    </CardContent>
  </Card>;
}
