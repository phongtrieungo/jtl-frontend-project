import { z } from 'zod';

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(20, 'Username must be 20 characters or fewer.')
    .regex(/^[a-zA-Z0-9]+$/, 'Use letters and numbers only.'),
});

export type CreateUserFormInput = z.infer<typeof createUserSchema>;
