import { Button, Card, CardContent, Spinner } from '@todo/shared';
import { useTodosByUser } from '../hooks/useTodosByUser';
import { TodoItemRow } from './TodoItemRow';

export interface TodoListProps {
  userId: string;
}

export function TodoList({ userId }: TodoListProps) {
  const { data: todos, isPending, isError, error, refetch } = useTodosByUser(userId);

  if (!userId) return <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Select a user to view and create tasks.</p>;
  if (isPending) return <div role="status" className="flex justify-center p-8"><Spinner label="Loading tasks" /></div>;
  if (isError) return <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error.message || 'Unable to load tasks.'} <Button variant="outline" size="sm" className="ml-2" onClick={() => void refetch()}>Try again</Button></div>;
  if (!todos?.length) {
    return <Card className="border-dashed shadow-none"><CardContent className="p-8 text-center">
      <h3 className="font-semibold text-slate-900">No tasks yet</h3>
      <p className="mt-1 text-sm text-slate-500">Add your first task above and it will show up here.</p>
    </CardContent></Card>;
  }

  return <ul aria-label="Tasks" aria-live="polite" className="space-y-3">{todos.map((todo) => <TodoItemRow key={todo.id} todo={todo} />)}</ul>;
}
