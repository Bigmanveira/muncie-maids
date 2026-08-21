function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function Avatar({ name, photoUrl, size = 44 }: { name: string; photoUrl?: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="rounded-full object-cover border-2 border-white shadow-sm shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full bg-primary text-white font-bold flex items-center justify-center border-2 border-white shadow-sm shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name) || '?'}
    </div>
  )
}
