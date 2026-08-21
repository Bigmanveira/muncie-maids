import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-foreground mb-2 ml-1">
        {label}
      </label>
      <input
        id={id}
        className={`w-full min-h-11 bg-card border rounded-2xl px-4 py-3 text-base focus:ring-2 outline-none shadow-sm transition-colors ${
          error
            ? 'border-destructive/40 focus:ring-destructive/10 focus:border-destructive'
            : 'border-border focus:ring-secondary/20 focus:border-secondary'
        } ${className}`}
        onWheel={props.type === 'number' ? (e) => e.currentTarget.blur() : undefined}
        {...props}
      />
      {error && <p className="text-[11px] text-destructive font-bold mt-2 ml-1">{error}</p>}
    </div>
  )
}
