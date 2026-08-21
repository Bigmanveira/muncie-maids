import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { getBookingPhotos, type BookingPhoto } from '../lib/api'
import { PanoramaViewer } from './PanoramaViewer'
import { formatDateTime } from '../lib/format'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; photos: BookingPhoto[] }

export function PhotoGalleryModal({ bookingId, customerName, onClose }: { bookingId: string; customerName: string; onClose: () => void }) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    getBookingPhotos(bookingId)
      .then(({ photos }) => setLoad({ status: 'ready', photos }))
      .catch((err) => setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Could not load photos.' }))
  }, [bookingId])

  const client = load.status === 'ready' ? load.photos.filter((p) => p.uploadedBy === 'client') : []
  const cleaner = load.status === 'ready' ? load.photos.filter((p) => p.uploadedBy === 'cleaner') : []

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-background rounded-3xl max-w-2xl w-full my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-heading text-lg font-extrabold text-foreground">Proof photos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{customerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <Icon icon="solar:close-circle-linear" className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {load.status === 'loading' && (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
            </div>
          )}

          {load.status === 'error' && <p className="text-sm text-destructive font-bold">{load.message}</p>}

          {load.status === 'ready' && load.photos.length === 0 && (
            <div className="flex flex-col items-center text-center gap-3 py-12">
              <Icon icon="solar:gallery-linear" className="text-muted-foreground text-4xl" />
              <p className="text-muted-foreground text-sm max-w-xs">No photos uploaded for this booking yet.</p>
            </div>
          )}

          {client.length > 0 && (
            <section>
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Client — before</h4>
              <div className="space-y-4">
                {client.map((p) => (
                  <div key={p.id}>
                    <PanoramaViewer src={p.url} alt="Client walkthrough photo" />
                    <p className="text-[11px] text-muted-foreground mt-1.5">{formatDateTime(p.createdAt)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {cleaner.length > 0 && (
            <section>
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Cleaner — after</h4>
              <div className="space-y-4">
                {cleaner.map((p) => (
                  <div key={p.id}>
                    <PanoramaViewer src={p.url} alt="Cleaner proof-of-completion photo" />
                    <p className="text-[11px] text-muted-foreground mt-1.5">{formatDateTime(p.createdAt)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
