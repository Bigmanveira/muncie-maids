import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Fades + slides a section in the first time it scrolls into view. `delayMs` staggers a series of cards. */
export function ScrollReveal({
  children,
  className = '',
  delayMs = 0,
}: {
  children: ReactNode
  className?: string
  delayMs?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={visible && delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
      className={`${className} ${visible ? 'reveal-up' : 'reveal-hidden'}`}
    >
      {children}
    </div>
  )
}
