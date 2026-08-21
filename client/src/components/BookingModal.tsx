import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { Chip } from './Chip'
import { useFunnel } from '../context/FunnelContext'
import { usePricingConfig } from '../context/PricingConfigContext'
import { useAuth } from '../context/AuthContext'
import { findAreaForZip, useServiceAreas } from '../context/ServiceAreasContext'
import { calculatePrice, estimateDurationHours } from '../lib/pricing'
import { formatPrice } from '../lib/format'
import { isValidEmail, isValidPhone, isValidZip } from '../lib/validation'
import { BOOKING_WINDOW_DAYS, TIME_WINDOWS, firstBookableDate, isBookableDate } from '../lib/dates'
import { BATHROOM_OPTIONS, BEDROOM_OPTIONS, CLEAN_TYPE_OPTIONS, FREQUENCY_OPTIONS, SQFT_OPTIONS } from '../lib/quoteOptions'
import type { Bathrooms, Bedrooms, CleanType, Frequency, SqftBand } from '../types'

function toIsoLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MAX_DATE = toIsoLocal(new Date(Date.now() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000))

interface FormState {
  customerName: string
  customerEmail: string
  customerPhone: string
  zip: string
  addressLine: string
  bedrooms: Bedrooms
  bathrooms: Bathrooms
  sqftBand: SqftBand
  cleanType: CleanType
  frequency: Frequency
  serviceDate: string
  timeWindow: string
  entryNotes: string
  hasPets: boolean
}

const inputClass =
  'w-full min-h-11 bg-card border border-border rounded-[24px] px-5 py-4 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none shadow-sm'

const dateInputClass = `${inputClass} date-input`

export function BookingModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { state, setQuote, setSchedule, setDetails } = useFunnel()
  const { user } = useAuth()
  const { config, loading: pricingLoading, error: pricingError } = usePricingConfig()
  const { areas, loading: areasLoading, error: areasError } = useServiceAreas()

  const [form, setForm] = useState<FormState>(() => {
    const home = user?.homeProfile
    return {
      customerName: state.details?.customerName ?? user?.name ?? '',
      customerEmail: state.details?.customerEmail ?? user?.email ?? '',
      customerPhone: state.details?.customerPhone ?? user?.phone ?? '',
      zip: state.details?.zip ?? home?.zip ?? '',
      addressLine: state.details?.addressLine ?? home?.addressLine ?? '',
      bedrooms: state.quote?.bedrooms ?? home?.bedrooms ?? '2',
      bathrooms: state.quote?.bathrooms ?? home?.bathrooms ?? '1.5',
      sqftBand: state.quote?.sqftBand ?? home?.sqftBand ?? '1000_1800',
      cleanType: state.quote?.cleanType ?? 'standard',
      frequency: state.quote?.frequency ?? home?.preferredFrequency ?? 'biweekly',
      serviceDate: state.schedule?.serviceDate ?? firstBookableDate(),
      timeWindow: state.schedule?.timeWindow ?? '',
      entryNotes: state.details?.entryNotes ?? home?.entryNotes ?? '',
      hasPets: state.details?.hasPets ?? home?.hasPets ?? false,
    }
  })
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)

    // iOS Safari ignores `overflow: hidden` on the body for touch scrolling, so the
    // page behind the modal still rubber-bands and shifts while the user swipes
    // inside it. Pinning the body with `position: fixed` at its current scroll
    // offset is the reliable cross-browser way to lock background scroll.
    const scrollY = window.scrollY
    const { body } = document
    const prevPosition = body.style.position
    const prevTop = body.style.top
    const prevLeft = body.style.left
    const prevRight = body.style.right
    const prevWidth = body.style.width
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'

    return () => {
      document.removeEventListener('keydown', handleKey)
      body.style.position = prevPosition
      body.style.top = prevTop
      body.style.left = prevLeft
      body.style.right = prevRight
      body.style.width = prevWidth
      window.scrollTo(0, scrollY)
    }
  }, [onClose])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const quoteInputs = useMemo(
    () => ({
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      sqftBand: form.sqftBand,
      cleanType: form.cleanType,
      frequency: form.frequency,
    }),
    [form.bedrooms, form.bathrooms, form.sqftBand, form.cleanType, form.frequency],
  )
  const price = useMemo(() => (config ? calculatePrice(quoteInputs, config) : null), [quoteInputs, config])
  const durationHours = useMemo(() => estimateDurationHours(quoteInputs), [quoteInputs])

  const matchedArea = useMemo(
    () => (isValidZip(form.zip) ? findAreaForZip(areas, form.zip.trim()) : null),
    [areas, form.zip],
  )
  const zipComplete = isValidZip(form.zip)
  const outOfArea = zipComplete && !areasLoading && !areasError && !matchedArea
  const dateOk = useMemo(() => {
    const [y, m, d] = form.serviceDate.split('-').map(Number)
    return isBookableDate(new Date(y, m - 1, d))
  }, [form.serviceDate])

  const errors: Partial<Record<keyof FormState, string>> = {
    customerName: form.customerName.trim() ? undefined : 'Enter your name',
    customerEmail: isValidEmail(form.customerEmail) ? undefined : 'Enter a valid email',
    customerPhone: isValidPhone(form.customerPhone) ? undefined : 'Enter a valid 10-digit phone',
    zip: zipComplete ? undefined : 'Enter a 5-digit zip',
    addressLine: form.addressLine.trim() ? undefined : 'Enter your street address',
    timeWindow: form.timeWindow ? undefined : 'Pick an arrival window',
    serviceDate: dateOk ? undefined : "We're closed Sundays — pick another date",
  }
  const canSubmit = !Object.values(errors).some(Boolean) && !!matchedArea && price != null

  function handleSubmit() {
    setAttempted(true)
    if (!canSubmit || !matchedArea || price == null) return
    setQuote(quoteInputs, price)
    setSchedule({ serviceDate: form.serviceDate, timeWindow: form.timeWindow })
    setDetails({
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim(),
      addressLine: form.addressLine.trim(),
      city: matchedArea.city,
      zip: form.zip.trim(),
      entryNotes: form.entryNotes.trim(),
      hasPets: form.hasPets,
    })
    onClose()
    navigate('/photos')
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-[32px] max-w-2xl w-full my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background rounded-t-[32px] z-10">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-foreground">Book your cleaning</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Instant price, in about 60 seconds.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0"
          >
            <Icon icon="solar:close-circle-linear" className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-2 ml-1">Full name</label>
              <input
                value={form.customerName}
                onChange={(e) => update('customerName', e.target.value)}
                placeholder="Jane Doe"
                className={inputClass}
              />
              {attempted && errors.customerName && <p className="text-[11px] text-destructive font-bold mt-2 ml-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-2 ml-1">Email</label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => update('customerEmail', e.target.value)}
                placeholder="jane@example.com"
                className={inputClass}
              />
              {attempted && errors.customerEmail && <p className="text-[11px] text-destructive font-bold mt-2 ml-1">{errors.customerEmail}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-2 ml-1">Phone</label>
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => update('customerPhone', e.target.value)}
                placeholder="(765) 555-0100"
                className={inputClass}
              />
              {attempted && errors.customerPhone && <p className="text-[11px] text-destructive font-bold mt-2 ml-1">{errors.customerPhone}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-2 ml-1">Zip</label>
              <input
                inputMode="numeric"
                maxLength={5}
                value={form.zip}
                onChange={(e) => update('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="47306"
                className={inputClass}
              />
              {attempted && errors.zip && <p className="text-[11px] text-destructive font-bold mt-2 ml-1">{errors.zip}</p>}
              {outOfArea && <p className="text-[11px] text-destructive font-bold mt-2 ml-1">Outside our service area (Muncie, Yorktown, Gaston, Albany)</p>}
              {matchedArea && <p className="text-[11px] text-secondary font-bold mt-2 ml-1">{matchedArea.city}, IN</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-foreground mb-2 ml-1">Street address</label>
              <input
                value={form.addressLine}
                onChange={(e) => update('addressLine', e.target.value)}
                placeholder="1200 W University Ave"
                className={inputClass}
              />
              {attempted && errors.addressLine && <p className="text-[11px] text-destructive font-bold mt-2 ml-1">{errors.addressLine}</p>}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-foreground mb-2.5 ml-1">Service</p>
              <div className="flex flex-wrap gap-2">
                {CLEAN_TYPE_OPTIONS.map((o) => (
                  <Chip key={o.value} selected={form.cleanType === o.value} onClick={() => update('cleanType', o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-2.5 ml-1">Frequency</p>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_OPTIONS.map((o) => (
                  <Chip key={o.value} selected={form.frequency === o.value} onClick={() => update('frequency', o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-2.5 ml-1">Bedrooms</p>
              <div className="flex flex-wrap gap-2">
                {BEDROOM_OPTIONS.map((o) => (
                  <Chip key={o.value} selected={form.bedrooms === o.value} onClick={() => update('bedrooms', o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-2.5 ml-1">Bathrooms</p>
              <div className="flex flex-wrap gap-2">
                {BATHROOM_OPTIONS.map((o) => (
                  <Chip key={o.value} selected={form.bathrooms === o.value} onClick={() => update('bathrooms', o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-2.5 ml-1">Home size</p>
              <div className="flex flex-wrap gap-2">
                {SQFT_OPTIONS.map((o) => (
                  <Chip key={o.value} selected={form.sqftBand === o.value} onClick={() => update('sqftBand', o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-2 ml-1">Date</label>
              <input
                type="date"
                value={form.serviceDate}
                min={firstBookableDate()}
                max={MAX_DATE}
                onChange={(e) => update('serviceDate', e.target.value)}
                className={dateInputClass}
              />
              {attempted && errors.serviceDate && <p className="text-[11px] text-destructive font-bold mt-2 ml-1">{errors.serviceDate}</p>}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-2.5 ml-1">Arrival window</p>
              <div className="flex flex-wrap gap-2">
                {TIME_WINDOWS.map((w) => (
                  <Chip key={w.value} selected={form.timeWindow === w.value} onClick={() => update('timeWindow', w.value)}>
                    {w.label}
                  </Chip>
                ))}
              </div>
              {attempted && errors.timeWindow && <p className="text-[11px] text-destructive font-bold mt-2 ml-1">{errors.timeWindow}</p>}
            </div>
          </div>

          <details className="group">
            <summary className="text-xs font-bold text-secondary cursor-pointer list-none flex items-center gap-1.5">
              <Icon icon="solar:alt-arrow-down-linear" className="transition-transform group-open:rotate-180" />
              Entry notes &amp; pets (optional)
            </summary>
            <div className="mt-4 space-y-4">
              <textarea
                value={form.entryNotes}
                onChange={(e) => update('entryNotes', e.target.value)}
                placeholder="e.g. Hidden key under mat, garage code 1234, someone will be home..."
                className="w-full bg-card border border-border rounded-[24px] p-5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none h-24 placeholder:text-muted-foreground/40 shadow-sm"
              />
              <div className="flex items-center justify-between bg-card border border-border rounded-[24px] px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Icon icon="ph:dog-bold" className="text-primary text-xl" />
                  <span className="font-bold text-foreground text-sm">Pets at home?</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.hasPets}
                  onClick={() => update('hasPets', !form.hasPets)}
                  className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${form.hasPets ? 'bg-secondary justify-end' : 'bg-muted justify-start'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </details>

          <div className="bg-card rounded-[24px] p-5 border border-border shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1.5">Live Price</p>
              {pricingError ? (
                <p className="text-sm text-destructive font-bold">Couldn't load pricing.</p>
              ) : pricingLoading || price == null ? (
                <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
              ) : (
                <div key={price} className="flex items-baseline gap-1 price-fade">
                  <span className="text-3xl font-extrabold text-primary">{formatPrice(price)}</span>
                  <span className="text-sm text-muted-foreground font-medium">/clean</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold bg-muted px-2.5 py-1.5 rounded-full shrink-0">
              <Icon icon="solar:clock-circle-bold" className="text-primary" />
              {durationHours} hrs
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
            disabled={pricingLoading || price == null}
          >
            {price != null ? `Continue to Pay — ${formatPrice(price)}` : 'Continue to Pay'}
          </button>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            By continuing, you consent to receive email updates about your booking — confirmations, reminders, and
            occasional offers from Muncie Maids. Unsubscribe anytime. See our{' '}
            <a href="/privacy" className="underline font-bold">Privacy Policy</a> and{' '}
            <a href="/terms" className="underline font-bold">Terms of Service</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
