import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { TopBar } from '../components/TopBar'
import { ApiError, claimGig, declineOffer, listGigs, type Gig } from '../lib/api'
import { CLEAN_TYPE_ACCENT, CLEAN_TYPE_LABEL, formatBathrooms, formatBedrooms, formatDateShort, formatPrice } from '../lib/format'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; gigs: Gig[]; offers: Gig[] }

export function GigFeed() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function refresh() {
    setLoad({ status: 'loading' })
    try {
      const { gigs, offers } = await listGigs()
      setLoad({ status: 'ready', gigs, offers })
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Could not load gigs.' })
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleClaim(gigId: string) {
    setBusyId(gigId)
    setActionError(null)
    try {
      await claimGig(gigId)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not claim that gig — try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDecline(gigId: string) {
    setBusyId(gigId)
    setActionError(null)
    try {
      await declineOffer(gigId)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not decline that offer — try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="Gig Feed" />

      <div className="px-6 space-y-4">
        {load.status === 'loading' && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
          </div>
        )}

        {load.status === 'error' && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-[24px] p-6 space-y-4">
            <p className="text-sm text-foreground font-medium">{load.message}</p>
            <button
              type="button"
              onClick={refresh}
              className="w-full bg-card border border-border font-bold text-foreground py-3 rounded-full shadow-sm active:scale-[0.98] transition-all"
            >
              Try again
            </button>
          </div>
        )}

        {actionError && (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{actionError}</p>
          </div>
        )}

        {load.status === 'ready' && load.offers.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-secondary flex items-center gap-1.5">
              <Icon icon="solar:bell-bold" />
              Offered to you
            </h2>
            {load.offers.map((gig) => (
              <div
                key={gig.id}
                className="bg-secondary/5 rounded-[24px] p-5 border-2 border-secondary/30 shadow-sm"
              >
                <GigDetails gig={gig} />
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleDecline(gig.id)}
                    disabled={busyId === gig.id}
                    className="flex-1 bg-card border border-border font-bold text-foreground py-3 rounded-full shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClaim(gig.id)}
                    disabled={busyId === gig.id}
                    className="flex-1 bg-secondary text-white font-bold py-3 rounded-full shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {busyId === gig.id ? 'Saving…' : 'Accept'}
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {load.status === 'ready' && load.gigs.length === 0 && load.offers.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 py-16">
            <Icon icon="solar:widget-linear" className="text-muted-foreground text-4xl" />
            <p className="text-muted-foreground text-sm max-w-xs">No open gigs in your towns right now — check back soon.</p>
          </div>
        )}

        {load.status === 'ready' && load.gigs.length > 0 && (
          <section className="space-y-3">
            {load.offers.length > 0 && (
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Open gigs</h2>
            )}
            {load.gigs.map((gig) => (
              <div
                key={gig.id}
                className={`bg-card rounded-[24px] p-5 border border-border border-l-4 shadow-sm ${CLEAN_TYPE_ACCENT[gig.cleanType] ?? 'border-l-border'}`}
              >
                <GigDetails gig={gig} />
                <button
                  type="button"
                  onClick={() => handleClaim(gig.id)}
                  disabled={busyId === gig.id}
                  className="w-full bg-primary text-white font-bold py-3 rounded-full shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                >
                  {busyId === gig.id ? 'Claiming…' : 'Claim Gig'}
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

function GigDetails({ gig }: { gig: Gig }) {
  return (
    <>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-foreground">{CLEAN_TYPE_LABEL[gig.cleanType] ?? gig.cleanType}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {formatBedrooms(gig.bedrooms)} &bull; {formatBathrooms(gig.bathrooms)}
          </p>
        </div>
        <p className="font-mono font-extrabold text-primary text-xl">{formatPrice(gig.payout)}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
        <span className="flex items-center gap-1">
          <Icon icon="solar:calendar-linear" /> {formatDateShort(gig.serviceDate)}
        </span>
        <span className="flex items-center gap-1">
          <Icon icon="solar:clock-circle-linear" /> {gig.timeWindow}
        </span>
        <span className="flex items-center gap-1">
          <Icon icon="solar:map-point-linear" /> {gig.city}, {gig.zip}
        </span>
      </div>
    </>
  )
}
