// Mirrors client/src/lib/dates.ts TIME_WINDOWS start hours — needed here to
// compute "hours until visit" for the cancellation fee policy.
const START_HOUR: Record<string, number> = {
  Morning: 8,
  'Mid-day': 11,
  Afternoon: 14,
}

export function timeWindowStartHour(value: string): number {
  return START_HOUR[value] ?? 8
}
