import { describe, expect, it } from 'vitest';
import { createUserSchema } from './userSchemas';

describe('createUserSchema', () => {
  it('accepts trimmed alphanumeric usernames from 3 to 20 characters', () => {
    expect(createUserSchema.parse({ username: '  Ada99  ' })).toEqual({ username: 'Ada99' });
    expect(createUserSchema.safeParse({ username: 'a'.repeat(20) }).success).toBe(true);
  });

  it('rejects usernames shorter than 3 characters with a useful message', () => {
    const result = createUserSchema.safeParse({ username: 'Al' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain('at least 3 characters');
  });

  it.each(['a'.repeat(21), 'ada lovelace', 'ada!'])('rejects invalid username %s', (username) => {
    expect(createUserSchema.safeParse({ username }).success).toBe(false);
  });
});
