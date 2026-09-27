import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DisplayPreferences } from './DisplayPreferences';

type ThemeListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<ThemeListener>();
  const media = {
    get matches() { return matches; },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: ThemeListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: ThemeListener) => listeners.delete(listener),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as MediaQueryList;
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  return {
    change(nextMatches: boolean) {
      matches = nextMatches;
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
  };
}

describe('Story 8.6 display preferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.density;
  });

  afterEach(() => vi.unstubAllGlobals());

  it('persists explicit theme and density selections and applies them to the document', async () => {
    installMatchMedia(false);
    render(<JotaiProvider><DisplayPreferences /></JotaiProvider>);

    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'dark' } });
    fireEvent.change(screen.getByLabelText('Density'), { target: { value: 'compact' } });

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(document.documentElement).toHaveAttribute('data-density', 'compact');
    expect(window.localStorage.getItem('taskwell.theme')).toBe(JSON.stringify('dark'));
    expect(window.localStorage.getItem('taskwell.density')).toBe(JSON.stringify('compact'));
  });

  it('tracks operating-system changes while the system theme is selected', async () => {
    const systemTheme = installMatchMedia(false);
    render(<JotaiProvider><DisplayPreferences /></JotaiProvider>);

    expect(screen.getByLabelText('Theme')).toHaveValue('system');
    expect(document.documentElement).not.toHaveClass('dark');

    act(() => systemTheme.change(true));
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('restores preferences from local storage in a fresh provider', async () => {
    installMatchMedia(false);
    window.localStorage.setItem('taskwell.theme', JSON.stringify('dark'));
    window.localStorage.setItem('taskwell.density', JSON.stringify('compact'));

    render(<JotaiProvider><DisplayPreferences /></JotaiProvider>);

    await waitFor(() => expect(screen.getByLabelText('Theme')).toHaveValue('dark'));
    expect(screen.getByLabelText('Density')).toHaveValue('compact');
    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).toHaveAttribute('data-density', 'compact');
  });
});
