import { Outlet, createRootRoute } from '@tanstack/react-router';
import { ToastViewport } from '@todo/shared';
import { Header } from '../components/Header';
import { RouteErrorFallback, RouteNotFoundFallback, RoutePendingFallback } from '../components/RouteFallbacks';

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
  pendingComponent: RoutePendingFallback,
});
function RootLayout() {
  return <><a href="#main-content" className="sr-only z-50 rounded bg-white p-3 text-indigo-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a><Header /><main id="main-content" className="app-main mx-auto min-h-[calc(100vh-9rem)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Outlet /></main><ToastViewport /></>;
}
