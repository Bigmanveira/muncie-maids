import { useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { SimpleHeader } from '../components/SimpleHeader'
import { OnboardingSteps } from '../components/OnboardingSteps'
import { TextField } from '../components/TextField'
import { StillPhotoCapture } from '../components/StillPhotoCapture'
import { useAuth, type ReferenceContact } from '../context/AuthContext'
import { uploadVerificationDoc, type DocKind } from '../lib/verificationDocs'

// Verification — the trust-and-safety step between the application and the
// agreement. Cleaners enter customers' homes, so before ops can approve we
// collect: legal identity, an ID document + profile photo, transportation,
// an emergency contact, two references, a work-eligibility attestation, and
// FCRA authorization for a background check. No SSN is collected here — the
// background-check provider gathers that on its own secure portal.

const EMPTY_REF: ReferenceContact = { name: '', relationship: '', phone: '' }

function age(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  const beforeBirthday =
    now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
  if (beforeBirthday) years -= 1
  return years
}

export function Verification() {
  const { cleaner, submitVerification, refreshCleaner } = useAuth()

  const [legalName, setLegalName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressState, setAddressState] = useState('IN')
  const [addressZip, setAddressZip] = useState('')
  const [hasTransportation, setHasTransportation] = useState(false)
  const [hasDriversLicense, setHasDriversLicense] = useState(false)
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [references, setReferences] = useState<ReferenceContact[]>([{ ...EMPTY_REF }, { ...EMPTY_REF }])
  const [workEligible, setWorkEligible] = useState(false)
  const [bgConsent, setBgConsent] = useState(false)

  const [idUploaded, setIdUploaded] = useState(Boolean(cleaner?.idDocumentPath))
  const [photoUploaded, setPhotoUploaded] = useState(Boolean(cleaner?.profilePhotoPath))
  const [capturing, setCapturing] = useState<DocKind | null>(null)
  const [uploading, setUploading] = useState<DocKind | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setReference(index: number, patch: Partial<ReferenceContact>) {
    setReferences((refs) => refs.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  async function handleCapture(kind: DocKind, file: File) {
    setCapturing(null)
    setUploading(kind)
    setError(null)
    try {
      await uploadVerificationDoc(kind, file)
      if (kind === 'id_document') setIdUploaded(true)
      else setPhotoUploaded(true)
      await refreshCleaner()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — please try again.')
    } finally {
      setUploading(null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!legalName.trim()) return setError('Enter your full legal name as it appears on your ID.')
    if (!dateOfBirth) return setError('Enter your date of birth.')
    if (age(dateOfBirth) < 18) return setError('You must be at least 18 to clean with us.')
    if (!addressLine1.trim() || !addressCity.trim() || !addressZip.trim()) {
      return setError('Fill in your full home address.')
    }
    if (!emergencyName.trim() || !emergencyPhone.trim()) return setError('Add an emergency contact.')
    const filledRefs = references.filter((r) => r.name.trim() && r.phone.trim())
    if (filledRefs.length < 2) return setError('Add two references with a name and phone number each.')
    if (!idUploaded) return setError('Upload a photo of your government-issued ID.')
    if (!photoUploaded) return setError('Add a profile photo so customers can recognize you.')
    if (!workEligible) return setError('Confirm you are legally eligible to work in the US.')
    if (!bgConsent) return setError('Authorize the background check to continue.')

    setSubmitting(true)
    setError(null)
    try {
      await submitVerification({
        legalName: legalName.trim(),
        dateOfBirth,
        addressLine1: addressLine1.trim(),
        addressCity: addressCity.trim(),
        addressState: addressState.trim() || 'IN',
        addressZip: addressZip.trim(),
        hasTransportation,
        hasDriversLicense,
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
        references: filledRefs.map((r) => ({
          name: r.name.trim(),
          relationship: r.relationship.trim(),
          phone: r.phone.trim(),
        })),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SimpleHeader title="Verify Your Identity" fallback="/login" />

      {capturing && (
        <StillPhotoCapture
          facing={capturing === 'profile_photo' ? 'user' : 'environment'}
          onCapture={(file) => void handleCapture(capturing, file)}
          onCancel={() => setCapturing(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="px-6 flex-1 flex flex-col max-w-md mx-auto w-full pb-8">
        <div className="mt-4">
          <OnboardingSteps current={1} />
        </div>
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Help customers trust you</h2>
          <p className="text-muted-foreground text-sm">
            You'll be working inside people's homes, so every cleaner is identity-verified and background-checked
            before their first gig. This is what sets Muncie Maids apart.
          </p>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="font-bold text-foreground text-lg">Legal identity</h3>
            <TextField
              id="legalName"
              label="Full legal name (as on your ID)"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Jordan A. Smith"
            />
            <TextField
              id="dob"
              label="Date of birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            <TextField
              id="address1"
              label="Home address"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="123 W Main St"
            />
            <div className="grid grid-cols-[1fr_4.5rem_5.5rem] gap-3">
              <TextField id="city" label="City" value={addressCity} onChange={(e) => setAddressCity(e.target.value)} placeholder="Muncie" />
              <TextField id="state" label="State" value={addressState} onChange={(e) => setAddressState(e.target.value)} placeholder="IN" />
              <TextField id="zip" label="ZIP" inputMode="numeric" value={addressZip} onChange={(e) => setAddressZip(e.target.value)} placeholder="47305" />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-foreground text-lg">Photos</h3>
            <DocTile
              icon="solar:card-bold"
              title="Government-issued photo ID"
              hint="Driver's license, state ID, or passport. Only our review team ever sees this."
              done={idUploaded}
              busy={uploading === 'id_document'}
              onClick={() => setCapturing('id_document')}
            />
            <DocTile
              icon="solar:user-circle-bold"
              title="Profile photo"
              hint="A clear, friendly headshot — customers see who's coming to their door."
              done={photoUploaded}
              busy={uploading === 'profile_photo'}
              onClick={() => setCapturing('profile_photo')}
            />
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-foreground text-lg">Getting to jobs</h3>
            <ToggleRow
              icon="solar:wheel-bold"
              label="I have reliable transportation"
              checked={hasTransportation}
              onChange={setHasTransportation}
            />
            <ToggleRow
              icon="solar:document-add-bold"
              label="I have a valid driver's license"
              checked={hasDriversLicense}
              onChange={setHasDriversLicense}
            />
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-foreground text-lg">Emergency contact</h3>
            <TextField
              id="emergencyName"
              label="Contact name"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="Alex Smith"
            />
            <TextField
              id="emergencyPhone"
              label="Contact phone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="(765) 555-0134"
            />
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="font-bold text-foreground text-lg">References</h3>
              <p className="text-muted-foreground text-xs mt-1">
                Two people who know your work — past clients, employers, or supervisors. We may call them.
              </p>
            </div>
            {references.map((ref, i) => (
              <div key={i} className="bg-card border border-border rounded-[24px] p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Reference {i + 1}</p>
                <TextField
                  id={`ref-name-${i}`}
                  label="Name"
                  value={ref.name}
                  onChange={(e) => setReference(i, { name: e.target.value })}
                  placeholder="Taylor Brown"
                />
                <TextField
                  id={`ref-rel-${i}`}
                  label="Relationship"
                  value={ref.relationship}
                  onChange={(e) => setReference(i, { relationship: e.target.value })}
                  placeholder="Past cleaning client"
                />
                <TextField
                  id={`ref-phone-${i}`}
                  label="Phone"
                  type="tel"
                  value={ref.phone}
                  onChange={(e) => setReference(i, { phone: e.target.value })}
                  placeholder="(765) 555-0198"
                />
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-foreground text-lg">Authorizations</h3>
            <CheckRow
              checked={workEligible}
              onChange={setWorkEligible}
              label="I confirm I am legally eligible to work in the United States."
            />
            <div className="bg-card border border-border rounded-[24px] p-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">Background check disclosure. </span>
                Muncie Maids will obtain a consumer report about you (criminal history and sex-offender registry
                search) from a licensed consumer reporting agency for employment-eligibility purposes. The agency
                will contact you directly to collect anything sensitive — we never see or store your Social
                Security number. You'll receive a copy of the report and a chance to respond before any decision
                is made based on it.
              </p>
              <CheckRow
                checked={bgConsent}
                onChange={setBgConsent}
                label="I authorize this background check."
              />
            </div>
          </section>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploading !== null}
          className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-8"
        >
          {submitting ? 'Submitting…' : 'Submit for Review'}
        </button>
      </form>
    </div>
  )
}

function DocTile({
  icon, title, hint, done, busy, onClick,
}: {
  icon: string
  title: string
  hint: string
  done: boolean
  busy: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-full bg-card border border-border rounded-[24px] px-5 py-4.5 shadow-sm flex items-center gap-4 text-left active:scale-[0.99] transition-all disabled:opacity-60"
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-chart-3/10' : 'bg-secondary/10'}`}>
        {busy ? (
          <div className="h-5 w-5 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
        ) : (
          <Icon icon={done ? 'solar:check-circle-bold' : icon} className={`text-xl ${done ? 'text-chart-3' : 'text-secondary'}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{done ? 'Uploaded — tap to retake' : hint}</p>
      </div>
      <Icon icon="solar:camera-linear" className="text-muted-foreground shrink-0" />
    </button>
  )
}

function ToggleRow({
  icon, label, checked, onChange,
}: {
  icon: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between bg-card border border-border rounded-[24px] px-5 py-4.5 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon icon={icon} className="text-primary text-xl" />
        <span className="font-bold text-foreground text-sm">{label}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors shrink-0 ${
          checked ? 'bg-secondary justify-end' : 'bg-muted justify-start'
        }`}
      >
        <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  )
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-start gap-3 text-left w-full">
      <div
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          checked ? 'bg-secondary border-secondary' : 'border-border bg-card'
        }`}
      >
        {checked && <Icon icon="solar:check-read-linear" className="text-white text-sm" />}
      </div>
      <span className="text-sm font-medium text-foreground leading-snug">{label}</span>
    </button>
  )
}
