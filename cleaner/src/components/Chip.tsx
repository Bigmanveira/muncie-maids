import type { ReactNode } from 'react'

export function Chip({
  selected,
  onClick,
  children,
  className = '',
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full text-sm font-bold border transition-colors ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-foreground border-border'
      } ${className}`}
    >
      {children}
    </button>
  )
}
