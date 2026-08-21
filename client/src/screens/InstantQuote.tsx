import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { StepHeader } from '../components/StepHeader'
import { Chip } from '../components/Chip'
import { useFunnel } from '../context/FunnelContext'
import { usePricingConfig } from '../context/PricingConfigContext'
import { calculatePrice, estimateDurationHours } from '../lib/pricing'
import { formatPrice } from '../lib/format'
import { BATHROOM_OPTIONS, BEDROOM_OPTIONS, CLEAN_TYPE_OPTIONS, FREQUENCY_OPTIONS, SQFT_OPTIONS } from '../lib/quoteOptions'
import { useAuth } from '../context/AuthContext'
import type { QuoteInputs } from '../types'

const DEFAULT_INPUTS: QuoteInputs = {
  bedrooms: '2',
  bathrooms: '1.5',
  sqftBand: '1000_1800',
  cleanType: 'standard',
  frequency: 'biweekly',
}

export function InstantQuote() {
  const navigate = useNavigate()
  const { state, setQuote } = useFunnel()
  const { user } = useAuth()
  const { config, loading, error } = usePricingConfig()
  const [inputs, setInputs] = useState<QuoteInputs>(() => {
    if (state.quote) return state.quote
    const home = user?.homeProfile
    if (!home) return DEFAULT_INPUTS
    return {
      bedrooms: home.bedrooms ?? DEFAULT_INPUTS.bedrooms,
      bathrooms: home.bathrooms ?? DEFAULT_INPUTS.bathrooms,
      sqftBand: home.sqftBand ?? DEFAULT_INPUTS.sqftBand,
      cleanType: DEFAULT_INPUTS.cleanType,
      frequency: home.preferredFrequency ?? DEFAULT_INPUTS.frequency,
    }
  })

  const price = useMemo(() => (config ? calculatePrice(inputs, config) : null), [inputs, config])
  const durationHours = useMemo(() => estimateDurationHours(inputs), [inputs])

  function update<K extends keyof QuoteInputs>(key: K, value: QuoteInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  function handleBook() {
    if (price == null) return
    setQuote(inputs, price)
    navigate('/schedule')
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <StepHeader step={1} />

      <div className="px-6 flex-1 space-y-10 pb-80 max-w-md mx-auto w-full">
        <section>
          <h3 className="font-bold text-foreground text-lg mb-5">How many bedrooms?</h3>
          <div className="flex flex-wrap gap-2.5">
            {BEDROOM_OPTIONS.map((opt) => (
              <Chip key={opt.value} selected={inputs.bedrooms === opt.value} onClick={() => update('bedrooms', opt.value)}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-foreground text-lg mb-5">How many bathrooms?</h3>
          <div className="flex flex-wrap gap-2.5">
            {BATHROOM_OPTIONS.map((opt) => (
              <Chip key={opt.value} selected={inputs.bathrooms === opt.value} onClick={() => update('bathrooms', opt.value)}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-foreground text-lg mb-5">Home size</h3>
          <div className="flex flex-wrap gap-2.5">
            {SQFT_OPTIONS.map((opt) => (
              <Chip key={opt.value} selected={inputs.sqftBand === opt.value} onClick={() => update('sqftBand', opt.value)}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-foreground text-lg mb-5">Clean type</h3>
          <div className="grid grid-cols-3 gap-3">
            {CLEAN_TYPE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                selected={inputs.cleanType === opt.value}
                onClick={() => update('cleanType', opt.value)}
                className="text-center justify-center"
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-foreground text-lg mb-5">Frequency</h3>
          <div className="grid grid-cols-2 gap-3">
            {FREQUENCY_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                selected={inputs.frequency === opt.value}
                onClick={() => update('frequency', opt.value)}
                className="justify-center"
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-border z-20 transform-gpu">
        <div className="max-w-md mx-auto">
        <div className="bg-card rounded-[28px] p-6 shadow-xl border border-border flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1.5">Live Price</p>
            {error ? (
              <p className="text-sm text-destructive font-bold">Couldn't load pricing. Pull to refresh.</p>
            ) : loading || price == null ? (
              <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
            ) : (
              <div key={price} className="flex items-baseline gap-1 price-fade">
                <span className="text-4xl font-extrabold text-primary">{formatPrice(price)}</span>
                <span className="text-sm text-muted-foreground font-medium">/clean</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold bg-muted px-2.5 py-1 rounded-full">
              <Icon icon="solar:clock-circle-bold" className="text-primary" />
              {durationHours} hrs
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleBook}
          disabled={price == null}
          className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          Book this clean
        </button>
        </div>
      </div>
    </div>
  )
}
