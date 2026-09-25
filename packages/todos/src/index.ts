// @todo/todos public API entrypoint
import { type TodoSummary } from '@todo/shared';

export const TODOS_MODULE_VERSION = '0.1.0';

export interface Todo extends TodoSummary {}
/** Public API for the isolated ToDo feature package. */
export { createTodoSchema, type CreateTodoFormInput } from './schemas/todoSchemas';
export { useCreateTodo } from './hooks/useCreateTodo';
export { useTodosByUser } from './hooks/useTodosByUser';
export { TodoCreateForm, type TodoCreateFormProps } from './components/TodoCreateForm';
export { TodoList, type TodoListProps } from './components/TodoList';
export { TodoItemRow, type TodoItemRowProps } from './components/TodoItemRow';
