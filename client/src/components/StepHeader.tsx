import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'

const STEPS = ['Service Details', 'Select Date & Time', 'Cleaning Details', 'Room Photos', 'Payment']

export function StepHeader({ step, title }: { step: 1 | 2 | 3 | 4 | 5; title?: string }) {
  const navigate = useNavigate()

  return (
    <header className="px-6 pt-8 pb-4 bg-background/80 backdrop-blur-md sticky top-0 z-30 transform-gpu">
      <div className="flex items-center justify-between mb-6 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <Icon icon="solar:arrow-left-linear" className="text-xl text-foreground" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Step {step} of 5
          </span>
          <span className="text-sm font-bold text-foreground">{title ?? STEPS[step - 1]}</span>
        </div>
        <div className="w-10" />
      </div>
    </header>
  )
}
