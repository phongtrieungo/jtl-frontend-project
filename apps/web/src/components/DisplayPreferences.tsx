import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import {
  densityPreferenceAtom,
  themePreferenceAtom,
  type DensityPreference,
  type ThemePreference,
} from '@todo/shared';

function prefersDarkMode(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function DisplayPreferences() {
  const [theme, setTheme] = useAtom(themePreferenceAtom);
  const [density, setDensity] = useAtom(densityPreferenceAtom);
  const [systemIsDark, setSystemIsDark] = useState(prefersDarkMode);
  const resolvedTheme = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (event: MediaQueryListEvent) => setSystemIsDark(event.matches);
    setSystemIsDark(media.matches);
    media.addEventListener('change', updateSystemTheme);
    return () => media.removeEventListener('change', updateSystemTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.dataset.theme = resolvedTheme;
    root.dataset.density = density;
  }, [density, resolvedTheme]);

  const controlClass = 'rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600';

  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">Display preferences</legend>
      <label className="sr-only" htmlFor="theme-preference">Theme</label>
      <select
        id="theme-preference"
        aria-label="Theme"
        className={controlClass}
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemePreference)}
      >
        <option value="system">System theme</option>
        <option value="light">Light theme</option>
        <option value="dark">Dark theme</option>
      </select>
      <label className="sr-only" htmlFor="density-preference">Density</label>
      <select
        id="density-preference"
        aria-label="Density"
        className={controlClass}
        value={density}
        onChange={(event) => setDensity(event.target.value as DensityPreference)}
      >
        <option value="comfortable">Comfortable</option>
        <option value="compact">Compact</option>
      </select>
    </fieldset>
  );
}
