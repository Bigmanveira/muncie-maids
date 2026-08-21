import { Icon } from '@iconify/react'
import { useAuth } from '../context/AuthContext'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function TopBar({ title }: { title: string }) {
  const { cleaner, logout } = useAuth()

  return (
    <header className="px-6 pt-8 pb-4 max-w-md mx-auto w-full flex items-center justify-between">
      <div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em]">
          {greeting()}, {cleaner?.name.split(' ')[0]}
        </p>
        <h1 className="font-heading text-2xl font-extrabold text-foreground mt-0.5">{title}</h1>
      </div>
      <button
        type="button"
        onClick={logout}
        aria-label="Sign out"
        className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center shadow-sm text-foreground active:scale-95 transition-transform"
      >
        <Icon icon="solar:logout-2-linear" className="text-lg" />
      </button>
    </header>
  )
}
