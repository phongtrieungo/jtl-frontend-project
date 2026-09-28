// @todo/todos public API entrypoint
import type { TodoSummary } from '@todo/shared';

export const TODOS_MODULE_VERSION = '0.1.0';

export type Todo = TodoSummary;
/** Public API for the isolated ToDo feature package. */
export { createTodoSchema, updateTodoSchema, type CreateTodoFormInput, type UpdateTodoFormInput } from './schemas/todoSchemas';
export { useCreateTodo } from './hooks/useCreateTodo';
export { useTodosByUser } from './hooks/useTodosByUser';
export { useToggleTodo, type ToggleTodoInput } from './hooks/useToggleTodo';
export { useUpdateTodo, type UpdateTodoMutationInput } from './hooks/useUpdateTodo';
export { useDeleteTodo, type DeleteTodoInput } from './hooks/useDeleteTodo';
export {
  useBulkTodoActions,
  type BulkTodoAction,
  type BulkTodoActionsResult,
  type BulkTodoItemStatus,
} from './hooks/useBulkTodoActions';
export { TodoCreateForm, type TodoCreateFormProps } from './components/TodoCreateForm';
export { TodoList, type TodoListProps } from './components/TodoList';
export { TodoItemRow, type TodoItemRowProps } from './components/TodoItemRow';
export {
  defaultTodoDiscoveryFilters,
  type TodoDiscoveryFilters,
  type TodoSortOrder,
  type TodoStatusFilter,
} from './utils/taskDiscovery';
export { useTaskInsights, type TaskInsightsResult } from './hooks/useTaskInsights';
