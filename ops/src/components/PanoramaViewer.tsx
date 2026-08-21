import { useRef, useState, type PointerEvent } from 'react'
import { Icon } from '@iconify/react'

/**
 * Wide (panorama-shot) images pan horizontally via drag; anything closer to
 * a normal photo aspect ratio just renders contained — there's nothing to
 * pan across.
 */
export function PanoramaViewer({ src, alt }: { src: string; alt: string }) {
  const [isPano, setIsPano] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragState = useRef<{ startX: number; scrollLeft: number } | null>(null)

  function handleLoad() {
    const img = imgRef.current
    if (!img || !img.naturalHeight) return
    setIsPano(img.naturalWidth / img.naturalHeight >= 1.8)
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!containerRef.current) return
    dragState.current = { startX: e.clientX, scrollLeft: containerRef.current.scrollLeft }
    containerRef.current.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragState.current || !containerRef.current) return
    containerRef.current.scrollLeft = dragState.current.scrollLeft - (e.clientX - dragState.current.startX)
  }

  function handlePointerUp() {
    dragState.current = null
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={isPano ? handlePointerDown : undefined}
      onPointerMove={isPano ? handlePointerMove : undefined}
      onPointerUp={isPano ? handlePointerUp : undefined}
      onPointerLeave={isPano ? handlePointerUp : undefined}
      className={`relative rounded-2xl overflow-hidden bg-muted h-64 ${isPano ? 'overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing' : ''}`}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        draggable={false}
        className={isPano ? 'h-full w-auto max-w-none select-none' : 'h-full w-full object-contain select-none'}
      />
      {isPano && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-ink/70 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
          <Icon icon="solar:hand-shake-linear" />
          Drag to look around
        </div>
      )}
    </div>
  )
}
