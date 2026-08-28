import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { listEvents, type AuditEvent, type ListEventsParams } from '../lib/api'
import { formatDateShort, formatDateTime } from '../lib/format'
import { supabase } from '../lib/supabase'

// Audit log — a readable, filterable view over the events table. Every
// consequential action in the marketplace lands here: bookings, offers,
// claims, releases, approvals, background checks, document uploads.
// Filters (actor + date range) and pagination run server-side.

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

const ACTOR_FILTERS = ['all', 'cleaner', 'ops', 'system', 'client'] as const
type ActorFilter = (typeof ACTOR_FILTERS)[number]

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; events: AuditEvent[]; total: number; pageSize: number }

export function Audit() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [actorFilter, setActorFilter] = useState<ActorFilter>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(0)
  const [live, setLive] = useState(false)

  // `silent` refreshes swap the data in place without flashing the spinner —
  // used by the realtime subscription so the list updates unobtrusively.
  const fetchPage = useCallback(async (silent = false) => {
    if (!silent) setLoad({ status: 'loading' })
    try {
      const params: ListEventsParams = { page }
      if (actorFilter !== 'all') params.actorType = actorFilter
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate
      const { events, total, pageSize } = await listEvents(params)
      setLoad({ status: 'ready', events, total, pageSize })
    } catch (err) {
      if (!silent) {
        setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Could not load the audit log.' })
      }
      // Silent failures keep the current list; the next event or page
      // change will try again.
    }
  }, [page, actorFilter, fromDate, toDate])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  // Live updates: subscribe to event INSERTs (RLS-gated to ops users) and
  // re-run the CURRENT query — filters and page respected — with a short
  // debounce so bursts (e.g. an auto-offer cascade) coalesce into one fetch.
  const fetchPageRef = useRef(fetchPage)
  fetchPageRef.current = fetchPage
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined
    const channel = supabase
      .channel('audit-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, () => {
        if (debounce) clearTimeout(debounce)
        debounce = setTimeout(() => void fetchPageRef.current(true), 500)
      })
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    // Realtime can drop while a laptop sleeps — refresh whenever the tab
    // regains focus so the log is never stale after coming back.
    const onFocus = () => void fetchPageRef.current(true)
    window.addEventListener('focus', onFocus)

    return () => {
      if (debounce) clearTimeout(debounce)
      window.removeEventListener('focus', onFocus)
      void supabase.removeChannel(channel)
    }
  }, [])

  // Any filter change resets to the first page.
  function applyFilter(update: () => void) {
    update()
    setPage(0)
  }

  const filtersActive = actorFilter !== 'all' || fromDate !== '' || toDate !== ''

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-foreground">Audit Log</h2>
          <p className="text-muted-foreground text-sm mt-1">Every action across bookings, cleaners, and reviews — newest first.</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
            live ? 'bg-chart-3/10 text-chart-3' : 'bg-muted text-muted-foreground'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-chart-3' : 'bg-muted-foreground/50'}`} />
          {live ? 'Live' : 'Connecting…'}
        </span>
      </div>

      {/* Filter bar: actor chips + date range */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex flex-wrap gap-2">
          {ACTOR_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => applyFilter(() => setActorFilter(f))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                actorFilter === f ? 'bg-ink text-ink-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {f === 'all' ? 'All' : ACTOR_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            From
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => applyFilter(() => setFromDate(e.target.value))}
              className="border border-border rounded-full px-3 py-1.5 text-xs bg-card text-foreground"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            To
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => applyFilter(() => setToDate(e.target.value))}
              className="border border-border rounded-full px-3 py-1.5 text-xs bg-card text-foreground"
            />
          </label>
          {filtersActive && (
            <button
              type="button"
              onClick={() => applyFilter(() => { setActorFilter('all'); setFromDate(''); setToDate('') })}
              className="flex items-center gap-1 text-xs font-bold text-secondary"
            >
              <Icon icon="solar:close-circle-linear" /> Clear
            </button>
          )}
        </div>
      </div>

      {load.status === 'loading' && (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
        </div>
      )}

      {load.status === 'error' && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 space-y-4 max-w-md">
          <p className="text-sm text-foreground font-medium">{load.message}</p>
          <button type="button" onClick={() => fetchPage()} className="bg-card border border-border font-bold text-foreground px-4 py-2 rounded-full shadow-sm">
            Try again
          </button>
        </div>
      )}

      {load.status === 'ready' && (
        <>
          {load.events.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-3 py-16">
              <Icon icon="solar:clipboard-list-linear" className="text-muted-foreground text-4xl" />
              <p className="text-sm text-muted-foreground max-w-xs">
                {filtersActive ? 'No events match these filters — widen the date range or clear them.' : 'No events yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {load.events.map((e) => {
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

          <Pagination
            page={page}
            total={load.total}
            pageSize={load.pageSize}
            onPage={setPage}
          />
        </>
      )}
    </div>
  )
}

function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const first = page * pageSize + 1
  const last = Math.min((page + 1) * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground font-medium">
        {first}–{last} of {total} events
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-foreground disabled:opacity-40"
        >
          <Icon icon="solar:alt-arrow-left-linear" />
        </button>
        <span className="text-xs font-bold text-foreground px-1">
          Page {page + 1} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page + 1 >= totalPages}
          aria-label="Next page"
          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-foreground disabled:opacity-40"
        >
          <Icon icon="solar:alt-arrow-right-linear" />
        </button>
      </div>
    </div>
  )
}
