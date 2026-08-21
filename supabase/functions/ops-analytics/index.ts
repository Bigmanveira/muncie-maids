import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

const WEEKS = 8
const LOOKBACK_DAYS = WEEKS * 7

/** Monday-start ISO week key for a yyyy-mm-dd date string. */
function weekKey(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const day = date.getUTCDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diffToMonday)
  return date.toISOString().slice(0, 10)
}

function mondaysBack(count: number): string[] {
  const today = new Date()
  const day = today.getUTCDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() + diffToMonday)

  const keys: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(monday)
    d.setUTCDate(d.getUTCDate() - i * 7)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  const supabase = getSupabaseAdmin()

  const since = new Date()
  since.setDate(since.getDate() - LOOKBACK_DAYS)
  const sinceIso = since.toISOString().slice(0, 10)

  const [recentBookings, allActive, cleaners] = await Promise.all([
    supabase
      .from('bookings')
      .select('status, quoted_price, service_date, cleaner_id, payout_amount')
      .gte('service_date', sinceIso),
    supabase.from('bookings').select('status').gte('created_at', since.toISOString()),
    supabase.from('cleaners').select('id, name'),
  ])

  if (recentBookings.error || allActive.error || cleaners.error) {
    return errorResponse('UNKNOWN', 'Could not load analytics', 500)
  }

  // Weekly revenue trend (completed bookings only — realized, not booked).
  const weekBuckets = new Map<string, { revenue: number; count: number }>()
  for (const key of mondaysBack(WEEKS)) weekBuckets.set(key, { revenue: 0, count: 0 })
  for (const b of recentBookings.data ?? []) {
    if (b.status !== 'completed') continue
    const key = weekKey(b.service_date as string)
    const bucket = weekBuckets.get(key)
    if (bucket) {
      bucket.revenue += Number(b.quoted_price)
      bucket.count += 1
    }
  }
  const weeklyRevenue = [...weekBuckets.entries()].map(([weekStart, v]) => ({
    weekStart,
    revenue: Math.round(v.revenue * 100) / 100,
    count: v.count,
  }))

  // Status breakdown, bucketed for the chart.
  const statusCounts: Record<string, number> = {
    completed: 0,
    active: 0,
    needs_ops: 0,
    pending_payment: 0,
    cancelled: 0,
  }
  for (const b of allActive.data ?? []) {
    const s = b.status as string
    if (s === 'completed') statusCounts.completed++
    else if (s === 'open' || s === 'claimed') statusCounts.active++
    else if (s === 'needs_ops') statusCounts.needs_ops++
    else if (s === 'pending_payment') statusCounts.pending_payment++
    else if (s === 'cancelled') statusCounts.cancelled++
  }

  // Cleaner leaderboard — completed jobs + payout, last LOOKBACK_DAYS.
  const cleanerNameById = new Map((cleaners.data ?? []).map((c) => [c.id, c.name]))
  const leaderboardMap = new Map<string, { completedCount: number; payout: number }>()
  for (const b of recentBookings.data ?? []) {
    if (b.status !== 'completed' || !b.cleaner_id) continue
    const entry = leaderboardMap.get(b.cleaner_id) ?? { completedCount: 0, payout: 0 }
    entry.completedCount += 1
    entry.payout += Number(b.payout_amount ?? 0)
    leaderboardMap.set(b.cleaner_id, entry)
  }
  const leaderboard = [...leaderboardMap.entries()]
    .map(([cleanerId, v]) => ({
      cleanerId,
      cleanerName: cleanerNameById.get(cleanerId) ?? 'Unknown',
      completedCount: v.completedCount,
      payout: Math.round(v.payout * 100) / 100,
    }))
    .sort((a, b) => b.completedCount - a.completedCount)
    .slice(0, 8)

  // This-month summary.
  const monthStart = new Date()
  monthStart.setDate(1)
  const monthStartIso = monthStart.toISOString().slice(0, 10)
  const monthBookings = (recentBookings.data ?? []).filter((b) => (b.service_date as string) >= monthStartIso)
  const monthCompleted = monthBookings.filter((b) => b.status === 'completed')
  const monthCancelled = monthBookings.filter((b) => b.status === 'cancelled')
  const monthRevenue = monthCompleted.reduce((sum, b) => sum + Number(b.quoted_price), 0)
  const monthTotal = monthBookings.length
  const completionRate = monthTotal > 0 ? monthCompleted.length / (monthTotal - monthCancelled.length || 1) : 0

  return jsonResponse({
    weeklyRevenue,
    statusCounts,
    leaderboard,
    summary: {
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      monthBookingCount: monthTotal,
      monthCompletedCount: monthCompleted.length,
      completionRate: Math.round(completionRate * 100) / 100,
    },
  })
})
