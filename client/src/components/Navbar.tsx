import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { Avatar } from './Avatar'
import { useAuth } from '../context/AuthContext'

const LINKS = [
  { label: 'Home', to: '/home' },
  { label: 'Reviews', to: '/home#reviews' },
  { label: 'My Bookings', to: '/bookings' },
] as const

/** Top navbar. Desktop (lg:+) shows nav items inline in the bar; mobile keeps
 * the hamburger-triggered dropdown, where there isn't room for inline links. */
export function Navbar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  return (
    <header className="flex lg:grid lg:grid-cols-[1fr_auto_1fr] sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 items-center justify-between gap-4 px-5 sm:px-8 py-3 sm:py-4">
      <button type="button" onClick={() => go('/home')} className="flex items-center gap-3 shrink-0 justify-self-start">
        <Logo size={40} />
        <span className="font-heading font-extrabold text-lg text-foreground tracking-tight">Muncie Maids</span>
      </button>

      {/* Desktop: nav items dead-center in the bar */}
      <nav className="hidden lg:flex items-center gap-1 justify-self-center">
        {LINKS.map((link) => (
          <button
            key={link.to}
            type="button"
            onClick={() => go(link.to)}
            className="px-4 py-2.5 rounded-full text-sm font-bold text-foreground hover:bg-card transition-colors"
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2 justify-self-end">
        {user && (
          <button
            type="button"
            onClick={() => go('/notifications')}
            aria-label="Notifications"
            className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center shadow-sm text-foreground active:scale-95 transition-transform"
          >
            <Icon icon="solar:bell-linear" className="text-xl" />
          </button>
        )}

        {/* Desktop: auth state inline, no hamburger needed */}
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <button
              type="button"
              onClick={() => go('/profile')}
              className="flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full hover:bg-card transition-colors"
            >
              <Avatar name={user.name} photoUrl={user.homeProfile.avatarDataUrl} size={32} />
              <span className="text-sm font-bold text-foreground">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => go('/login')}
                className="px-4 py-2.5 rounded-full text-sm font-bold text-secondary hover:bg-card transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => go('/signup')}
                className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm active:scale-[0.98] transition-all"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile: hamburger-triggered dropdown */}
        <div className="relative lg:hidden" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={open}
            className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center shadow-sm text-foreground active:scale-95 transition-transform"
          >
            <Icon icon={open ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} className="text-xl" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-lg p-2 z-30">
              {LINKS.map((link) => (
                <button
                  key={link.to}
                  type="button"
                  onClick={() => go(link.to)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="h-px bg-border my-1.5" />
              {user ? (
                <button
                  type="button"
                  onClick={() => go('/profile')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <Avatar name={user.name} photoUrl={user.homeProfile.avatarDataUrl} size={32} />
                  <span className="text-sm font-bold text-foreground">{user.name.split(' ')[0]}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => go('/login')}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-secondary hover:bg-muted transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => go('/signup')}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-primary hover:bg-muted transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
