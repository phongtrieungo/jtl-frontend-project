import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { todoKeys, type Todo } from '@todo/shared';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
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
});
