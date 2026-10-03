import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Smartphone,
  Upload,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { cx } from '../../lib/format'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/uploads', label: 'Statements', icon: Upload },
  { to: '/devices', label: 'Devices', icon: Smartphone },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-ink-800 bg-ink-950 px-4 py-5">
      <div className="flex items-center gap-2 px-2 mb-8">
        <Sparkles className="h-5 w-5 text-signal" strokeWidth={1.75} />
        <span className="font-display text-lg text-paper">FinanceLens</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-ink-850 text-paper font-medium'
                  : 'text-paper-dim hover:text-paper hover:bg-ink-900'
              )
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-800 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 text-sm font-medium text-paper">
            {user?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-paper">{user?.full_name}</p>
            <p className="truncate text-xs text-paper-faint capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-paper-dim hover:text-coral hover:bg-coral/5 transition-colors"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
