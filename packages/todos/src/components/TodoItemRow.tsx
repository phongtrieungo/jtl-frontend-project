import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, CardContent, Input, type Todo } from '@todo/shared';
import { updateTodoSchema } from '../schemas/todoSchemas';
import type { BulkTodoItemStatus } from '../hooks/useBulkTodoActions';

export interface TodoItemRowProps {
  todo: Todo;
  isSaving?: boolean;
  onToggle?: (todo: Todo) => void;
  onUpdate?: (todo: Todo, title: string) => void;
  onDelete?: (todo: Todo) => void;
  isSelected?: boolean;
  onSelectedChange?: (todo: Todo, selected: boolean) => void;
  bulkStatus?: BulkTodoItemStatus;
}

export function TodoItemRow({ todo, isSaving = false, onToggle, onUpdate, onDelete, isSelected = false, onSelectedChange, bulkStatus }: TodoItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [error, setError] = useState<string>();
  const isLocked = Boolean(todo.isOptimistic) || isSaving || bulkStatus === 'pending';

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = updateTodoSchema.safeParse({ title });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Enter a valid task title.');
      return;
    }
    setError(undefined);
    onUpdate?.(todo, result.data.title);
    setIsEditing(false);
  };

  return (
    <li>
      <Card className={`p-4 ${isLocked ? 'opacity-80' : ''}`} aria-busy={isLocked}>
        <CardContent className="p-0">
          {isEditing ? (
            <form aria-label={`Edit ${todo.title}`} className="space-y-3" onSubmit={submitEdit}>
              <Input id={`todo-title-${todo.id}`} label="Task title" value={title} error={error} disabled={isLocked} onChange={(event) => setTitle(event.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" isLoading={isLocked}>Save task</Button>
                <Button type="button" size="sm" variant="outline" disabled={isLocked} onClick={() => { setTitle(todo.title); setError(undefined); setIsEditing(false); }}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {onSelectedChange ? <input
                  id={`select-todo-${todo.id}`}
                  type="checkbox"
                  checked={isSelected}
                  disabled={isLocked}
                  aria-label={`Select ${todo.title}`}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                  onChange={(event) => onSelectedChange(todo, event.target.checked)}
                /> : null}
                <div className="min-w-0">
                <p className={`truncate font-medium ${todo.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{todo.title}</p>
                <p className="mt-1 text-xs text-slate-500">{todo.completed ? 'Completed' : 'Pending'}</p>
                </div>
              </div>
              {isLocked ? <Badge variant="amber" pulse dot>{bulkStatus === 'pending' ? 'Updating...' : 'Saving...'}</Badge>
                : bulkStatus === 'failed' ? <Badge variant="rose">Reverted</Badge>
                  : bulkStatus === 'succeeded' ? <Badge variant="emerald">Updated</Badge>
                    : <Badge variant={todo.completed ? 'emerald' : 'slate'}>{todo.completed ? 'Done' : 'To do'}</Badge>}
            </div>
          )}
          {!isEditing && !todo.isOptimistic ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <Button size="sm" variant="outline" disabled={isLocked} onClick={() => onToggle?.(todo)}>{todo.completed ? 'Mark active' : 'Mark complete'}</Button>
              <Button size="sm" variant="ghost" disabled={isLocked} onClick={() => setIsEditing(true)}>Edit</Button>
              {isConfirmingDelete ? (
                <span className="flex items-center gap-2 text-sm text-slate-700" role="group" aria-label={`Confirm deletion of ${todo.title}`}>
                  Delete this task?
                  <Button size="sm" variant="destructive" disabled={isLocked} onClick={() => onDelete?.(todo)}>Confirm delete</Button>
                  <Button size="sm" variant="outline" disabled={isLocked} onClick={() => setIsConfirmingDelete(false)}>Cancel</Button>
                </span>
              ) : <Button size="sm" variant="ghost" disabled={isLocked} onClick={() => setIsConfirmingDelete(true)}>Delete</Button>}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </li>
  );
}
