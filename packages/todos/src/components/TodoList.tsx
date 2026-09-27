import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Spinner, type Todo } from '@todo/shared';
import { useTodosByUser } from '../hooks/useTodosByUser';
import { TodoItemRow } from './TodoItemRow';
import { useToggleTodo } from '../hooks/useToggleTodo';
import { useUpdateTodo } from '../hooks/useUpdateTodo';
import { useDeleteTodo } from '../hooks/useDeleteTodo';
import { useBulkTodoActions, type BulkTodoAction } from '../hooks/useBulkTodoActions';
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
  const bulkActions = useBulkTodoActions();
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(() => new Set());
  const [pendingConfirmation, setPendingConfirmation] = useState<BulkTodoAction>();
  const [bulkTaskLabels, setBulkTaskLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelectedTodoIds(new Set());
    setPendingConfirmation(undefined);
    setBulkTaskLabels({});
  }, [userId]);

  if (!userId) return <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Select a user to view and create tasks.</p>;
  if (isPending) return <div role="status" className="flex justify-center p-8"><Spinner label="Loading tasks" /></div>;
  if (isError) return <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error.message || 'Unable to load tasks.'} <Button variant="outline" size="sm" className="ml-2" onClick={() => void refetch()}>Try again</Button></div>;
  const visibleTodos = filterAndSortTodos(todos ?? [], filters);
  const hasFilters = hasActiveTodoDiscoveryFilters(filters);
  const selectableTodos = visibleTodos.filter((todo) => !todo.isOptimistic && bulkActions.itemStatuses[todo.id] !== 'pending');
  const selectedTodos = (todos ?? []).filter((todo) => selectedTodoIds.has(todo.id) && !todo.isOptimistic);
  const areAllVisibleSelected = selectableTodos.length > 0
    && selectableTodos.every((todo) => selectedTodoIds.has(todo.id));

  const setTodoSelected = (todo: Todo, selected: boolean): void => {
    setPendingConfirmation(undefined);
    setSelectedTodoIds((current) => {
      const next = new Set(current);
      if (selected) next.add(todo.id);
      else next.delete(todo.id);
      return next;
    });
  };

  const runSelectedAction = (action: BulkTodoAction): void => {
    const targets = selectedTodos;
    setBulkTaskLabels(Object.fromEntries(targets.map((todo) => [todo.id, todo.title])));
    setSelectedTodoIds(new Set());
    setPendingConfirmation(undefined);
    void bulkActions.runBulkAction(action, targets);
  };

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
    <p role="status" aria-live="polite" className="sr-only">
      {Object.entries(bulkActions.itemStatuses).map(([todoId, status]) => {
        const statusLabel = status === 'pending' ? 'updating' : status === 'succeeded' ? 'updated' : 'reverted';
        return `${bulkTaskLabels[todoId] ?? 'Selected task'}: ${statusLabel}.`;
      }).join(' ')}
    </p>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Bulk task actions">
      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={areAllVisibleSelected}
          disabled={selectableTodos.length === 0 || bulkActions.isPending}
          aria-label="Select all visible tasks"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
          onChange={(event) => {
            setPendingConfirmation(undefined);
            setSelectedTodoIds((current) => {
              const next = new Set(current);
              for (const todo of selectableTodos) {
                if (event.target.checked) next.add(todo.id);
                else next.delete(todo.id);
              }
              return next;
            });
          }}
        />
        Select visible
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span role="status" aria-live="polite" className="text-sm text-slate-500">{selectedTodos.length} selected</span>
        <Button size="sm" variant="outline" disabled={selectedTodos.length === 0 || bulkActions.isPending} onClick={() => runSelectedAction('complete')}>Complete selected</Button>
        {pendingConfirmation === 'delete' ? <span role="group" aria-label={`Confirm deletion of ${selectedTodos.length} selected tasks`} className="flex items-center gap-2 text-sm text-slate-700">
          Delete {selectedTodos.length} selected?
          <Button size="sm" variant="destructive" disabled={bulkActions.isPending} onClick={() => runSelectedAction('delete')}>Confirm bulk delete</Button>
          <Button size="sm" variant="outline" disabled={bulkActions.isPending} onClick={() => setPendingConfirmation(undefined)}>Cancel</Button>
        </span> : <Button size="sm" variant="ghost" disabled={selectedTodos.length === 0 || bulkActions.isPending} onClick={() => setPendingConfirmation('delete')}>Delete selected</Button>}
      </div>
    </div>
    <ul aria-label="Tasks" className="space-y-3">{visibleTodos.map((todo) => {
    const isSaving = (toggleTodo.isPending && toggleTodo.variables?.todo.id === todo.id)
      || (updateTodo.isPending && updateTodo.variables?.todo.id === todo.id)
      || (deleteTodo.isPending && deleteTodo.variables?.todo.id === todo.id);
    return <TodoItemRow key={todo.id} todo={todo} isSaving={isSaving} isSelected={selectedTodoIds.has(todo.id)} bulkStatus={bulkActions.itemStatuses[todo.id]} onSelectedChange={setTodoSelected} onToggle={(item) => toggleTodo.mutate({ todo: item })} onUpdate={(item, title) => updateTodo.mutate({ todo: item, changes: { title } })} onDelete={(item) => deleteTodo.mutate({ todo: item })} />;
    })}</ul>
  </section>;
}
