import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { apiClient, todoKeys, toastsAtom, type Todo } from '@todo/shared';
import { getDefaultStore } from 'jotai/vanilla';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TodoList } from './TodoList';

const userId = 'user-1';

function renderList(todos: Todo[], props: Partial<ComponentProps<typeof TodoList>> = {}) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
  client.setQueryData(todoKeys.byUser(userId), todos);
  const view = render(
    <QueryClientProvider client={client}>
      <TodoList userId={userId} {...props} />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

describe('TodoList discovery states', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    act(() => getDefaultStore().set(toastsAtom, []));
  });

  it('explains when the selected user has no tasks', () => {
    renderList([]);
    expect(screen.getByRole('heading', { name: 'No tasks for this user' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('announces filtered results and offers an accessible clear action when none match', () => {
    const onClearFilters = vi.fn();
    renderList([{
      id: 'todo-1',
      title: 'Write engine notes',
      assigneeId: userId,
      completed: false,
      createdAt: '2026-09-27T00:00:00.000Z',
    }], {
      filters: { status: 'completed', query: 'cipher', sort: 'title-asc' },
      onClearFilters,
    });

    expect(screen.getByRole('heading', { name: 'No tasks match these filters' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it('supports labelled multi-selection and explicit bulk-delete confirmation', () => {
    renderList([
      { id: 'todo-1', title: 'Write engine notes', assigneeId: userId, completed: false, createdAt: '2026-09-27T00:00:00.000Z' },
      { id: 'todo-2', title: 'Review demo', assigneeId: userId, completed: false, createdAt: '2026-09-26T00:00:00.000Z' },
    ]);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all visible tasks' }));
    expect(screen.getByText('2 selected')).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: 'Complete selected' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    expect(screen.getByRole('group', { name: 'Confirm deletion of 2 selected tasks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm bulk delete' })).toBeEnabled();
  });

  it('announces each selected task progress during a bulk action', async () => {
    const todo = { id: 'todo-1', title: 'Write engine notes', assigneeId: userId, completed: false, createdAt: '2026-09-27T00:00:00.000Z' };
    let resolveUpdate!: (todo: Todo) => void;
    vi.spyOn(apiClient, 'updateTodo').mockReturnValue(new Promise<Todo>((resolve) => { resolveUpdate = resolve; }));
    vi.spyOn(apiClient, 'getTodosByUser').mockResolvedValue([{ ...todo, completed: true }]);
    renderList([todo]);

    fireEvent.click(screen.getByRole('checkbox', { name: `Select ${todo.title}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Complete selected' }));

    await waitFor(() => expect(screen.getByText(`${todo.title}: updating.`)).toBeInTheDocument());
    expect(screen.getByText('Updating...')).toBeInTheDocument();

    act(() => resolveUpdate({ ...todo, completed: true }));
    await waitFor(() => expect(screen.getByText(`${todo.title}: updated.`)).toBeInTheDocument());
  });

  it('locks conflicting controls while a task mutation is optimistic', async () => {
    const todo = { id: 'todo-1', title: 'Write engine notes', assigneeId: userId, completed: false, createdAt: '2026-09-27T00:00:00.000Z' };
    let resolveToggle!: (todo: Todo) => void;
    vi.spyOn(apiClient, 'toggleTodo').mockReturnValue(
      new Promise<Todo>((resolve) => { resolveToggle = resolve; }),
    );
    vi.spyOn(apiClient, 'getTodosByUser').mockResolvedValue([{ ...todo, completed: true }]);
    renderList([todo]);

    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));

    await waitFor(() => expect(screen.getByText('Saving...')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Mark active' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: `Select ${todo.title}` })).toBeDisabled();

    act(() => resolveToggle({ ...todo, completed: true }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark active' })).toBeEnabled());
  });
});
