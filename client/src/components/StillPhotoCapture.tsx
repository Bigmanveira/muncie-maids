import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Icon } from '@iconify/react'

type Phase = 'starting' | 'ready' | 'review' | 'error'

/** In-app single-photo capture: live camera preview, snap a still, confirm or retake. */
export function StillPhotoCapture({ onCapture, onCancel }: { onCapture: (file: File) => void; onCancel: () => void }) {
  const [phase, setPhase] = useState<Phase>('starting')
  const [errorMessage, setErrorMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCamera() {
    setPhase('starting')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch {
          // autoplay hiccup — the stream is still attached, capture will work regardless
        }
      }
      setPhase('ready')
    } catch {
      setErrorMessage("Couldn't access your camera — you can still choose a photo below.")
      setPhase('error')
    }
  }

  function capture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
    canvasRef.current = canvas
    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85))
    setPhase('review')
  }

  function retake() {
    setPreviewUrl(null)
    setPhase('ready')
  }

  function usePhoto() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.85,
    )
  }

  function handleFallbackFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onCapture(file)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <Icon icon="solar:close-circle-linear" className="text-xl" />
        </button>
        <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Take a photo</p>
        <div className="w-10" />
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />

        {phase === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          </div>
        )}

        {phase === 'review' && previewUrl && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <img src={previewUrl} alt="Captured photo" className="max-w-full max-h-full object-contain select-none" draggable={false} />
          </div>
        )}

        {phase === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Icon icon="solar:camera-off-bold" className="text-white/60 text-4xl" />
            <p className="text-white/80 text-sm">{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="px-6 py-6 space-y-3">
        {phase === 'ready' && (
          <button
            type="button"
            onClick={capture}
            className="w-full bg-white text-black font-bold py-4 rounded-full shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Icon icon="solar:camera-bold" className="text-lg" />
            Capture
          </button>
        )}

        {phase === 'review' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={retake}
              className="flex-1 bg-white/10 text-white font-bold py-4 rounded-full active:scale-[0.98] transition-all"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={usePhoto}
              className="flex-1 bg-primary text-white font-bold py-4 rounded-full shadow-sm active:scale-[0.98] transition-all"
            >
              Use this photo
            </button>
          </div>
        )}

        {phase !== 'review' && (
          <label className="block text-center text-white/50 text-xs font-bold underline underline-offset-2">
            {phase === 'error' ? 'Choose a photo instead' : 'Or choose a photo from your library'}
            <input type="file" accept="image/*" capture="environment" onChange={handleFallbackFile} className="hidden" />
          </label>
        )}
      </div>
    </div>
  )
}
