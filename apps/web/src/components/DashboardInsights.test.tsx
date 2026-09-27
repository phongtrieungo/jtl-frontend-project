import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { DashboardInsights } from './DashboardInsights';
import type { TaskInsightsResult } from '@todo/todos';

const tasks: TaskInsightsResult = { isPending: false, isError: false, retry: vi.fn(), insights: {
  total: 1, active: 1, completed: 0, completionRate: 0, saving: false,
  recent: [{ id: 'one', assigneeId: 'ada', title: 'Review work', completed: false, createdAt: '2026-09-27' }],
  attention: [{ userId: 'ada', active: 1 }],
} };

beforeAll(() => {
  Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() });
});

async function mount(props: Partial<Parameters<typeof DashboardInsights>[0]> = {}) {
  const root = createRootRoute();
  const index = createRoute({ getParentRoute: () => root, path: '/', component: () => <DashboardInsights users={[{ id: 'ada', username: 'Ada' }]} tasks={tasks} isPending={false} isError={false} onRetry={() => {}} {...props} /> });
  const router = createRouter({ routeTree: root.addChildren([index]), history: createMemoryHistory({ initialEntries: ['/'] }) });
  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { name: 'Workspace overview' });
}
describe('dashboard insights', () => {
  it('renders text metrics and scoped drill-down links', async () => {
    await mount();
    expect(screen.getByRole('link', { name: 'Total tasks 1' })).toHaveAttribute('href', expect.stringContaining('status=all'));
    expect(screen.getByRole('link', { name: 'Review work Ada · Active' })).toHaveAttribute('href', expect.stringContaining('userId=ada'));
    expect(screen.getByRole('link', { name: '1 active task for Ada' })).toHaveAttribute('href', expect.stringContaining('status=active'));
    expect(screen.getByRole('link', { name: 'Ada' })).toHaveAttribute('href', '/users/ada');
  });
  it('shows loading placeholders without false zero metrics', async () => {
    await mount({ isPending: true });
    expect(screen.getByText('Loading workspace insights')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Total tasks/ })).not.toBeInTheDocument();
  });
  it('hides partial totals on error and offers retry', async () => {
    const retry = vi.fn();
    await mount({ isError: true, onRetry: retry });
    expect(screen.getByRole('alert')).toHaveTextContent('Some data could not be loaded');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.queryByRole('link', { name: /Total tasks/ })).not.toBeInTheDocument();
  });
  it('explains empty task and people regions', async () => {
    await mount({ users: [], tasks: { ...tasks, insights: { ...tasks.insights, total: 0, active: 0, recent: [], attention: [] } } });
    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
    expect(screen.getByText(/No people yet/)).toBeInTheDocument();
  });
});
