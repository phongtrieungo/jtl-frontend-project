import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { apiClient, type User } from '@todo/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCreateUser } from './useCreateUser';
import { useUsers } from './useUsers';

const createdUser: User = { id: 'user-new', username: 'Ada99', createdAt: '2026-09-25T00:00:00.000Z', taskCount: 0 };

describe('useCreateUser', () => {
  afterEach(() => vi.restoreAllMocks());

  it('invalidates the user list after successful creation', async () => {
    const getUsers = vi.spyOn(apiClient, 'getUsers').mockResolvedValue([]);
    const createUser = vi.spyOn(apiClient, 'createUser').mockResolvedValue(createdUser);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => ({ users: useUsers(), create: useCreateUser() }), { wrapper });

    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.create.mutateAsync({ username: 'Ada99' });
    });
    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(2));
    expect(createUser).toHaveBeenCalledWith({ username: 'Ada99' });
  });
});
