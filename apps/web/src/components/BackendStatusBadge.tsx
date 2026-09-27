import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@todo/shared';
export function BackendStatusBadge() {
  const { data } = useQuery({ queryKey: ['backend-health'], queryFn: () => apiClient.checkHealth(), refetchInterval: 15_000, staleTime: 10_000 });
  const mode = data?.mode ?? apiClient.getActiveMode();
  const connected = data?.status === 'ok' && mode === 'bff';
  const checking = mode === 'bff' && data === undefined;
  const unavailable = mode === 'bff' && data?.status === 'offline';
  const degraded = mode === 'bff' && data?.status === 'degraded';
  const label = connected ? 'BFF connected' : checking ? 'Checking BFF' : unavailable ? 'BFF unavailable' : degraded ? 'BFF degraded' : 'Mock mode';
  return <span role="status" aria-label={label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : unavailable ? 'bg-rose-50 text-rose-700' : checking || degraded ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : unavailable ? 'bg-rose-500' : checking || degraded ? 'bg-amber-500' : 'bg-slate-400'}`} />{label}</span>;
}
