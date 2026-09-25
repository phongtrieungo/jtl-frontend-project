import { Badge, Card, CardContent, type Todo } from '@todo/shared';

export interface TodoItemRowProps {
  todo: Todo;
}

export function TodoItemRow({ todo }: TodoItemRowProps) {
  const isOptimistic = Boolean(todo.isOptimistic);
  return (
    <li>
      <Card className={`p-4 ${isOptimistic ? 'opacity-80' : ''}`}>
        <CardContent className="flex items-center justify-between gap-3 p-0">
          <div className="min-w-0">
            <p className={`truncate font-medium ${todo.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{todo.title}</p>
            <p className="mt-1 text-xs text-slate-500">{todo.completed ? 'Completed' : 'Pending'}</p>
          </div>
          {isOptimistic ? <Badge variant="amber" pulse dot>Saving...</Badge> : <Badge variant={todo.completed ? 'emerald' : 'slate'}>{todo.completed ? 'Done' : 'To do'}</Badge>}
        </CardContent>
      </Card>
    </li>
  );
}
