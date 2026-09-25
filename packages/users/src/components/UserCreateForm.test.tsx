import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { apiClient } from '@todo/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserCreateForm } from './UserCreateForm';

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><UserCreateForm /></QueryClientProvider>);
}

afterEach(() => vi.restoreAllMocks());

describe('UserCreateForm', () => {
  it('shows an associated inline validation error without calling the API', () => {
    const createUser = vi.spyOn(apiClient, 'createUser');
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Add user' }));

    const input = screen.getByRole('textbox', { name: 'Username' });
    expect(screen.getByRole('alert')).toHaveTextContent('at least 3 characters');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'new-user-username-error');
    expect(createUser).not.toHaveBeenCalled();
  });
});
