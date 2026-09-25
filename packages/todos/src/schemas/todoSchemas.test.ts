import { describe, expect, it } from 'vitest';
import { createTodoSchema } from './todoSchemas';

describe('createTodoSchema', () => {
  it('trims valid titles and accepts an assigned user', () => {
    expect(createTodoSchema.parse({ title: '  Review the brief  ', assigneeId: 'user-1' })).toEqual({
      title: 'Review the brief',
      assigneeId: 'user-1',
    });
  });

  it('rejects titles shorter than three characters', () => {
    const result = createTodoSchema.safeParse({ title: 'ab', assigneeId: 'user-1' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain('at least 3 characters');
  });

  it('rejects titles over 100 characters and a missing assignee', () => {
    expect(createTodoSchema.safeParse({ title: 'a'.repeat(101), assigneeId: 'user-1' }).success).toBe(false);
    expect(createTodoSchema.safeParse({ title: 'Valid title', assigneeId: '' }).success).toBe(false);
  });
});
