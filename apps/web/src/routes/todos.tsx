import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { parseTodosSearch } from './todosSearch';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/todos',
  validateSearch: parseTodosSearch,
  component: lazyRouteComponent(() => import('./todos.lazy'), 'TodosPage'),
});
