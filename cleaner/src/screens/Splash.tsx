import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { SweepStripes } from '../components/SweepStripes'

const STATS = [
  { icon: 'solar:wallet-money-bold', label: '70% payout' },
  { icon: 'solar:bolt-bold', label: 'Same-day gigs' },
  { icon: 'solar:calendar-bold', label: 'Your schedule' },
] as const

export function Splash() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-ink flex flex-col">
      <div className="relative flex-1 flex flex-col justify-end px-6 pt-16 pb-14 overflow-hidden min-h-[60vh]">
        <SweepStripes />

        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-6">
            Muncie Maids &middot; Cleaner Portal
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-ink-foreground leading-[1.05] mb-4 max-w-xs">
            Your next gig is close by.
          </h1>
          <p className="text-ink-foreground/70 text-sm max-w-xs leading-relaxed mb-8">
            Claim cleaning jobs near you, work when you want, get paid 70% of every job you complete.
          </p>

          <div className="flex flex-wrap gap-2">
            {STATS.map((stat) => (
              <span
                key={stat.label}
                className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3.5 py-2 text-xs font-bold text-ink-foreground"
              >
                <Icon icon={stat.icon} className="text-primary text-sm" />
                {stat.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-background rounded-t-[36px] px-6 pt-8 pb-10 shadow-[0_-16px_40px_rgba(0,0,0,0.25)]">
        <div className="max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="w-full bg-card border border-border font-bold text-foreground py-5 rounded-full shadow-sm active:scale-[0.98] transition-all mt-3"
          >
            Apply to Clean
          </button>
          <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            Independent contractor work &bull; No minimum hours &bull; Choose your own jobs
          </p>
        </div>
      </div>
    </div>
  )
}
