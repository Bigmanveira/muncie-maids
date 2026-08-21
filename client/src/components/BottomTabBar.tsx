import { Icon } from '@iconify/react'
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/home', icon: 'solar:home-2-bold', activeIcon: 'solar:home-2-bold', label: 'Home' },
  { path: '/bookings', icon: 'solar:calendar-linear', activeIcon: 'solar:calendar-bold', label: 'Bookings' },
  { path: '/chat', icon: 'solar:chat-round-line-linear', activeIcon: 'solar:chat-round-bold', label: 'Chat' },
  { path: '/profile', icon: 'solar:user-circle-linear', activeIcon: 'solar:user-circle-bold', label: 'Profile' },
] as const

export function BottomTabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-6 sm:bottom-8 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 transform-gpu">
      <nav
        className="bg-secondary rounded-full h-16 sm:h-18 flex items-center px-4 sm:px-6 shadow-2xl border border-white/10"
        aria-label="Primary"
      >
        {TABS.map((tab) => {
          const active = location.pathname.startsWith(tab.path)
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              aria-current={active ? 'page' : undefined}
              aria-label={tab.label}
              className={`flex-1 flex flex-col items-center relative py-2 transition-opacity ${
                active ? 'opacity-100' : 'opacity-60 hover:opacity-90'
              }`}
            >
              <Icon icon={active ? tab.activeIcon : tab.icon} className="text-white text-2xl" />
              {active && <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
