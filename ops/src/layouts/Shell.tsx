import type { ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { path: '/', label: 'Dashboard', icon: 'solar:siren-linear' },
  { path: '/analytics', label: 'Analytics', icon: 'solar:chart-2-linear' },
  { path: '/bookings', label: 'Bookings', icon: 'solar:calendar-linear' },
  { path: '/cleaners', label: 'Cleaners', icon: 'solar:users-group-rounded-linear' },
  { path: '/payouts', label: 'Payouts', icon: 'solar:wallet-linear' },
] as const

export function Shell({ children }: { children: ReactNode }) {
  const { opsUser, logout } = useAuth()

  return (
    <div className="min-h-dvh bg-background">
      <header className="bg-ink text-ink-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Muncie Maids</p>
            <h1 className="font-heading text-lg font-extrabold">Ops</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{opsUser?.name || opsUser?.email}</p>
              <p className="text-[11px] text-ink-foreground/50 uppercase tracking-wide">{opsUser?.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Icon icon="solar:logout-2-linear" className="text-lg" />
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar">
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-white'
                    : 'border-transparent text-ink-foreground/50 hover:text-ink-foreground/80'
                }`
              }
            >
              <Icon icon={item.icon} className="text-base" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
