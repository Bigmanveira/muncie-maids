/**
 * The one signature visual motif for this app: a squeegee/mop streak across
 * the dark "shift" hero panels. Use sparingly — Splash, Login, and the
 * Earnings summary card only.
 */
export function SweepStripes({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sweep-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D65A5A" stopOpacity="0" />
          <stop offset="70%" stopColor="#D65A5A" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#D65A5A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sweep-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="270" y1="-60" x2="520" y2="220" stroke="url(#sweep-a)" strokeWidth="10" strokeLinecap="round" />
      <line x1="330" y1="-60" x2="580" y2="220" stroke="url(#sweep-b)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}
