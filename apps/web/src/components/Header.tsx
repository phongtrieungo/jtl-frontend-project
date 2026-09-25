import { Link, useNavigate } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import { activeUserIdAtom } from '@todo/shared';
import { useUsers } from '@todo/users';
import { BackendStatusBadge } from './BackendStatusBadge';
import { ChaosToggle } from './ChaosToggle';

export function Header() {
  const [activeUserId, setActiveUserId] = useAtom(activeUserIdAtom);
  const { data: users = [] } = useUsers();
  const navigate = useNavigate();
  const navClass = 'rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600';
  return <header role="banner" className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8"><div className="flex flex-wrap items-center justify-between gap-4"><Link to="/" className="text-lg font-bold tracking-tight text-slate-950">Task<span className="text-indigo-600">well</span></Link><div className="flex flex-wrap items-center gap-3"><label className="sr-only" htmlFor="active-user">Active user</label><select id="active-user" aria-label="Active user" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" value={activeUserId ?? ''} onChange={(event) => { const userId = event.target.value || null; setActiveUserId(userId); if (userId) void navigate({ to: '/todos', search: { userId } }); }}><option value="">Choose user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}</select><ChaosToggle /><BackendStatusBadge /></div></div><nav aria-label="Main Navigation" className="flex gap-1 text-sm font-medium"><Link to="/" activeProps={{ className: 'bg-indigo-50 text-indigo-700' }} className={navClass}>Dashboard</Link><Link to="/users" activeProps={{ className: 'bg-indigo-50 text-indigo-700' }} className={navClass}>Users</Link><Link to="/todos" search={{ userId: activeUserId ?? undefined }} activeProps={{ className: 'bg-indigo-50 text-indigo-700' }} className={navClass}>Todos</Link></nav></div></header>;
}
