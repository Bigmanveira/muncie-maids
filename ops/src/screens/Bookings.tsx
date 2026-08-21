import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { ApiError, cancelBooking, listBookings, type OpsBooking } from '../lib/api'
import { CLEAN_TYPE_LABEL, formatDateShort, formatPrice, STATUS_COLOR, STATUS_LABEL } from '../lib/format'
import { PhotoGalleryModal } from '../components/PhotoGalleryModal'

const STATUS_OPTIONS = ['all', 'pending_payment', 'open', 'needs_ops', 'claimed', 'completed', 'cancelled'] as const

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; bookings: OpsBooking[] }

export function Bookings() {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('all')
  const [search, setSearch] = useState('')
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [photoBooking, setPhotoBooking] = useState<{ id: string; customerName: string } | null>(null)

  async function refresh() {
    setLoad({ status: 'loading' })
    try {
      const { bookings } = await listBookings({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
      })
      setLoad({ status: 'ready', bookings })
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Could not load bookings.' })
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

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

  const cancellable = new Set(['pending_payment', 'open', 'needs_ops', 'claimed'])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-extrabold text-foreground">Bookings</h2>
        <p className="text-muted-foreground text-sm mt-1">Every gig, every state.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                statusFilter === s ? 'bg-secondary text-white border-secondary' : 'bg-card border-border text-foreground'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            refresh()
          }}
          className="flex-1 min-w-[200px] flex gap-2"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or city…"
            className="flex-1 border border-border rounded-full px-4 py-2 text-sm bg-card"
          />
          <button type="submit" className="bg-card border border-border rounded-full px-4 py-2 text-sm font-bold">
            <Icon icon="solar:magnifer-linear" />
          </button>
        </form>
      </div>

      {actionError && (
        <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
          <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
          <p className="text-sm text-foreground font-medium">{actionError}</p>
        </div>
      )}

      {load.status === 'loading' && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
        </div>
      )}

      {load.status === 'error' && <p className="text-sm text-destructive font-bold">{load.message}</p>}

      {load.status === 'ready' && load.bookings.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">No bookings match this filter.</p>
      )}

      {load.status === 'ready' && load.bookings.length > 0 && (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm border-collapse min-w-[880px]">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Cleaner</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {load.bookings.map((b) => (
                <tr key={b.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_COLOR[b.status] ?? 'bg-muted'}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-foreground">{b.customerName}</p>
                    <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {CLEAN_TYPE_LABEL[b.cleanType] ?? b.cleanType} &middot; {b.city}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDateShort(b.serviceDate)}
                    <br />
                    <span className="text-xs">{b.timeWindow}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.cleanerName ?? (b.offeredCleanerName ? `Offered: ${b.offeredCleanerName}` : '—')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{formatPrice(b.quotedPrice)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setPhotoBooking({ id: b.id, customerName: b.customerName })}
                      className="text-secondary font-bold text-xs mr-3"
                    >
                      Photos
                    </button>
                    {cancellable.has(b.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(b.id)}
                        disabled={busyId === b.id}
                        className="text-destructive font-bold text-xs whitespace-nowrap disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {photoBooking && (
        <PhotoGalleryModal
          bookingId={photoBooking.id}
          customerName={photoBooking.customerName}
          onClose={() => setPhotoBooking(null)}
        />
      )}
    </div>
  )
}
