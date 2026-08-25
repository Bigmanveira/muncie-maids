import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/AuthContext'
import {
  ApiError, addOpsUser, getCleanerDocs, listCleaners, recordBgCheck, reviewApplication, setCleanerActive,
  type BgCheckStatus, type OpsCleaner,
} from '../lib/api'
import { CLEAN_TYPE_LABEL, formatDateShort } from '../lib/format'

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

const BG_PROVIDERS = ['Checkr', 'GoodHire', 'Sterling', 'Certn', 'First Advantage', 'Other'] as const

function ChecklistRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-chart-3' : 'bg-muted border border-border'}`}>
        {ok && <Icon icon="solar:check-bold" className="text-white text-[10px]" />}
      </div>
      <span className={`text-xs font-bold ${ok ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon icon={icon} className="text-muted-foreground text-base shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground leading-snug">{value}</p>
      </div>
    </div>
  )
}

function DocPhoto({ url, label, missing }: { url: string | null; label: string; missing: boolean }) {
  if (missing) {
    return (
      <div className="flex-1 min-w-[130px] h-40 rounded-2xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center gap-1.5">
        <Icon icon="solar:camera-linear" className="text-muted-foreground text-xl" />
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label} missing</p>
      </div>
    )
  }
  if (!url) {
    return <div className="flex-1 min-w-[130px] h-40 rounded-2xl bg-muted animate-pulse" />
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="relative flex-1 min-w-[130px] h-40 rounded-2xl overflow-hidden border border-border group">
      <img src={url} alt={label} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-ink/70 text-white text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
        {label}
      </span>
    </a>
  )
}

/** Applicant review card. Layout: identity header with the live profile
 * photo as avatar, documents shown inline (auto-loaded signed URLs — no
 * click needed), a details column, and a vetting checklist + background-
 * check panel column. Approve stays disabled until every customer-security
 * requirement is met — the server enforces the same gate. */
function ApplicationCard({
  cleaner: c, busy, onReview, onChanged,
}: {
  cleaner: OpsCleaner
  busy: boolean
  onReview: (decision: 'approve' | 'decline') => void
  onChanged: () => void
}) {
  const [docs, setDocs] = useState<{ idDocumentUrl: string | null; profilePhotoUrl: string | null } | null>(null)
  const [docsError, setDocsError] = useState<string | null>(null)

  const [bgStatus, setBgStatus] = useState<Exclude<BgCheckStatus, 'not_started'>>(
    c.bgCheckStatus === 'not_started' ? 'pending' : c.bgCheckStatus,
  )
  const [bgProvider, setBgProvider] = useState(c.bgCheckProvider ?? '')
  const [bgReference, setBgReference] = useState(c.bgCheckReference ?? '')
  const [bgSaving, setBgSaving] = useState(false)
  const [bgError, setBgError] = useState<string | null>(null)

  // Documents load as soon as the card renders — reviewers shouldn't have
  // to click to see who they're vetting.
  useEffect(() => {
    if (!c.hasIdDocument && !c.hasProfilePhoto) return
    let cancelled = false
    getCleanerDocs(c.id)
      .then((d) => { if (!cancelled) setDocs(d) })
      .catch((err) => { if (!cancelled) setDocsError(err instanceof ApiError ? err.message : 'Could not load documents.') })
    return () => { cancelled = true }
  }, [c.id, c.hasIdDocument, c.hasProfilePhoto])

  const checklist = [
    { ok: Boolean(c.verificationSubmittedAt), label: 'Identity verification submitted' },
    { ok: c.hasIdDocument, label: 'Government ID on file' },
    { ok: c.hasProfilePhoto, label: 'Profile photo on file' },
    { ok: Boolean(c.bgCheckConsentedAt), label: 'Background check authorized' },
    { ok: c.bgCheckStatus === 'clear', label: `Background check ${BG_STATUS_LABEL[c.bgCheckStatus].toLowerCase()}` },
    { ok: Boolean(c.agreementSignedAt), label: 'Contractor agreement signed' },
  ]
  const doneCount = checklist.filter((i) => i.ok).length
  const readyToApprove = doneCount === checklist.length

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
    <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
      {/* Header: avatar (live profile photo), name, contact, progress */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-4 border-b border-border bg-muted/30">
        {docs?.profilePhotoUrl ? (
          <img src={docs.profilePhotoUrl} alt={c.name} className="w-14 h-14 rounded-2xl object-cover border border-border" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
            <span className="font-heading font-extrabold text-secondary text-lg">{(c.name?.[0] ?? '?').toUpperCase()}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-heading font-extrabold text-foreground text-lg leading-tight">{c.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {c.email} &bull; {c.phone} &bull; {c.yearsExperience ?? 0} yrs experience
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${readyToApprove ? 'bg-chart-3/10 text-chart-3' : 'bg-chart-4/10 text-chart-4'}`}>
          {doneCount}/{checklist.length} checks
        </div>
      </div>

      <div className="p-5 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Left column: documents + applicant details */}
        <div className="space-y-5 min-w-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">Documents</p>
            <div className="flex flex-wrap gap-3">
              <DocPhoto url={docs?.idDocumentUrl ?? null} label="Government ID" missing={!c.hasIdDocument} />
              <DocPhoto url={docs?.profilePhotoUrl ?? null} label="Profile photo" missing={!c.hasProfilePhoto} />
            </div>
            {docsError && <p className="text-xs text-destructive font-bold mt-2">{docsError}</p>}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">Applicant</p>
            <div className="grid sm:grid-cols-2 gap-x-6">
              <DetailRow icon="solar:card-linear" label="Legal name" value={c.legalName ?? 'Not provided'} />
              <DetailRow
                icon="solar:calendar-linear"
                label="Date of birth"
                value={c.dateOfBirth ? `${c.dateOfBirth} · ${age(c.dateOfBirth)} yrs` : 'Not provided'}
              />
              <DetailRow
                icon="solar:map-point-linear"
                label="Home address"
                value={c.addressLine1 ? `${c.addressLine1}, ${c.addressCity}, ${c.addressState} ${c.addressZip}` : 'Not provided'}
              />
              <DetailRow
                icon="solar:wheel-linear"
                label="Getting to jobs"
                value={`Transportation: ${c.hasTransportation ? 'yes' : 'no'} · License: ${c.hasDriversLicense ? 'yes' : 'no'}`}
              />
              <DetailRow
                icon="solar:phone-linear"
                label="Emergency contact"
                value={c.emergencyContactName ? `${c.emergencyContactName} · ${c.emergencyContactPhone}` : 'Not provided'}
              />
            </div>
          </div>

          {c.referenceContacts.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">References</p>
              <div className="space-y-2">
                {c.referenceContacts.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/40 border border-border rounded-2xl px-4 py-2.5">
                    <Icon icon="solar:user-check-rounded-linear" className="text-secondary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.relationship || 'Reference'}</p>
                    </div>
                    <a href={`tel:${r.phone}`} className="text-xs font-bold text-secondary shrink-0">{r.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
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
        </div>

        {/* Right column: vetting checklist + background check + decision */}
        <div className="space-y-4 lg:border-l lg:border-border lg:pl-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">Vetting checklist</p>
            {checklist.map((item) => (
              <ChecklistRow key={item.label} ok={item.ok} label={item.label} />
            ))}
          </div>

          {/* Background check — dropdowns only, no free typing. Ops orders
              the report on the provider's site and records the outcome here;
              report contents are never stored. */}
          {c.bgCheckConsentedAt && c.bgCheckStatus !== 'clear' && (
            <div className="bg-muted/40 border border-border rounded-2xl p-4 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Record background check</p>
              <label className="block">
                <span className="text-[11px] font-bold text-muted-foreground">Provider</span>
                <select
                  value={bgProvider}
                  onChange={(e) => setBgProvider(e.target.value)}
                  className="mt-1 w-full border border-border rounded-xl px-3 py-2 text-sm font-bold bg-card"
                >
                  <option value="">Choose provider…</option>
                  {BG_PROVIDERS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-muted-foreground">Result</span>
                <select
                  value={bgStatus}
                  onChange={(e) => setBgStatus(e.target.value as Exclude<BgCheckStatus, 'not_started'>)}
                  className="mt-1 w-full border border-border rounded-xl px-3 py-2 text-sm font-bold bg-card"
                >
                  <option value="pending">In progress</option>
                  <option value="clear">Clear</option>
                  <option value="consider">Needs review</option>
                  <option value="failed">Failed</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-muted-foreground">Report # <span className="font-medium">(optional)</span></span>
                <input
                  value={bgReference}
                  onChange={(e) => setBgReference(e.target.value)}
                  placeholder="From the provider's dashboard"
                  className="mt-1 w-full border border-border rounded-xl px-3 py-2 text-sm bg-card"
                />
              </label>
              <button
                type="button"
                onClick={saveBgCheck}
                disabled={bgSaving || !bgProvider}
                className="w-full bg-secondary text-white font-bold py-2.5 rounded-full text-sm disabled:opacity-50"
              >
                {bgSaving ? 'Saving…' : 'Save Result'}
              </button>
              {bgError && <p className="text-xs text-destructive font-bold">{bgError}</p>}
            </div>
          )}
          {c.bgCheckStatus === 'clear' && (
            <div className="flex items-center gap-2 bg-chart-3/10 border border-chart-3/20 rounded-2xl px-4 py-3">
              <Icon icon="solar:shield-check-bold" className="text-chart-3 text-lg shrink-0" />
              <p className="text-xs font-bold text-foreground">
                Cleared{c.bgCheckProvider ? ` via ${c.bgCheckProvider}` : ''}
                {c.bgCheckCompletedAt ? ` · ${formatDateShort(c.bgCheckCompletedAt.slice(0, 10))}` : ''}
              </p>
            </div>
          )}

          <div className="pt-1 space-y-2">
            <button
              type="button"
              onClick={() => onReview('approve')}
              disabled={busy || !readyToApprove}
              className="w-full bg-primary text-white font-bold py-3 rounded-full text-sm shadow-sm disabled:opacity-40"
            >
              {readyToApprove ? 'Approve & Activate' : `Approve (${doneCount}/${checklist.length} checks done)`}
            </button>
            <button
              type="button"
              onClick={() => onReview('decline')}
              disabled={busy}
              className="w-full bg-card border border-border font-bold text-foreground py-3 rounded-full text-sm shadow-sm disabled:opacity-50"
            >
              Decline Application
            </button>
          </div>
        </div>
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
