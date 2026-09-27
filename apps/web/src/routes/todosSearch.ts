import { z } from 'zod';

export const todosSearchSchema = z.object({
  userId: z.string().trim().min(1).optional().catch(undefined),
  status: z.enum(['all', 'active', 'completed']).catch('all'),
  query: z.string().trim().max(100).catch(''),
  sort: z.enum(['newest', 'oldest', 'title-asc']).catch('newest'),
});

export type TodosSearch = z.infer<typeof todosSearchSchema>;

export function parseTodosSearch(search: unknown): TodosSearch {
  return todosSearchSchema.parse(search);
}
