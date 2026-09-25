import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().trim().min(3, 'Task title must be at least 3 characters.').max(100, 'Task title must be 100 characters or fewer.'),
  assigneeId: z.string().trim().min(1, 'Choose a user for this task.'),
});

export type CreateTodoFormInput = z.infer<typeof createTodoSchema>;
