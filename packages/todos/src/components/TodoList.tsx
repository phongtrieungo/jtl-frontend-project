import { Button, Card, CardContent, Spinner } from '@todo/shared';
import { useTodosByUser } from '../hooks/useTodosByUser';
import { TodoItemRow } from './TodoItemRow';
import { useToggleTodo } from '../hooks/useToggleTodo';
import { useUpdateTodo } from '../hooks/useUpdateTodo';
import { useDeleteTodo } from '../hooks/useDeleteTodo';
import {
  defaultTodoDiscoveryFilters,
  filterAndSortTodos,
  hasActiveTodoDiscoveryFilters,
  type TodoDiscoveryFilters,
} from '../utils/taskDiscovery';

export interface TodoListProps {
  userId: string;
  filters?: TodoDiscoveryFilters;
  onClearFilters?: () => void;
}

export function TodoList({
  userId,
  filters = defaultTodoDiscoveryFilters,
  onClearFilters,
}: TodoListProps) {
  const { data: todos, isPending, isError, error, refetch } = useTodosByUser(userId);
  const toggleTodo = useToggleTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  if (!userId) return <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Select a user to view and create tasks.</p>;
  if (isPending) return <div role="status" className="flex justify-center p-8"><Spinner label="Loading tasks" /></div>;
  if (isError) return <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error.message || 'Unable to load tasks.'} <Button variant="outline" size="sm" className="ml-2" onClick={() => void refetch()}>Try again</Button></div>;
  const visibleTodos = filterAndSortTodos(todos ?? [], filters);
  const hasFilters = hasActiveTodoDiscoveryFilters(filters);

  if (!todos?.length) {
    return <Card className="border-dashed shadow-none"><CardContent className="p-8 text-center">
      <h3 className="font-semibold text-slate-900">No tasks for this user</h3>
      <p className="mt-1 text-sm text-slate-500">Add your first task above and it will show up here.</p>
    </CardContent></Card>;
  }

  if (!visibleTodos.length && hasFilters) {
    return <Card className="border-dashed shadow-none"><CardContent className="p-8 text-center">
      <h3 className="font-semibold text-slate-900">No tasks match these filters</h3>
      <p className="mt-1 text-sm text-slate-500">Try a different status, search phrase, or sort order.</p>
      {onClearFilters ? <Button className="mt-4" variant="outline" onClick={onClearFilters}>Clear filters</Button> : null}
    </CardContent></Card>;
  }

  return <section aria-label="Task results" className="space-y-3">
    <p role="status" aria-live="polite" className="text-sm text-slate-500">Showing {visibleTodos.length} of {todos.length} tasks</p>
    <ul aria-label="Tasks" className="space-y-3">{visibleTodos.map((todo) => {
    const isSaving = (toggleTodo.isPending && toggleTodo.variables?.todo.id === todo.id)
      || (updateTodo.isPending && updateTodo.variables?.todo.id === todo.id)
      || (deleteTodo.isPending && deleteTodo.variables?.todo.id === todo.id);
    return <TodoItemRow key={todo.id} todo={todo} isSaving={isSaving} onToggle={(item) => toggleTodo.mutate({ todo: item })} onUpdate={(item, title) => updateTodo.mutate({ todo: item, changes: { title } })} onDelete={(item) => deleteTodo.mutate({ todo: item })} />;
    })}</ul>
  </section>;
}
