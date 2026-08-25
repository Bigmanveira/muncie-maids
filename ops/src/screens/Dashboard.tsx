import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  ApiError,
  autoOffer,
  cancelBooking,
  getDashboard,
  listCleaners,
  offerGig,
  rankCleaners,
  type DashboardData,
  type OpsCleaner,
  type RankedCleaner,
} from '../lib/api'
import { formatDateShort, formatPrice, formatDateTime } from '../lib/format'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: DashboardData }

export function Dashboard() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [cleaners, setCleaners] = useState<OpsCleaner[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [offering, setOffering] = useState<string | null>(null)
  const [ranking, setRanking] = useState<RankedCleaner[] | null>(null)
  const [autoOfferNote, setAutoOfferNote] = useState<string | null>(null)

  async function refresh() {
    setLoad({ status: 'loading' })
    try {
      const [data, { cleaners: allCleaners }] = await Promise.all([getDashboard(), listCleaners()])
      setLoad({ status: 'ready', data })
      setCleaners(allCleaners.filter((c) => c.status === 'active'))
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Could not load the dashboard.' })
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleOffer(bookingId: string, cleanerId: string) {
    setBusyId(bookingId)
    setActionError(null)
    try {
      await offerGig(bookingId, cleanerId)
      setOffering(null)
      setRanking(null)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not send that offer.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleAutoOffer(bookingId: string) {
    setBusyId(bookingId)
    setActionError(null)
    setAutoOfferNote(null)
    try {
      const { cleaner } = await autoOffer(bookingId)
      setAutoOfferNote(`Offered to ${cleaner.name} (match score ${cleaner.score}/100).`)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not auto-offer that gig.')
    } finally {
      setBusyId(null)
    }
  }

  async function openManualOffer(bookingId: string) {
    setOffering(bookingId)
    setRanking(null)
    try {
      const { ranked } = await rankCleaners(bookingId)
      setRanking(ranked)
    } catch {
      setRanking([]) // ranking is a nicety — the plain dropdown still works
    }
  }

  async function handleCancel(bookingId: string) {
    if (!confirm('Cancel this booking and issue a full refund?')) return
    setBusyId(bookingId)
    setActionError(null)
    try {
      await cancelBooking(bookingId)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not cancel that booking.')
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
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 space-y-4 max-w-md">
        <p className="text-sm text-foreground font-medium">{load.message}</p>
        <button type="button" onClick={refresh} className="bg-card border border-border font-bold text-foreground px-4 py-2 rounded-full shadow-sm">
          Try again
        </button>
      </div>
    )
  }

  const { needsOps, stalePending, recentReleases } = load.data
  const exceptionCount = needsOps.length + stalePending.length
  const allClear = exceptionCount === 0

  return (
    <div className="space-y-8">
      <div
        className={`rounded-3xl p-6 flex items-center gap-4 ${
          allClear ? 'bg-chart-3/10 border border-chart-3/20' : 'bg-ink text-ink-foreground'
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${allClear ? 'bg-chart-3/15' : 'bg-primary/20'}`}>
          <Icon
            icon={allClear ? 'solar:check-circle-bold' : 'solar:siren-bold'}
            className={`text-2xl ${allClear ? 'text-chart-3' : 'text-primary'}`}
          />
        </div>
        <div>
          <h2 className={`font-heading text-xl font-extrabold ${allClear ? 'text-foreground' : 'text-ink-foreground'}`}>
            {allClear ? "All caught up — nothing needs you." : `${exceptionCount} thing${exceptionCount === 1 ? '' : 's'} need attention`}
          </h2>
          <p className={`text-sm mt-0.5 ${allClear ? 'text-muted-foreground' : 'text-ink-foreground/60'}`}>
            {allClear
              ? 'Unclaimed gigs, stuck checkouts, and late releases all show up here.'
              : `${needsOps.length} unclaimed gig${needsOps.length === 1 ? '' : 's'} · ${stalePending.length} stuck checkout${stalePending.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
          <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
          <p className="text-sm text-foreground font-medium">{actionError}</p>
        </div>
      )}

      {needsOps.length > 0 && (
        <section>
          <h3 className="font-heading text-lg font-extrabold text-foreground mb-4">Needs a cleaner</h3>
          <div className="space-y-3">
            {needsOps.map((gig) => (
              <div key={gig.id} className="bg-card border border-border border-l-4 border-l-primary rounded-2xl p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-foreground">{gig.customerName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateShort(gig.serviceDate)} &bull; {gig.timeWindow} &bull; {gig.city}
                    </p>
                  </div>
                  <p className="font-mono font-extrabold text-foreground">{formatPrice(gig.quotedPrice)}</p>
                </div>
                {gig.hasOffer && (
                  <p className="text-xs font-bold text-secondary mb-3 flex items-center gap-1">
                    <Icon icon="solar:bell-bold" /> Offer already sent — awaiting response
                  </p>
                )}
                {autoOfferNote && offering !== gig.id && (
                  <p className="text-xs font-bold text-chart-3 mb-3 flex items-center gap-1">
                    <Icon icon="solar:check-circle-bold" /> {autoOfferNote}
                  </p>
                )}
                {offering === gig.id ? (
                  <div className="space-y-3">
                    {/* Allocation-engine suggestions: ranked matches with the
                        factor breakdown, one tap to offer. */}
                    {ranking === null ? (
                      <p className="text-xs text-muted-foreground">Ranking cleaners…</p>
                    ) : ranking.length > 0 ? (
                      <div className="space-y-2">
                        {ranking.slice(0, 3).map((r, i) => (
                          <button
                            key={r.cleanerId}
                            type="button"
                            onClick={() => handleOffer(gig.id, r.cleanerId)}
                            disabled={busyId === gig.id}
                            className="w-full flex items-center justify-between gap-3 bg-background border border-border rounded-2xl px-4 py-3 text-left disabled:opacity-50 hover:border-secondary/40 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-sm truncate">
                                {i === 0 && <Icon icon="solar:crown-bold" className="inline text-chart-4 mr-1" />}
                                {r.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                reliability {r.factors.reliability}/30 · near {r.factors.proximity}/20 · load {r.factors.fairness}/20 · exp {r.factors.experience}/15
                              </p>
                            </div>
                            <span className="font-mono font-extrabold text-secondary shrink-0">{r.total}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No engine matches — pick manually below.</p>
                    )}
                  <div className="flex flex-wrap gap-2 items-center">
                    <select
                      id={`offer-${gig.id}`}
                      className="flex-1 min-w-[180px] border border-border rounded-full px-4 py-2 text-sm bg-background"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Choose a cleaner…
                      </option>
                      {cleaners
                        .filter((c) => c.towns.includes(gig.city))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const select = document.getElementById(`offer-${gig.id}`) as HTMLSelectElement
                        if (select.value) handleOffer(gig.id, select.value)
                      }}
                      disabled={busyId === gig.id}
                      className="bg-secondary text-white font-bold px-4 py-2 rounded-full text-sm disabled:opacity-50"
                    >
                      Send Offer
                    </button>
                    <button type="button" onClick={() => { setOffering(null); setRanking(null) }} className="text-sm font-bold text-muted-foreground px-2">
                      Cancel
                    </button>
                  </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleAutoOffer(gig.id)}
                      disabled={busyId === gig.id || gig.hasOffer}
                      className="flex-1 bg-primary text-white font-bold py-2.5 rounded-full text-sm shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {busyId === gig.id ? 'Matching…' : 'Offer Best Match'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openManualOffer(gig.id)}
                      className="flex-1 bg-secondary text-white font-bold py-2.5 rounded-full text-sm shadow-sm active:scale-[0.98] transition-all"
                    >
                      Pick a Cleaner
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(gig.id)}
                      disabled={busyId === gig.id}
                      className="bg-card border border-destructive/30 text-destructive font-bold px-4 py-2.5 rounded-full text-sm disabled:opacity-50"
                    >
                      Cancel &amp; Refund
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {stalePending.length > 0 && (
        <section>
          <h3 className="font-heading text-lg font-extrabold text-foreground mb-4">Stuck checkouts</h3>
          <div className="space-y-3">
            {stalePending.map((b) => (
              <div key={b.id} className="bg-card border border-border border-l-4 border-l-chart-4 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground">{b.customerName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {b.customerEmail} &bull; {formatDateShort(b.serviceDate)} &bull; started {formatDateTime(b.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancel(b.id)}
                  disabled={busyId === b.id}
                  className="bg-card border border-destructive/30 text-destructive font-bold px-4 py-2 rounded-full text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentReleases.length > 0 && (
        <section>
          <h3 className="font-heading text-lg font-extrabold text-foreground mb-4">Recent late releases</h3>
          <div className="space-y-2">
            {recentReleases.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-4 text-sm flex flex-wrap items-center justify-between gap-2">
                <p className="text-foreground">
                  <span className="font-bold">{r.cleanerName}</span> released {r.customerName ?? 'a gig'}
                  {r.serviceDate ? ` (${formatDateShort(r.serviceDate)})` : ''} inside 48h
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(r.releasedAt)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
