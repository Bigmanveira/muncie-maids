import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { StepHeader } from '../components/StepHeader'
import { SummaryBar } from '../components/SummaryBar'
import { useFunnel } from '../context/FunnelContext'
import { useAuth } from '../context/AuthContext'
import { findAreaForZip, useServiceAreas } from '../context/ServiceAreasContext'
import { isValidEmail, isValidPhone, isValidZip } from '../lib/validation'
import type { DetailsInputs } from '../types'

const EMPTY: DetailsInputs = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  addressLine: '',
  city: '',
  zip: '',
  entryNotes: '',
  hasPets: false,
}

export function Details() {
  const navigate = useNavigate()
  const location = useLocation()
  const bannerMessage = (location.state as { message?: string } | null)?.message
  const { state, setDetails } = useFunnel()
  const { user } = useAuth()
  const { areas, loading: areasLoading, error: areasError } = useServiceAreas()
  const [form, setForm] = useState<DetailsInputs>(() => {
    if (state.details) return state.details
    const home = user?.homeProfile
    return {
      customerName: user?.name ?? EMPTY.customerName,
      customerPhone: user?.phone ?? EMPTY.customerPhone,
      customerEmail: user?.email ?? EMPTY.customerEmail,
      addressLine: home?.addressLine ?? EMPTY.addressLine,
      city: home?.city ?? EMPTY.city,
      zip: home?.zip ?? EMPTY.zip,
      entryNotes: home?.entryNotes ?? EMPTY.entryNotes,
      hasPets: home?.hasPets ?? EMPTY.hasPets,
    }
  })
  const [touched, setTouched] = useState<Partial<Record<keyof DetailsInputs, boolean>>>({})

  const matchedArea = useMemo(
    () => (isValidZip(form.zip) ? findAreaForZip(areas, form.zip.trim()) : null),
    [areas, form.zip],
  )
  const zipComplete = isValidZip(form.zip)
  const outOfArea = zipComplete && !areasLoading && !areasError && !matchedArea

  const errors: Partial<Record<keyof DetailsInputs, string>> = {
    customerName: form.customerName.trim() ? undefined : 'Enter your name',
    customerPhone: isValidPhone(form.customerPhone) ? undefined : 'Enter a valid 10-digit phone number',
    customerEmail: isValidEmail(form.customerEmail) ? undefined : 'Enter a valid email address',
    addressLine: form.addressLine.trim() ? undefined : 'Enter your street address',
    zip: zipComplete ? undefined : 'Enter a 5-digit zip code',
  }

  const canContinue = !Object.values(errors).some(Boolean) && !areasError && !outOfArea && !!matchedArea

  function update<K extends keyof DetailsInputs>(key: K, value: DetailsInputs[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function markTouched(key: keyof DetailsInputs) {
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  function handleContinue() {
    if (!canContinue || !matchedArea) return
    setDetails({ ...form, city: matchedArea.city })
    navigate('/photos')
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <StepHeader step={3} />

      <div className="px-6 flex-1 space-y-8 pb-56 max-w-md mx-auto w-full">
        {bannerMessage && (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{bannerMessage}</p>
          </div>
        )}

        <section className="space-y-6">
          <h3 className="font-bold text-foreground text-lg">Contact info</h3>

          <div>
            <label htmlFor="customerName" className="block text-sm font-bold text-foreground mb-3 ml-1">
              Full name
            </label>
            <input
              id="customerName"
              type="text"
              value={form.customerName}
              onChange={(e) => update('customerName', e.target.value)}
              onBlur={() => markTouched('customerName')}
              className="w-full min-h-11 bg-card border border-border rounded-[24px] px-5 py-4.5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none shadow-sm"
              placeholder="Jane Doe"
            />
            {touched.customerName && errors.customerName && (
              <p className="text-[11px] text-destructive font-bold mt-2.5 ml-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label htmlFor="customerPhone" className="block text-sm font-bold text-foreground mb-3 ml-1">
              Contact phone
            </label>
            <input
              id="customerPhone"
              type="tel"
              value={form.customerPhone}
              onChange={(e) => update('customerPhone', e.target.value)}
              onBlur={() => markTouched('customerPhone')}
              className="w-full min-h-11 bg-card border border-border rounded-[24px] px-5 py-4.5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none shadow-sm"
              placeholder="(765) 555-0100"
            />
            {touched.customerPhone && errors.customerPhone && (
              <p className="text-[11px] text-destructive font-bold mt-2.5 ml-1">{errors.customerPhone}</p>
            )}
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-bold text-foreground mb-3 ml-1">
              Email
            </label>
            <input
              id="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={(e) => update('customerEmail', e.target.value)}
              onBlur={() => markTouched('customerEmail')}
              className="w-full min-h-11 bg-card border border-border rounded-[24px] px-5 py-4.5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none shadow-sm"
              placeholder="jane@example.com"
            />
            {touched.customerEmail && errors.customerEmail && (
              <p className="text-[11px] text-destructive font-bold mt-2.5 ml-1">{errors.customerEmail}</p>
            )}
          </div>
        </section>

        <section className="bg-card rounded-[28px] p-6 shadow-sm border border-border space-y-6">
          <h3 className="font-bold text-foreground text-lg">Service location</h3>

          <div>
            <label htmlFor="addressLine" className="block text-sm font-bold text-foreground mb-3 ml-1">
              Street address
            </label>
            <input
              id="addressLine"
              type="text"
              value={form.addressLine}
              onChange={(e) => update('addressLine', e.target.value)}
              onBlur={() => markTouched('addressLine')}
              className="w-full min-h-11 bg-background border border-border rounded-[24px] px-5 py-4.5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
              placeholder="1200 W University Ave"
            />
            {touched.addressLine && errors.addressLine && (
              <p className="text-[11px] text-destructive font-bold mt-2.5 ml-1">{errors.addressLine}</p>
            )}
          </div>

          <div>
            <label htmlFor="zip" className="block text-sm font-bold text-foreground mb-3 ml-1">
              Zip code
            </label>
            <input
              id="zip"
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={form.zip}
              onChange={(e) => update('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
              onBlur={() => markTouched('zip')}
              className="w-full min-h-11 bg-background border border-border rounded-[24px] px-5 py-4.5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
              placeholder="47306"
            />
            {touched.zip && errors.zip && <p className="text-[11px] text-destructive font-bold mt-2.5 ml-1">{errors.zip}</p>}
            {matchedArea && (
              <p className="text-[11px] text-secondary font-bold mt-2.5 ml-1 flex items-center gap-1">
                <Icon icon="solar:map-point-bold" className="text-sm" />
                {matchedArea.city}, IN
              </p>
            )}
          </div>

          {zipComplete && areasError && (
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-5 flex items-start gap-3">
              <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
              <p className="text-sm text-foreground font-medium">
                Couldn't check service areas right now. Please try again.
              </p>
            </div>
          )}

          {outOfArea && (
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-5 flex items-start gap-3">
              <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
              <p className="text-sm text-foreground font-medium">
                We're not in {form.zip} yet — we serve Muncie, Yorktown, Gaston, and Albany.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <label htmlFor="entryNotes" className="block text-sm font-bold text-foreground mb-3 ml-1">
              How do we get in?
            </label>
            <textarea
              id="entryNotes"
              value={form.entryNotes}
              onChange={(e) => update('entryNotes', e.target.value)}
              className="w-full bg-card border border-border rounded-[24px] p-5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none h-32 placeholder:text-muted-foreground/40 shadow-sm"
              placeholder="e.g. Hidden key under mat, garage code 1234, someone will be home..."
            />
          </div>

          <div className="flex items-center justify-between bg-card border border-border rounded-[24px] px-5 py-4.5 shadow-sm">
            <div className="flex items-center gap-3">
              <Icon icon="ph:dog-bold" className="text-primary text-xl" />
              <span className="font-bold text-foreground text-sm">Do you have pets at home?</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.hasPets}
              onClick={() => update('hasPets', !form.hasPets)}
              className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${
                form.hasPets ? 'bg-secondary justify-end' : 'bg-muted justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-border z-20 transform-gpu">
        <div className="max-w-md mx-auto">
          <SummaryBar />
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Continue to Pay
          </button>
        </div>
      </div>
    </div>
  )
}
