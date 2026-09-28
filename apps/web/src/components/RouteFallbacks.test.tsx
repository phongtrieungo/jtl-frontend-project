import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { RouteErrorFallback, RouteNotFoundFallback, RoutePendingFallback } from './RouteFallbacks';

beforeAll(() => {
  Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() });
});

async function renderAt(path: string, component: () => JSX.Element): Promise<void> {
  const root = createRootRoute({ component: () => component(), notFoundComponent: RouteNotFoundFallback });
  const index = createRoute({ getParentRoute: () => root, path: '/', component: () => <p>Dashboard</p> });
  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
}

describe('route fallbacks', () => {
  it('announces lazy route loading without exposing skeletons to assistive technology', () => {
    const { container } = render(<RoutePendingFallback />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading page content');
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('offers retry and typed dashboard recovery for unexpected errors', async () => {
    const reset = vi.fn();
    await renderAt('/', () => <RouteErrorFallback error={new Error('private detail')} reset={reset} />);
    expect(screen.getByRole('alert')).toHaveTextContent('This page could not be displayed');
    expect(screen.queryByText('private detail')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Return to dashboard' })).toHaveAttribute('href', '/');
  });

  it('renders an accessible recovery path for unknown URLs', async () => {
    await renderAt('/missing-page', () => <RouteNotFoundFallback />);
    expect(await screen.findByRole('heading', { name: 'We could not find that page' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return to dashboard' })).toHaveAttribute('href', '/');
  });
});
