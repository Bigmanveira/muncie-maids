import { Icon } from '@iconify/react'
import { useAuth } from '../context/AuthContext'

export function Unauthorized() {
  const { logout, refresh } = useAuth()

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center text-center gap-4 px-6">
      <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
        <Icon icon="solar:shield-cross-bold" className="text-secondary text-3xl" />
      </div>
      <h2 className="font-heading text-xl font-extrabold text-foreground">Access not granted</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        Your account isn't authorized for the ops portal yet. Ask an existing owner to add your email under Cleaners
        &rarr; Ops Users.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={refresh}
          className="bg-card border border-border font-bold text-foreground px-5 py-2.5 rounded-full shadow-sm active:scale-[0.98] transition-all"
        >
          I've been added
        </button>
        <button type="button" onClick={logout} className="text-sm font-bold text-secondary px-3 py-2.5">
          Sign Out
        </button>
      </div>
    </div>
  )
}
