import { useRef, useState, type ChangeEvent } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { Chip } from '../components/Chip'
import { Avatar } from '../components/Avatar'
import { useAuth, type HomeProfile } from '../context/AuthContext'
import { useServiceAreas, findAreaForZip } from '../context/ServiceAreasContext'
import { BATHROOM_OPTIONS, BEDROOM_OPTIONS, FREQUENCY_OPTIONS, SQFT_OPTIONS } from '../lib/quoteOptions'
import { isValidZip } from '../lib/validation'

const STEP_COUNT = 4
const MAX_PHOTO_BYTES = 3 * 1024 * 1024

type Draft = Pick<
  HomeProfile,
  'avatarDataUrl' | 'bedrooms' | 'bathrooms' | 'sqftBand' | 'addressLine' | 'city' | 'zip' | 'entryNotes' | 'hasPets' | 'preferredFrequency'
>

export function Onboarding() {
  const navigate = useNavigate()
  const { user, updateHomeProfile } = useAuth()
  const { areas } = useServiceAreas()
  const [step, setStep] = useState(0)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [draft, setDraft] = useState<Draft>(() => ({
    avatarDataUrl: user?.homeProfile.avatarDataUrl ?? null,
    bedrooms: user?.homeProfile.bedrooms ?? null,
    bathrooms: user?.homeProfile.bathrooms ?? null,
    sqftBand: user?.homeProfile.sqftBand ?? null,
    addressLine: user?.homeProfile.addressLine ?? null,
    city: user?.homeProfile.city ?? null,
    zip: user?.homeProfile.zip ?? null,
    entryNotes: user?.homeProfile.entryNotes ?? null,
    hasPets: user?.homeProfile.hasPets ?? null,
    preferredFrequency: user?.homeProfile.preferredFrequency ?? null,
  }))

  if (!user) {
    navigate('/home', { replace: true })
    return null
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function persist(completed: boolean) {
    await updateHomeProfile({ ...draft, onboardingCompleted: completed, onboardingSkipped: !completed })
  }

  async function handleExit() {
    await persist(false)
    navigate('/home')
  }

  async function handleNext() {
    if (step === STEP_COUNT - 1) {
      await persist(true)
      navigate('/home')
      return
    }
    setStep((s) => s + 1)
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('That photo is too large — please choose one under 3MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => set('avatarDataUrl', reader.result as string)
    reader.readAsDataURL(file)
  }

  const matchedArea = draft.zip && isValidZip(draft.zip) ? findAreaForZip(areas, draft.zip) : null

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between max-w-md mx-auto mb-6">
          <button
            type="button"
            onClick={handleExit}
            aria-label="Finish later"
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <Icon icon="solar:close-circle-linear" className="text-xl text-foreground" />
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-secondary/20'}`} />
            ))}
          </div>
          <button type="button" onClick={handleNext} className="text-sm font-bold text-muted-foreground active:opacity-60 transition-opacity">
            Skip
          </button>
        </div>
      </header>

      <div className="px-6 flex-1 max-w-md mx-auto w-full">
        {step === 0 && (
          <div className="price-fade">
            <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Add a profile photo</h2>
            <p className="text-muted-foreground text-sm mb-10">Optional — helps your cleaning team recognize your account.</p>

            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative active:scale-95 transition-transform"
              >
                {draft.avatarDataUrl ? (
                  <img src={draft.avatarDataUrl} alt="" className="w-32 h-32 rounded-full object-cover border-2 border-white shadow-md" />
                ) : (
                  <Avatar name={user.name} size={128} />
                )}
                <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background shadow-md">
                  <Icon icon="solar:camera-bold" className="text-lg" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              {photoError && <p className="text-xs text-destructive font-bold mt-4">{photoError}</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="price-fade space-y-10">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Tell us about your home</h2>
              <p className="text-muted-foreground text-sm">We'll use this to speed up your next price and booking.</p>
            </div>
            <section>
              <h3 className="font-bold text-foreground text-lg mb-5">Bedrooms</h3>
              <div className="flex flex-wrap gap-2.5">
                {BEDROOM_OPTIONS.map((opt) => (
                  <Chip key={opt.value} selected={draft.bedrooms === opt.value} onClick={() => set('bedrooms', opt.value)}>
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </section>
            <section>
              <h3 className="font-bold text-foreground text-lg mb-5">Bathrooms</h3>
              <div className="flex flex-wrap gap-2.5">
                {BATHROOM_OPTIONS.map((opt) => (
                  <Chip key={opt.value} selected={draft.bathrooms === opt.value} onClick={() => set('bathrooms', opt.value)}>
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </section>
            <section>
              <h3 className="font-bold text-foreground text-lg mb-5">Home size</h3>
              <div className="flex flex-wrap gap-2.5">
                {SQFT_OPTIONS.map((opt) => (
                  <Chip key={opt.value} selected={draft.sqftBand === opt.value} onClick={() => set('sqftBand', opt.value)}>
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="price-fade space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Save your address</h2>
              <p className="text-muted-foreground text-sm">So you can book in one tap next time.</p>
            </div>
            <div>
              <label htmlFor="ob-address" className="block text-sm font-bold text-foreground mb-3 ml-1">
                Street address
              </label>
              <input
                id="ob-address"
                type="text"
                value={draft.addressLine ?? ''}
                onChange={(e) => set('addressLine', e.target.value)}
                placeholder="1200 W University Ave"
                className="w-full min-h-11 bg-card border border-border rounded-[24px] px-5 py-4.5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="ob-zip" className="block text-sm font-bold text-foreground mb-3 ml-1">
                Zip code
              </label>
              <input
                id="ob-zip"
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={draft.zip ?? ''}
                onChange={(e) => {
                  const zip = e.target.value.replace(/\D/g, '').slice(0, 5)
                  set('zip', zip)
                  const area = isValidZip(zip) ? findAreaForZip(areas, zip) : null
                  set('city', area?.city ?? null)
                }}
                placeholder="47306"
                className="w-full min-h-11 bg-card border border-border rounded-[24px] px-5 py-4.5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none shadow-sm"
              />
              {matchedArea && (
                <p className="text-[11px] text-secondary font-bold mt-2.5 ml-1 flex items-center gap-1">
                  <Icon icon="solar:map-point-bold" className="text-sm" />
                  {matchedArea.city}, IN
                </p>
              )}
            </div>
            <div>
              <label htmlFor="ob-entry" className="block text-sm font-bold text-foreground mb-3 ml-1">
                How do we get in?
              </label>
              <textarea
                id="ob-entry"
                value={draft.entryNotes ?? ''}
                onChange={(e) => set('entryNotes', e.target.value)}
                placeholder="e.g. Hidden key under mat, garage code 1234…"
                className="w-full bg-card border border-border rounded-[24px] p-5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none h-28 placeholder:text-muted-foreground/40 shadow-sm"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="price-fade space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Almost done</h2>
              <p className="text-muted-foreground text-sm">Last couple of things.</p>
            </div>
            <div className="flex items-center justify-between bg-card border border-border rounded-[24px] px-5 py-4.5 shadow-sm">
              <div className="flex items-center gap-3">
                <Icon icon="ph:dog-bold" className="text-primary text-xl" />
                <span className="font-bold text-foreground text-sm">Do you have pets at home?</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.hasPets ?? false}
                onClick={() => set('hasPets', !draft.hasPets)}
                className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${
                  draft.hasPets ? 'bg-secondary justify-end' : 'bg-muted justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
              </button>
            </div>
            <section>
              <h3 className="font-bold text-foreground text-lg mb-5">Preferred frequency</h3>
              <div className="grid grid-cols-2 gap-3">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    selected={draft.preferredFrequency === opt.value}
                    onClick={() => set('preferredFrequency', opt.value)}
                    className="justify-center"
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="p-6 max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={handleNext}
          className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          {step === STEP_COUNT - 1 ? 'Finish' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
