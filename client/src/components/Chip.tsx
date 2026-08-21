import type { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean
}

export function Chip({ selected, className = '', ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`min-h-11 px-6 py-3.5 rounded-2xl border font-bold text-sm transition-colors ${
        selected
          ? 'bg-primary border-primary text-white shadow-md'
          : 'bg-card border-border text-foreground hover:border-primary/50'
      } ${className}`}
      {...props}
    />
  )
}
