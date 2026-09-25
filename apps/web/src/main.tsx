import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Provider as JotaiProvider } from 'jotai';
import { apiClient, type ApiClientMode } from '@todo/shared';
import { routeTree } from './routeTree.gen';
import './index.css';

const envMode = (import.meta as ImportMeta & { env?: { VITE_API_MODE?: ApiClientMode } }).env?.VITE_API_MODE;
if (envMode === 'mock' || envMode === 'bff' || envMode === 'auto') apiClient.setMode(envMode);
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' { interface Register { router: typeof router } }

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </JotaiProvider>
  </React.StrictMode>,
);
