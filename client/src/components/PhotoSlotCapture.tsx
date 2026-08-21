import { useState } from 'react'
import { Icon } from '@iconify/react'
import { StillPhotoCapture } from './StillPhotoCapture'

const SLOT_COUNT = 4

/** A 4-slot photo grid — tap an empty slot to capture, tap a filled slot to retake it. */
export function PhotoSlotCapture({ files, onFilesChange }: { files: File[]; onFilesChange: (files: File[]) => void }) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const previews = useState(() => new Map<File, string>())[0]

  function previewFor(file: File): string {
    let url = previews.get(file)
    if (!url) {
      url = URL.createObjectURL(file)
      previews.set(file, url)
    }
    return url
  }

  function handleCaptured(file: File) {
    if (activeSlot === null) return
    const next = [...files]
    next[activeSlot] = file
    onFilesChange(next.filter(Boolean))
    setActiveSlot(null)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: SLOT_COUNT }).map((_, i) => {
          const file = files[i]
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSlot(i)}
              className="aspect-square rounded-2xl border border-border bg-card overflow-hidden relative flex items-center justify-center"
            >
              {file ? (
                <>
                  <img src={previewFor(file)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1.5 right-1.5 bg-black/60 rounded-full p-1.5">
                    <Icon icon="solar:pen-2-bold" className="text-white text-xs" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Icon icon="solar:camera-bold" className="text-2xl" />
                  <span className="text-[11px] font-bold">Photo {i + 1}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {activeSlot !== null && <StillPhotoCapture onCapture={handleCaptured} onCancel={() => setActiveSlot(null)} />}
    </>
  )
}
