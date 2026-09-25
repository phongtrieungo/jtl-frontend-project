import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@todo/shared';
export function BackendStatusBadge() {
  const { data } = useQuery({ queryKey: ['backend-health'], queryFn: () => apiClient.checkHealth(), refetchInterval: 15_000, staleTime: 10_000 });
  const mode = data?.mode ?? apiClient.getActiveMode();
  const connected = data?.status === 'ok' && mode === 'bff';
  return <span role="status" aria-label={connected ? 'Backend connected' : 'Using mock data'} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />{connected ? 'BFF connected' : 'Mock mode'}</span>;
}
