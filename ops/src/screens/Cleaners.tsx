import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/AuthContext'
import { ApiError, addOpsUser, listCleaners, reviewApplication, setCleanerActive, type OpsCleaner } from '../lib/api'
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
              <div key={c.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
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
                    <span key={t} className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold">
                      {t}
                    </span>
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
                <p className="text-[11px] text-muted-foreground mb-4">
                  Agreement: {c.agreementSignedAt ? 'Signed' : 'Not signed yet'}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleReview(c.id, 'decline')}
                    disabled={busyId === c.id}
                    className="flex-1 bg-card border border-border font-bold text-foreground py-2.5 rounded-full text-sm shadow-sm disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(c.id, 'approve')}
                    disabled={busyId === c.id}
                    className="flex-1 bg-primary text-white font-bold py-2.5 rounded-full text-sm shadow-sm disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              </div>
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
