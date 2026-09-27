import type { Todo } from '@todo/shared';

export type TodoStatusFilter = 'all' | 'active' | 'completed';
export type TodoSortOrder = 'newest' | 'oldest' | 'title-asc';

export interface TodoDiscoveryFilters {
  readonly status: TodoStatusFilter;
  readonly query: string;
  readonly sort: TodoSortOrder;
}

export const defaultTodoDiscoveryFilters: TodoDiscoveryFilters = {
  status: 'all',
  query: '',
  sort: 'newest',
};

export function filterAndSortTodos(
  todos: readonly Todo[],
  filters: TodoDiscoveryFilters,
): Todo[] {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase();

  return todos
    .filter((todo) => {
      const matchesStatus = filters.status === 'all'
        || (filters.status === 'active' && !todo.completed)
        || (filters.status === 'completed' && todo.completed);
      const matchesQuery = !normalizedQuery
        || todo.title.toLocaleLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    })
    .sort((left, right) => {
      if (filters.sort === 'title-asc') {
        return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' });
      }

      const timeDifference = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      return filters.sort === 'oldest' ? timeDifference : -timeDifference;
    });
}

export function hasActiveTodoDiscoveryFilters(filters: TodoDiscoveryFilters): boolean {
  return filters.status !== defaultTodoDiscoveryFilters.status
    || filters.query.trim().length > 0
    || filters.sort !== defaultTodoDiscoveryFilters.sort;
}
