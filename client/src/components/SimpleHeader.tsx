import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'

/** Back button + centered title, for non-funnel screens (auth, legal, notifications). */
export function SimpleHeader({ title, fallback = '/home' }: { title: string; fallback?: string }) {
  const navigate = useNavigate()

  return (
    <header className="px-6 pt-8 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-30 transform-gpu">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(fallback))}
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <Icon icon="solar:arrow-left-linear" className="text-xl text-foreground" />
        </button>
        <h1 className="font-bold text-foreground text-base tracking-tight">{title}</h1>
        <div className="w-10" />
      </div>
    </header>
  )
}
