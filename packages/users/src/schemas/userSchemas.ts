import { z } from 'zod';
export const createUserSchema = z.object({ username: z.string().trim().min(3, 'Name must be at least 3 characters.').max(40, 'Name must be 40 characters or fewer.') });
export type CreateUserFormInput = z.infer<typeof createUserSchema>;
