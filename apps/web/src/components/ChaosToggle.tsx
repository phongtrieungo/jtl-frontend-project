import { useAtom } from 'jotai';
import { isChaosActiveAtom } from '@todo/shared';
export function ChaosToggle() {
  const [enabled, setEnabled] = useAtom(isChaosActiveAtom);
  return <button type="button" aria-pressed={enabled} onClick={() => setEnabled(!enabled)} className={`rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${enabled ? 'border border-amber-300 bg-amber-50 text-amber-800' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{enabled ? 'Chaos on' : 'Chaos off'}</button>;
}
