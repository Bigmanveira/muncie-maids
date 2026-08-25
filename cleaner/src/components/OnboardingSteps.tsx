const STEPS = ['Application', 'Verification', 'Agreement', 'Review'] as const

export function OnboardingSteps({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex-1">
          <div className={`h-1.5 rounded-full transition-colors ${i <= current ? 'bg-primary' : 'bg-border'}`} />
          <p className={`text-[10px] font-bold uppercase tracking-wide mt-2 ${i === current ? 'text-foreground' : 'text-muted-foreground/60'}`}>
            {step}
          </p>
        </div>
      ))}
    </div>
  )
}
