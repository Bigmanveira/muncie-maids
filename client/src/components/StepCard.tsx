import { Icon } from '@iconify/react'
import type { STEPS } from '../lib/howItWorks'

export function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div className="price-fade bg-card rounded-[24px] p-5 border border-border shadow-sm relative overflow-hidden">
      <Icon icon={step.icon} className={`absolute -right-3 -top-3 text-6xl opacity-[0.07] ${step.badgeClass.split(' ')[1]}`} />
      <div className="flex items-center gap-3 mb-4 relative">
        <div className={`w-11 h-11 rounded-2xl ${step.badgeClass} flex items-center justify-center`}>
          <Icon icon={step.icon} className="text-xl" />
        </div>
        <div className={`w-6 h-6 rounded-full ${step.badgeClass} flex items-center justify-center font-bold text-xs`}>
          {step.n}
        </div>
      </div>
      <h3 className="text-sm font-bold leading-tight mb-1 relative">{step.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed relative">{step.text}</p>
    </div>
  )
}
