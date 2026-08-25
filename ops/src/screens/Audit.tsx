import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { listEvents, type AuditEvent } from '../lib/api'
import { formatDateShort, formatDateTime } from '../lib/format'

// Audit log — a readable, filterable view over the events table. Every
// consequential action in the marketplace lands here: bookings, offers,
// claims, releases, approvals, background checks, document uploads.

const ACTION_META: Record<string, { icon: string; label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }> = {
  claimed: { icon: 'solar:hand-shake-linear', label: 'claimed a gig', tone: 'good' },
  offered: { icon: 'solar:bell-linear', label: 'sent an offer', tone: 'neutral' },
  auto_offered: { icon: 'solar:bolt-circle-linear', label: 'auto-offer sent to best match', tone: 'neutral' },
  offer_accepted: { icon: 'solar:check-circle-linear', label: 'accepted an offer', tone: 'good' },
  offer_declined: { icon: 'solar:close-circle-linear', label: 'declined an offer', tone: 'neutral' },
  offer_expired: { icon: 'solar:hourglass-line-linear', label: 'offer expired unanswered', tone: 'warn' },
  released: { icon: 'solar:undo-left-linear', label: 'released a gig', tone: 'warn' },
  released_inside_48h: { icon: 'solar:danger-triangle-linear', label: 'released a gig inside 48h', tone: 'bad' },
  completed: { icon: 'solar:check-read-linear', label: 'completed a job', tone: 'good' },
  cancelled: { icon: 'solar:trash-bin-minimalistic-linear', label: 'cancelled a booking', tone: 'bad' },
  application_approved: { icon: 'solar:user-check-rounded-linear', label: 'approved an application', tone: 'good' },
  application_declined: { icon: 'solar:user-cross-rounded-linear', label: 'declined an application', tone: 'bad' },
  cleaner_reactivated: { icon: 'solar:play-circle-linear', label: 'reactivated a cleaner', tone: 'good' },
  cleaner_deactivated: { icon: 'solar:pause-circle-linear', label: 'paused a cleaner', tone: 'warn' },
  photo_upload_requested: { icon: 'solar:camera-linear', label: 'uploaded a job photo', tone: 'neutral' },
  verification_id_document_uploaded: { icon: 'solar:card-linear', label: 'uploaded their ID document', tone: 'neutral' },
  verification_profile_photo_uploaded: { icon: 'solar:user-circle-linear', label: 'uploaded their profile photo', tone: 'neutral' },
  bg_check_pending: { icon: 'solar:shield-linear', label: 'marked a background check in progress', tone: 'neutral' },
  bg_check_clear: { icon: 'solar:shield-check-linear', label: 'recorded a clear background check', tone: 'good' },
  bg_check_consider: { icon: 'solar:shield-warning-linear', label: 'flagged a background check for review', tone: 'warn' },
  bg_check_failed: { icon: 'solar:shield-cross-linear', label: 'recorded a failed background check', tone: 'bad' },
}

const TONE_CLASS: Record<'good' | 'warn' | 'bad' | 'neutral', string> = {
  good: 'bg-chart-3/10 text-chart-3',
  warn: 'bg-chart-4/10 text-chart-4',
  bad: 'bg-destructive/10 text-destructive',
  neutral: 'bg-secondary/10 text-secondary',
}

const ACTOR_LABEL: Record<AuditEvent['actorType'], string> = {
  client: 'Customer',
  cleaner: 'Cleaner',
  ops: 'Ops',
  system: 'System',
}

const FILTERS = ['all', 'cleaner', 'ops', 'system', 'client'] as const

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; events: AuditEvent[]; hasMore: boolean }

export function Audit() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [loadingMore, setLoadingMore] = useState(false)

  async function refresh() {
    setLoad({ status: 'loading' })
    try {
      const { events, hasMore } = await listEvents()
      setLoad({ status: 'ready', events, hasMore })
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Could not load the audit log.' })
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function loadMore() {
    if (load.status !== 'ready' || load.events.length === 0) return
    setLoadingMore(true)
    try {
      const oldest = load.events[load.events.length - 1].createdAt
      const { events, hasMore } = await listEvents(oldest)
      setLoad({ status: 'ready', events: [...load.events, ...events], hasMore })
    } catch {
      // Keep what we have — the button stays available to retry.
    } finally {
      setLoadingMore(false)
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

  const shown = filter === 'all' ? load.events : load.events.filter((e) => e.actorType === filter)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-extrabold text-foreground">Audit Log</h2>
        <p className="text-muted-foreground text-sm mt-1">Every action across bookings, cleaners, and reviews — newest first.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === f ? 'bg-ink text-ink-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {f === 'all' ? 'All' : ACTOR_LABEL[f]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No events yet for this filter.</p>
      ) : (
        <div className="space-y-2">
          {shown.map((e) => {
            const meta = ACTION_META[e.action] ?? { icon: 'solar:record-circle-linear', label: e.action.replaceAll('_', ' '), tone: 'neutral' as const }
            return (
              <div key={e.id} className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${TONE_CLASS[meta.tone]}`}>
                  <Icon icon={meta.icon} className="text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-snug">
                    <span className="font-bold">{e.actorName ?? ACTOR_LABEL[e.actorType]}</span>{' '}
                    <span className="text-muted-foreground font-medium">({ACTOR_LABEL[e.actorType]})</span> {meta.label}
                    {e.bookingCustomer && (
                      <span className="text-muted-foreground">
                        {' '}— {e.bookingCustomer}
                        {e.bookingDate ? `, ${formatDateShort(e.bookingDate)}` : ''}
                        {e.bookingCity ? ` · ${e.bookingCity}` : ''}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(e.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {load.hasMore && filter === 'all' && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full sm:w-auto bg-card border border-border font-bold text-foreground px-6 py-2.5 rounded-full text-sm shadow-sm disabled:opacity-50"
        >
          {loadingMore ? 'Loading…' : 'Load older events'}
        </button>
      )}
    </div>
  )
}
