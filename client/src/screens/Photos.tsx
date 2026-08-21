import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { StepHeader } from '../components/StepHeader'
import { PhotoSlotCapture } from '../components/PhotoSlotCapture'
import { setPendingPhotos } from '../lib/pendingPhotos'
import { isStripeConfigured } from '../lib/stripe'
import { isSupabaseConfigured } from '../lib/supabase'

const isDemoMode = !isSupabaseConfigured || !isStripeConfigured

export function Photos() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])

  function handleContinue() {
    // Demo bookings are never written to the real DB, so there's no row to attach
    // a photo to — captured files here are preview-only and simply discarded.
    if (!isDemoMode) setPendingPhotos(files)
    navigate('/pay')
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <StepHeader step={4} />

      <div className="px-6 flex-1 space-y-6 pb-40 max-w-md mx-auto w-full">
        <div>
          <h3 className="font-bold text-foreground text-lg mb-2">Add a few room photos</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Optional, but it helps your cleaner know what to expect — and gives everyone proof of the space
            beforehand if there's ever a dispute.
          </p>
        </div>

        <PhotoSlotCapture files={files} onFilesChange={setFiles} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-border z-20 transform-gpu">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {files.length > 0 ? `Continue with ${files.length} photo${files.length > 1 ? 's' : ''}` : 'Skip for now'}
            <Icon icon="solar:arrow-right-bold" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  )
}
