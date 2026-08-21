import { useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { SimpleHeader } from '../components/SimpleHeader'
import { OnboardingSteps } from '../components/OnboardingSteps'
import { Chip } from '../components/Chip'
import { TextField } from '../components/TextField'
import { useAuth } from '../context/AuthContext'
import { useTowns, SERVICE_OPTIONS } from '../lib/serviceAreas'

export function Application() {
  const { submitApplication } = useAuth()
  const { towns: availableTowns, loading: townsLoading } = useTowns()
  const [towns, setTowns] = useState<string[]>([])
  const [services, setServices] = useState<string[]>([])
  const [yearsExperience, setYearsExperience] = useState('')
  const [hasOwnEquipment, setHasOwnEquipment] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (towns.length === 0) return setError('Pick at least one town.')
    if (services.length === 0) return setError('Pick at least one service you offer.')
    const years = Number(yearsExperience)
    if (!yearsExperience || Number.isNaN(years) || years < 0) return setError('Enter your years of experience.')

    setSubmitting(true)
    setError(null)
    try {
      await submitApplication({ towns, services, yearsExperience: years, hasOwnEquipment })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your application.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SimpleHeader title="Your Application" fallback="/login" />

      <form onSubmit={handleSubmit} className="px-6 flex-1 flex flex-col max-w-md mx-auto w-full pb-8">
        <div className="mt-4">
          <OnboardingSteps current={0} />
        </div>
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Tell us about your work</h2>
          <p className="text-muted-foreground text-sm">This goes to our team for approval before your gig feed unlocks.</p>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="font-bold text-foreground text-lg mb-4">Towns you serve</h3>
            {townsLoading ? (
              <div className="h-10 w-full rounded-2xl bg-muted animate-pulse" />
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {availableTowns.map((town) => (
                  <Chip key={town} selected={towns.includes(town)} onClick={() => toggle(towns, setTowns, town)}>
                    {town}
                  </Chip>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="font-bold text-foreground text-lg mb-4">Services you offer</h3>
            <div className="flex flex-wrap gap-2.5">
              {SERVICE_OPTIONS.map((opt) => (
                <Chip key={opt.value} selected={services.includes(opt.value)} onClick={() => toggle(services, setServices, opt.value)}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </section>

          <TextField
            id="years"
            label="Years of cleaning experience"
            type="number"
            min="0"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="3"
          />

          <div className="flex items-center justify-between bg-card border border-border rounded-[24px] px-5 py-4.5 shadow-sm">
            <div className="flex items-center gap-3">
              <Icon icon="solar:box-bold" className="text-primary text-xl" />
              <span className="font-bold text-foreground text-sm">I bring my own equipment &amp; supplies</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hasOwnEquipment}
              onClick={() => setHasOwnEquipment((v) => !v)}
              className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors shrink-0 ${
                hasOwnEquipment ? 'bg-secondary justify-end' : 'bg-muted justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            As an independent contractor you're responsible for your own taxes. We'll collect a W-9 from you before your first payout.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-8"
        >
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
