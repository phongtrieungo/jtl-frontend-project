// packages/shared/src/state/chaosAtom.ts
import { atom } from 'jotai';

/**
 * Global Chaos Mode state atom.
 * When enabled, client mutations inject failure flags (or headers)
 * to verify optimistic rollbacks and error handling.
 */
export const isChaosActiveAtom = atom<boolean>(false);

/**
 * Convenience alias for isChaosActiveAtom.
 */
export const chaosModeAtom = isChaosActiveAtom;
