import { useState } from 'react'
import { Icon } from '@iconify/react'

interface CancelRescheduleControlsProps {
  canManage: boolean
  previewRefundPercent: number
  onConfirm: (thenReschedule: boolean) => Promise<void>
}

export function CancelRescheduleControls({ canManage, previewRefundPercent, onConfirm }: CancelRescheduleControlsProps) {
  const [panel, setPanel] = useState<'closed' | 'confirming-cancel' | 'confirming-reschedule'>('closed')
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (!canManage) return null

  async function handleConfirm(thenReschedule: boolean) {
    setWorking(true)
    setActionError(null)
    try {
      await onConfirm(thenReschedule)
      setPanel('closed')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not cancel this booking.')
    } finally {
      setWorking(false)
    }
  }

  if (panel === 'closed') {
    return (
      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPanel('confirming-reschedule')}
          className="flex items-center justify-center gap-2 bg-card border border-border font-bold text-foreground py-4 rounded-full shadow-sm active:scale-[0.98] transition-all text-sm"
        >
          <Icon icon="solar:calendar-mark-bold" className="text-secondary text-lg" />
          Reschedule
        </button>
        <button
          type="button"
          onClick={() => setPanel('confirming-cancel')}
          className="flex items-center justify-center gap-2 bg-card border border-destructive/30 font-bold text-destructive py-4 rounded-full shadow-sm active:scale-[0.98] transition-all text-sm"
        >
          <Icon icon="solar:close-circle-bold" className="text-lg" />
          Cancel Booking
        </button>
      </section>
    )
  }

  return (
    <section className="rounded-2xl bg-muted/40 border border-border/60 p-6 space-y-4">
      <p className="text-sm text-foreground font-medium leading-relaxed">
        {panel === 'confirming-reschedule'
          ? "We'll cancel this visit and take you to book a new time."
          : "We'll cancel this visit."}{' '}
        {previewRefundPercent === 100 ? "You'll receive a full refund." : "You're inside 24 hours of your visit, so we'll refund 50%."}
      </p>
      {actionError && <p className="text-sm text-destructive font-bold">{actionError}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPanel('closed')}
          disabled={working}
          className="bg-card border border-border font-bold text-foreground py-3 rounded-full shadow-sm active:scale-[0.98] transition-all text-sm disabled:opacity-50"
        >
          Keep My Booking
        </button>
        <button
          type="button"
          onClick={() => handleConfirm(panel === 'confirming-reschedule')}
          disabled={working}
          className="bg-destructive text-white font-bold py-3 rounded-full shadow-sm active:scale-[0.98] transition-all text-sm disabled:opacity-50"
        >
          {working ? 'Cancelling…' : 'Confirm'}
        </button>
      </div>
    </section>
  )
}
