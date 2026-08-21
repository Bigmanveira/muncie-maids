import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-foreground mb-3 ml-1">
        {label}
      </label>
      <input
        id={id}
        className={`w-full min-h-11 bg-card border rounded-[24px] px-5 py-4.5 text-base focus:ring-2 outline-none shadow-sm transition-colors ${
          error
            ? 'border-destructive/40 focus:ring-destructive/10 focus:border-destructive'
            : 'border-border focus:ring-secondary/20 focus:border-secondary'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-destructive font-bold mt-2.5 ml-1">{error}</p>}
    </div>
  )
}
