/* Generated route tree composition. Update when adding application routes. */
import { Route as rootRoute } from './routes/__root';
import { Route as indexRoute } from './routes/index';
import { Route as usersRoute } from './routes/users/index';
import { Route as userDetailRoute } from './routes/users/$id';
import { Route as todosRoute } from './routes/todos';

export const routeTree = rootRoute.addChildren([indexRoute, usersRoute, userDetailRoute, todosRoute]);
