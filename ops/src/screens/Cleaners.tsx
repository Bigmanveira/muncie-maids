import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/AuthContext'
import {
  ApiError, addOpsUser, getCleanerDocs, listCleaners, recordBgCheck, reviewApplication, setCleanerActive,
  type BgCheckStatus, type OpsCleaner,
} from '../lib/api'
import { CLEAN_TYPE_LABEL } from '../lib/format'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; cleaners: OpsCleaner[] }

export function Cleaners() {
  const { opsUser } = useAuth()
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function refresh() {
    setLoad({ status: 'loading' })
    try {
      const { cleaners } = await listCleaners()
      setLoad({ status: 'ready', cleaners })
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Could not load cleaners.' })
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleReview(cleanerId: string, decision: 'approve' | 'decline') {
    setBusyId(cleanerId)
    setActionError(null)
    try {
      await reviewApplication(cleanerId, decision)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not save that decision.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleActive(cleanerId: string, active: boolean) {
    setBusyId(cleanerId)
    setActionError(null)
    try {
      await setCleanerActive(cleanerId, active)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update this cleaner.')
    } finally {
      setBusyId(null)
    }
  }

  if (load.status === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (load.status === 'error') {
    return <p className="text-sm text-destructive font-bold">{load.message}</p>
  }

  const applications = load.cleaners.filter((c) => c.status === 'applied')
  const roster = load.cleaners.filter((c) => c.status === 'active' || c.status === 'deactivated')
  const declined = load.cleaners.filter((c) => c.status === 'declined')

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-heading text-2xl font-extrabold text-foreground">Cleaners</h2>
        <p className="text-muted-foreground text-sm mt-1">Applications, roster, and reliability.</p>
      </div>

      {actionError && (
        <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
          <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
          <p className="text-sm text-foreground font-medium">{actionError}</p>
        </div>
      )}

      <section>
        <h3 className="font-heading text-lg font-extrabold text-foreground mb-4">
          Applications {applications.length > 0 && <span className="text-primary">({applications.length})</span>}
        </h3>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending applications.</p>
        ) : (
          <div className="space-y-3">
            {applications.map((c) => (
              <ApplicationCard
                key={c.id}
                cleaner={c}
                busy={busyId === c.id}
                onReview={(decision) => handleReview(c.id, decision)}
                onChanged={refresh}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-heading text-lg font-extrabold text-foreground mb-4">Roster ({roster.length})</h3>
        {roster.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cleaners on the roster yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Towns</th>
                  <th className="px-4 py-3 text-center">Completed</th>
                  <th className="px-4 py-3 text-center">Released</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {roster.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.towns.join(', ')}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-chart-3">{c.reliabilityCompleted}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-muted-foreground">{c.reliabilityReleased}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          c.status === 'active' ? 'bg-chart-3/10 text-chart-3' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {c.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c.id, c.status !== 'active')}
                        disabled={busyId === c.id}
                        className="text-xs font-bold text-secondary whitespace-nowrap disabled:opacity-50"
                      >
                        {c.status === 'active' ? 'Pause' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {declined.length > 0 && (
        <section>
          <h3 className="font-heading text-lg font-extrabold text-foreground mb-4">Declined ({declined.length})</h3>
          <div className="space-y-2">
            {declined.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-4 text-sm flex items-center justify-between">
                <p className="text-foreground font-bold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.email}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {opsUser?.role === 'owner' && <OpsTeamSection />}
    </div>
  )
}

function age(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) years -= 1
  return years
}

const BG_STATUS_LABEL: Record<BgCheckStatus, string> = {
  not_started: 'Not started',
  pending: 'In progress',
  clear: 'Clear',
  consider: 'Needs review',
  failed: 'Failed',
}

function VettingItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${ok ? 'bg-chart-3/10 text-chart-3' : 'bg-muted text-muted-foreground'}`}>
      <Icon icon={ok ? 'solar:check-circle-bold' : 'solar:close-circle-linear'} className="text-sm" />
      {label}
    </span>
  )
}

/** Full vetting review card for one pending application: identity details,
 * documents (signed-URL viewer), references, background-check recorder, and
 * the approve/decline actions. Approve stays disabled until every customer-
 * security requirement is met — the server enforces the same gate. */
function ApplicationCard({
  cleaner: c, busy, onReview, onChanged,
}: {
  cleaner: OpsCleaner
  busy: boolean
  onReview: (decision: 'approve' | 'decline') => void
  onChanged: () => void
}) {
  const [docs, setDocs] = useState<{ idDocumentUrl: string | null; profilePhotoUrl: string | null } | null>(null)
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)

  const [bgStatus, setBgStatus] = useState<Exclude<BgCheckStatus, 'not_started'>>(
    c.bgCheckStatus === 'not_started' ? 'pending' : c.bgCheckStatus,
  )
  const [bgProvider, setBgProvider] = useState(c.bgCheckProvider ?? '')
  const [bgReference, setBgReference] = useState(c.bgCheckReference ?? '')
  const [bgSaving, setBgSaving] = useState(false)
  const [bgError, setBgError] = useState<string | null>(null)

  const readyToApprove =
    Boolean(c.verificationSubmittedAt) &&
    c.hasIdDocument &&
    c.hasProfilePhoto &&
    Boolean(c.bgCheckConsentedAt) &&
    c.bgCheckStatus === 'clear' &&
    Boolean(c.agreementSignedAt)

  async function loadDocs() {
    setDocsLoading(true)
    setDocsError(null)
    try {
      setDocs(await getCleanerDocs(c.id))
    } catch (err) {
      setDocsError(err instanceof ApiError ? err.message : 'Could not load documents.')
    } finally {
      setDocsLoading(false)
    }
  }

  async function saveBgCheck() {
    setBgSaving(true)
    setBgError(null)
    try {
      await recordBgCheck(c.id, bgStatus, bgProvider, bgReference)
      onChanged()
    } catch (err) {
      setBgError(err instanceof ApiError ? err.message : 'Could not save.')
    } finally {
      setBgSaving(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-foreground">{c.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {c.email} &bull; {c.phone}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{c.yearsExperience ?? 0} yrs experience</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {c.towns.map((t) => (
          <span key={t} className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold">{t}</span>
        ))}
        {c.services.map((s) => (
          <span key={s} className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-bold">
            {CLEAN_TYPE_LABEL[s] ?? s}
          </span>
        ))}
        {c.hasOwnEquipment && (
          <span className="px-2.5 py-1 rounded-full bg-chart-3/10 text-chart-3 text-[11px] font-bold">Own equipment</span>
        )}
      </div>

      {/* Vetting checklist — mirrors the server-side approval gate exactly */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <VettingItem ok={Boolean(c.verificationSubmittedAt)} label="Verification" />
        <VettingItem ok={c.hasIdDocument} label="ID document" />
        <VettingItem ok={c.hasProfilePhoto} label="Profile photo" />
        <VettingItem ok={Boolean(c.bgCheckConsentedAt)} label="BG consent" />
        <VettingItem ok={c.bgCheckStatus === 'clear'} label={`BG check: ${BG_STATUS_LABEL[c.bgCheckStatus]}`} />
        <VettingItem ok={Boolean(c.agreementSignedAt)} label="Agreement" />
      </div>

      {c.verificationSubmittedAt && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs mb-4 bg-muted/40 border border-border rounded-xl p-4">
          <p><span className="text-muted-foreground">Legal name:</span> <span className="font-bold text-foreground">{c.legalName ?? '—'}</span></p>
          <p>
            <span className="text-muted-foreground">DOB:</span>{' '}
            <span className="font-bold text-foreground">
              {c.dateOfBirth ? `${c.dateOfBirth} (${age(c.dateOfBirth)})` : '—'}
            </span>
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">Address:</span>{' '}
            <span className="font-bold text-foreground">
              {c.addressLine1 ? `${c.addressLine1}, ${c.addressCity}, ${c.addressState} ${c.addressZip}` : '—'}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Transportation:</span>{' '}
            <span className="font-bold text-foreground">{c.hasTransportation ? 'Yes' : 'No'}</span>
            {' '}&bull;{' '}
            <span className="text-muted-foreground">License:</span>{' '}
            <span className="font-bold text-foreground">{c.hasDriversLicense ? 'Yes' : 'No'}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Emergency:</span>{' '}
            <span className="font-bold text-foreground">
              {c.emergencyContactName ? `${c.emergencyContactName} · ${c.emergencyContactPhone}` : '—'}
            </span>
          </p>
          {c.referenceContacts.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground mb-1">References:</p>
              {c.referenceContacts.map((r, i) => (
                <p key={i} className="font-bold text-foreground">
                  {r.name} <span className="font-medium text-muted-foreground">({r.relationship || 'reference'})</span> · {r.phone}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document viewer — signed URLs fetched on demand, never stored */}
      {(c.hasIdDocument || c.hasProfilePhoto) && (
        <div className="mb-4">
          {docs === null ? (
            <button
              type="button"
              onClick={loadDocs}
              disabled={docsLoading}
              className="text-xs font-bold text-secondary disabled:opacity-50"
            >
              {docsLoading ? 'Loading documents…' : 'View ID & photo'}
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              {docs.idDocumentUrl && (
                <a href={docs.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={docs.idDocumentUrl} alt="ID document" className="h-28 rounded-xl border border-border object-cover" />
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 text-center">ID document</p>
                </a>
              )}
              {docs.profilePhotoUrl && (
                <a href={docs.profilePhotoUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={docs.profilePhotoUrl} alt="Profile" className="h-28 rounded-xl border border-border object-cover" />
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 text-center">Profile photo</p>
                </a>
              )}
            </div>
          )}
          {docsError && <p className="text-xs text-destructive font-bold mt-2">{docsError}</p>}
        </div>
      )}

      {/* Background check recorder — enabled once the cleaner has consented.
          Ops orders the check on the provider's site (Checkr/GoodHire) and
          records the outcome here; we never store report contents. */}
      {c.bgCheckConsentedAt && c.bgCheckStatus !== 'clear' && (
        <div className="mb-4 border border-border rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-3">Record background check</p>
          <div className="flex flex-wrap gap-2">
            <select
              value={bgStatus}
              onChange={(e) => setBgStatus(e.target.value as Exclude<BgCheckStatus, 'not_started'>)}
              className="border border-border rounded-full px-3 py-2 text-xs font-bold bg-card"
            >
              <option value="pending">In progress</option>
              <option value="clear">Clear</option>
              <option value="consider">Needs review</option>
              <option value="failed">Failed</option>
            </select>
            <input
              value={bgProvider}
              onChange={(e) => setBgProvider(e.target.value)}
              placeholder="Provider (e.g. Checkr)"
              className="flex-1 min-w-[140px] border border-border rounded-full px-3 py-2 text-xs bg-card"
            />
            <input
              value={bgReference}
              onChange={(e) => setBgReference(e.target.value)}
              placeholder="Report reference #"
              className="flex-1 min-w-[140px] border border-border rounded-full px-3 py-2 text-xs bg-card"
            />
            <button
              type="button"
              onClick={saveBgCheck}
              disabled={bgSaving}
              className="bg-secondary text-white font-bold px-4 py-2 rounded-full text-xs disabled:opacity-50"
            >
              {bgSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {bgError && <p className="text-xs text-destructive font-bold mt-2">{bgError}</p>}
        </div>
      )}

      {!readyToApprove && (
        <p className="text-[11px] text-muted-foreground mb-3">
          Approval unlocks when every vetting item above is green.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onReview('decline')}
          disabled={busy}
          className="flex-1 bg-card border border-border font-bold text-foreground py-2.5 rounded-full text-sm shadow-sm disabled:opacity-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => onReview('approve')}
          disabled={busy || !readyToApprove}
          className="flex-1 bg-primary text-white font-bold py-2.5 rounded-full text-sm shadow-sm disabled:opacity-40"
        >
          Approve
        </button>
      </div>
    </div>
  )
}

function OpsTeamSection() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      await addOpsUser(email.trim())
      setMessage(`${email} now has ops access.`)
      setEmail('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not grant access.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h3 className="font-heading text-lg font-extrabold text-foreground mb-2">Ops Team</h3>
      <p className="text-xs text-muted-foreground mb-4">
        They need to sign up at the ops portal's own signup form first — this just grants an existing account access.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 max-w-lg">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@munciemaids.com"
          required
          className="flex-1 min-w-[220px] border border-border rounded-full px-4 py-2.5 text-sm bg-card"
        />
        <button type="submit" disabled={submitting} className="bg-secondary text-white font-bold px-5 py-2.5 rounded-full text-sm disabled:opacity-50">
          {submitting ? 'Adding…' : 'Grant Access'}
        </button>
      </form>
      {message && <p className="text-sm text-chart-3 font-bold mt-3">{message}</p>}
      {error && <p className="text-sm text-destructive font-bold mt-3">{error}</p>}
    </section>
  )
}
