import { useCallback, useEffect, useState } from 'react';
import { createTodoSchema } from '../schemas/todoSchemas';

const TODO_DRAFT_KEY_PREFIX = 'taskwell.todo-draft.';

function storageKey(userId: string): string {
  return `${TODO_DRAFT_KEY_PREFIX}${userId}`;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readTodoDraft(userId: string): string {
  if (!canUseStorage()) return '';

  try {
    const stored = window.localStorage.getItem(storageKey(userId));
    if (!stored) return '';
    const value: unknown = JSON.parse(stored);
    if (typeof value !== 'object' || value === null || !('title' in value) || typeof value.title !== 'string') return '';
    return createTodoSchema.safeParse({ title: value.title, assigneeId: userId }).success ? value.title : '';
  } catch {
    return '';
  }
}

export function writeTodoDraft(userId: string, title: string): void {
  if (!canUseStorage()) return;

  try {
    if (createTodoSchema.safeParse({ title, assigneeId: userId }).success) {
      window.localStorage.setItem(storageKey(userId), JSON.stringify({ title }));
    } else {
      window.localStorage.removeItem(storageKey(userId));
    }
  } catch {
    // Storage can be unavailable in privacy modes. Draft persistence is best-effort.
  }
}

export function clearTodoDraft(userId: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // Keep the form usable even when storage is unavailable.
  }
}

export function useTodoDraft(userId: string) {
  const [draft, setDraft] = useState(() => ({ userId, title: readTodoDraft(userId) }));
  const title = draft.userId === userId ? draft.title : readTodoDraft(userId);

  useEffect(() => {
    setDraft({ userId, title: readTodoDraft(userId) });
  }, [userId]);

  const setTitle = useCallback((value: string) => {
    setDraft({ userId, title: value });
    writeTodoDraft(userId, value);
  }, [userId]);

  const clearTitle = useCallback(() => {
    setDraft({ userId, title: '' });
    clearTodoDraft(userId);
  }, [userId]);

  return { title, setTitle, clearTitle };
}
