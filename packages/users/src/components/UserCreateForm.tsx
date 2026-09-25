import { useState, type FormEvent } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, useToast } from '@todo/shared';
import { createUserSchema } from '../schemas/userSchemas';
import { useCreateUser } from '../hooks/useCreateUser';

export function UserCreateForm() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string>();
  const createUser = useCreateUser();
  const toast = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createUserSchema.safeParse({ username });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Enter a valid username.');
      return;
    }

    setError(undefined);
    try {
      await createUser.mutateAsync(result.data);
      setUsername('');
      toast.success(`${result.data.username} was added.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to create user. Please try again.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a user</CardTitle>
        <CardDescription>Add someone to your workspace directory.</CardDescription>
      </CardHeader>
      <CardContent>
        <form aria-label="Create user" onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="new-user-username"
            label="Username"
            name="username"
            autoComplete="off"
            placeholder="e.g. adalovelace"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (error) setError(undefined);
            }}
            onBlur={() => {
              if (username.length > 0) {
                const result = createUserSchema.safeParse({ username });
                setError(result.success ? undefined : result.error.issues[0]?.message);
              }
            }}
            error={error}
          />
          <Button type="submit" isLoading={createUser.isPending}>Add user</Button>
        </form>
      </CardContent>
    </Card>
  );
}
