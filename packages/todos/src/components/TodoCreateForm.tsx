import { useState, type FormEvent } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@todo/shared';
import { createTodoSchema } from '../schemas/todoSchemas';
import { useCreateTodo } from '../hooks/useCreateTodo';

export interface TodoCreateFormProps {
  userId: string;
}

export function TodoCreateForm({ userId }: TodoCreateFormProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string>();
  const createTodo = useCreateTodo();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createTodoSchema.safeParse({ title, assigneeId: userId });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Enter a valid task title.');
      return;
    }

    setError(undefined);
    createTodo.mutate(result.data);
    setTitle('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a task</CardTitle>
        <CardDescription>Add a task for the selected user. It appears in the list while it saves.</CardDescription>
      </CardHeader>
      <CardContent>
        <form aria-label="Create task" onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              id="new-todo-title"
              label="Task title"
              name="title"
              required
              maxLength={100}
              placeholder="e.g. Review the project brief"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (error) setError(undefined);
              }}
              error={error}
            />
          </div>
          <Button type="submit" isLoading={createTodo.isPending} disabled={!userId}>Create task</Button>
        </form>
      </CardContent>
    </Card>
  );
}
