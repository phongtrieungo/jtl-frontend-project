import { useState, type FormEvent } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, useToast } from '@todo/shared';
import { createUserSchema } from '../schemas/userSchemas';
import { useCreateUser } from '../hooks/useCreateUser';
export function UserCreateForm() {
  const [username, setUsername] = useState(''); const [error, setError] = useState<string>(); const createUser = useCreateUser(); const toast = useToast();
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const result = createUserSchema.safeParse({ username }); if (!result.success) { setError(result.error.issues[0]?.message ?? 'Enter a valid name.'); return; } setError(undefined); createUser.mutate(result.data, { onSuccess: () => { setUsername(''); toast.success('User created successfully.'); }, onError: () => toast.error('Unable to create user. Please try again.') }); }
  return <Card><CardHeader><CardTitle>Add a user</CardTitle><CardDescription>Create a profile to organize tasks.</CardDescription></CardHeader><CardContent><form aria-label="Create user" onSubmit={submit} className="flex flex-col gap-4 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><Input id="new-user-name" label="Name" name="username" placeholder="e.g. Grace Hopper" value={username} onChange={(event) => { setUsername(event.target.value); setError(undefined); }} error={error} /></div><Button type="submit" isLoading={createUser.isPending}>Add user</Button></form></CardContent></Card>;
}
