// packages/shared/src/state/userAtom.ts
import { atom } from 'jotai';

/**
 * Stores the currently active/selected user ID across the application.
 * Initialized to 'user-1' (Ada Lovelace) by default to provide an immediate active workspace.
 */
export const activeUserIdAtom = atom<string | null>('user-1');

/**
 * Derived read-only atom indicating whether any user is currently selected.
 */
export const isUserSelectedAtom = atom((get) => get(activeUserIdAtom) !== null);
