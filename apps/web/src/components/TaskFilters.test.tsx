import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskFilters, type TaskFiltersProps } from './TaskFilters';

function renderFilters(overrides: Partial<TaskFiltersProps> = {}) {
  const props: TaskFiltersProps = {
    users: [{ id: 'user-1', username: 'Ada Lovelace' }],
    userId: 'user-1',
    status: 'all',
    query: '',
    sort: 'newest',
    onUserChange: vi.fn(),
    onStatusChange: vi.fn(),
    onQueryChange: vi.fn(),
    onSortChange: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };
  render(<TaskFilters {...props} />);
  return props;
}

describe('TaskFilters', () => {
  afterEach(() => vi.useRealTimers());

  it('labels every discovery control and exposes the selected values', () => {
    renderFilters({ status: 'active', sort: 'title-asc' });
    expect(screen.getByLabelText('Assignee')).toHaveValue('user-1');
    expect(screen.getByLabelText('Status')).toHaveValue('active');
    expect(screen.getByLabelText('Search tasks')).toHaveAttribute('type', 'search');
    expect(screen.getByLabelText('Sort by')).toHaveValue('title-asc');
  });

  it('debounces URL search updates until 300ms after typing stops', () => {
    vi.useFakeTimers();
    const props = renderFilters();
    fireEvent.change(screen.getByLabelText('Search tasks'), { target: { value: 'engine' } });
    act(() => vi.advanceTimersByTime(299));
    expect(props.onQueryChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(props.onQueryChange).toHaveBeenCalledOnce();
    expect(props.onQueryChange).toHaveBeenCalledWith('engine');
  });
});
