import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type ThemePreference = 'light' | 'dark' | 'system';
export type DensityPreference = 'comfortable' | 'compact';

const storedThemePreferenceAtom = atomWithStorage<ThemePreference>('taskwell.theme', 'system');
const storedDensityPreferenceAtom = atomWithStorage<DensityPreference>('taskwell.density', 'comfortable');

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isDensityPreference(value: unknown): value is DensityPreference {
  return value === 'comfortable' || value === 'compact';
}

export const themePreferenceAtom = atom(
  (get) => {
    const value = get(storedThemePreferenceAtom);
    return isThemePreference(value) ? value : 'system';
  },
  (_get, set, value: ThemePreference) => set(storedThemePreferenceAtom, value),
);

export const densityPreferenceAtom = atom(
  (get) => {
    const value = get(storedDensityPreferenceAtom);
    return isDensityPreference(value) ? value : 'comfortable';
  },
  (_get, set, value: DensityPreference) => set(storedDensityPreferenceAtom, value),
);
