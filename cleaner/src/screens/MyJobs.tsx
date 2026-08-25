import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { TopBar } from '../components/TopBar'
import { supabase } from '../lib/supabase'
import { ApiError, completeGig, releaseGig } from '../lib/api'
import { CLEAN_TYPE_ACCENT, CLEAN_TYPE_LABEL, formatBathrooms, formatBedrooms, formatDateShort, formatPrice } from '../lib/format'
import { directionsUrl, mapsUrl } from '../lib/maps'
import { StillPhotoCapture } from '../components/StillPhotoCapture'
import { PhotoUploadError, uploadJobPhoto } from '../lib/photos'

const REQUIRED_PHOTO_COUNT = 4

interface MyJob {
  id: string
  status: string
  service_date: string
  time_window: string
  clean_type: string
  bedrooms: number
  bathrooms: number
  address_line: string
  city: string
  zip: string
  entry_notes: string | null
  has_pets: boolean
  customer_name: string
  quoted_price: number
}

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; jobs: MyJob[] }

export function MyJobs() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function refresh() {
    setLoad({ status: 'loading' })
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .in('status', ['claimed', 'completed'])
      .order('service_date', { ascending: true })

    if (error) {
      setLoad({ status: 'error', message: 'Could not load your jobs.' })
      return
    }
    const jobs = (data ?? []) as MyJob[]
    setLoad({ status: 'ready', jobs })

    if (jobs.length > 0) {
      const { data: photos } = await supabase
        .from('booking_photos')
        .select('booking_id')
        .eq('uploaded_by', 'cleaner')
        .in(
          'booking_id',
          jobs.map((j) => j.id),
        )
      const counts: Record<string, number> = {}
      for (const p of photos ?? []) {
        counts[p.booking_id] = (counts[p.booking_id] ?? 0) + 1
      }
      setPhotoCounts(counts)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isServiceDay = (date: string) => {
    const [y, m, d] = date.split('-').map(Number)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(y, m - 1, d).getTime() <= today.getTime()
  }

  async function handleRelease(jobId: string) {
    setBusyId(jobId)
    setActionError(null)
    try {
      await releaseGig(jobId)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not release that job.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleComplete(jobId: string) {
    setBusyId(jobId)
    setActionError(null)
    try {
      await completeGig(jobId)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not mark that job complete.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="My Jobs" />

      <div className="px-6 space-y-4">
        {load.status === 'loading' && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
          </div>
        )}

        {load.status === 'error' && <p className="text-sm text-destructive font-bold text-center py-16">{load.message}</p>}

        {load.status === 'ready' && load.jobs.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 py-16">
            <Icon icon="solar:calendar-linear" className="text-muted-foreground text-4xl" />
            <p className="text-muted-foreground text-sm max-w-xs">No claimed jobs yet — head to the Feed tab to claim one.</p>
          </div>
        )}

        {actionError && (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{actionError}</p>
          </div>
        )}

        {load.status === 'ready' &&
          load.jobs.map((job) => (
            <div
              key={job.id}
              className={`bg-card rounded-[24px] p-5 border border-border border-l-4 shadow-sm ${CLEAN_TYPE_ACCENT[job.clean_type] ?? 'border-l-border'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-foreground">{CLEAN_TYPE_LABEL[job.clean_type] ?? job.clean_type}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {formatBedrooms(job.bedrooms)} &bull; {formatBathrooms(job.bathrooms)}
                  </p>
                </div>
                <p className="font-mono font-extrabold text-primary text-xl">{formatPrice(Number(job.quoted_price) * 0.7)}</p>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground font-medium mb-4">
                <p className="flex items-center gap-1.5">
                  <Icon icon="solar:calendar-linear" /> {formatDateShort(job.service_date)} &bull; {job.time_window}
                </p>
                <a
                  href={mapsUrl(job.address_line, job.city, job.zip)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-secondary font-bold active:opacity-70 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon icon="solar:map-point-linear" className="shrink-0" />
                  <span className="flex-1">
                    {job.address_line}, {job.city}, IN {job.zip}
                  </span>
                  <Icon icon="solar:arrow-right-up-linear" className="shrink-0" />
                </a>
                <p className="flex items-center gap-1.5">
                  <Icon icon="solar:user-linear" /> {job.customer_name}
                </p>
                {job.entry_notes && (
                  <p className="flex items-start gap-1.5">
                    <Icon icon="solar:key-linear" className="mt-0.5" /> {job.entry_notes}
                  </p>
                )}
                {job.has_pets && (
                  <p className="flex items-center gap-1.5">
                    <Icon icon="solar:paw-bold" /> Has pets
                  </p>
                )}
              </div>

              {job.status === 'completed' ? (
                <div className="rounded-full bg-chart-3/10 text-chart-3 font-bold text-sm py-3 text-center">Completed</div>
              ) : (
                <>
                  {/* One-tap turn-by-turn: opens the phone's native maps app
                      already navigating to the job address. */}
                  <a
                    href={directionsUrl(job.address_line, job.city, job.zip)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-secondary text-white font-bold py-3 rounded-full shadow-sm active:scale-[0.98] transition-all mb-3"
                  >
                    <Icon icon="solar:route-bold" className="text-lg" />
                    Navigate to Job
                  </a>
                  <ProofPhoto
                    jobId={job.id}
                    photoCount={photoCounts[job.id] ?? 0}
                    onUploaded={() => setPhotoCounts((prev) => ({ ...prev, [job.id]: (prev[job.id] ?? 0) + 1 }))}
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => handleRelease(job.id)}
                      disabled={busyId === job.id}
                      className="flex-1 bg-card border border-border font-bold text-foreground py-3 rounded-full shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      Release
                    </button>
                    <button
                      type="button"
                      onClick={() => handleComplete(job.id)}
                      disabled={
                        busyId === job.id ||
                        !isServiceDay(job.service_date) ||
                        (photoCounts[job.id] ?? 0) < REQUIRED_PHOTO_COUNT
                      }
                      title={
                        (photoCounts[job.id] ?? 0) < REQUIRED_PHOTO_COUNT
                          ? `Add all ${REQUIRED_PHOTO_COUNT} proof photos before completing`
                          : undefined
                      }
                      className="flex-1 bg-primary text-white font-bold py-3 rounded-full shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {busyId === job.id ? 'Saving…' : 'Complete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}

type PhotoState = { status: 'idle' } | { status: 'uploading' } | { status: 'error'; message: string }

function ProofPhoto({ jobId, photoCount, onUploaded }: { jobId: string; photoCount: number; onUploaded: () => void }) {
  const [state, setState] = useState<PhotoState>({ status: 'idle' })
  const [capturing, setCapturing] = useState(false)

  async function handleCaptured(file: File) {
    setCapturing(false)
    setState({ status: 'uploading' })
    try {
      await uploadJobPhoto(jobId, file)
      setState({ status: 'idle' })
      onUploaded()
    } catch (err) {
      setState({ status: 'error', message: err instanceof PhotoUploadError ? err.message : 'Could not upload that photo.' })
    }
  }

  return (
    <div className="mb-3">
      {photoCount < REQUIRED_PHOTO_COUNT && (
        <p className="text-[11px] text-primary font-bold mb-2 flex items-center gap-1">
          <Icon icon="solar:danger-triangle-bold" /> Add all {REQUIRED_PHOTO_COUNT} proof photos to unlock Complete
        </p>
      )}
      {state.status === 'error' && <p className="text-[11px] text-destructive font-bold mb-2">{state.message}</p>}

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: REQUIRED_PHOTO_COUNT }).map((_, i) => {
          const filled = i < photoCount
          const isNext = i === photoCount
          return (
            <button
              key={i}
              type="button"
              onClick={() => isNext && setCapturing(true)}
              disabled={!isNext || state.status === 'uploading'}
              className={`aspect-square rounded-xl border flex items-center justify-center ${
                filled
                  ? 'bg-chart-3/10 border-chart-3/30'
                  : isNext
                    ? 'bg-secondary/5 border-secondary/20 active:scale-[0.96] transition-transform'
                    : 'bg-muted border-border opacity-50'
              }`}
            >
              {filled ? (
                <Icon icon="solar:check-circle-bold" className="text-chart-3 text-lg" />
              ) : isNext && state.status === 'uploading' ? (
                <div className="h-4 w-4 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
              ) : (
                <Icon icon="solar:camera-bold" className={isNext ? 'text-secondary text-lg' : 'text-muted-foreground text-lg'} />
              )}
            </button>
          )
        })}
      </div>

      {capturing && <StillPhotoCapture onCapture={handleCaptured} onCancel={() => setCapturing(false)} />}
    </div>
  )
}
