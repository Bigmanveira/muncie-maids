import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { getAnalytics, type AnalyticsData } from '../lib/api'
import { formatPrice } from '../lib/format'
import { STATUS_CHART_COLOR, STATUS_CHART_ICON, STATUS_CHART_LABEL } from '../lib/chartColors'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: AnalyticsData }

function weekRangeLabel(mondayIso: string): string {
  const [y, m, d] = mondayIso.split('-').map(Number)
  const monday = new Date(y, m - 1, d)
  return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function Analytics() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    getAnalytics()
      .then((data) => setLoad({ status: 'ready', data }))
      .catch((err) => setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Could not load analytics.' }))
  }, [])

  if (load.status === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (load.status === 'error') {
    return <p className="text-sm text-destructive font-bold">{load.message}</p>
  }

  const { weeklyRevenue, statusCounts, leaderboard, summary } = load.data
  const maxWeekRevenue = Math.max(1, ...weeklyRevenue.map((w) => w.revenue))
  const maxLeaderboard = Math.max(1, ...leaderboard.map((l) => l.completedCount))
  const totalStatusCount = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1

  const statusOrder: (keyof typeof statusCounts)[] = ['completed', 'active', 'needs_ops', 'pending_payment', 'cancelled']

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-heading text-2xl font-extrabold text-foreground">Analytics</h2>
        <p className="text-muted-foreground text-sm mt-1">Revenue, booking mix, and cleaner performance.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">Revenue this month</p>
          <p className="font-mono text-2xl font-extrabold text-foreground">{formatPrice(summary.monthRevenue)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">Bookings this month</p>
          <p className="font-mono text-2xl font-extrabold text-foreground">{summary.monthBookingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">Completion rate</p>
          <p className="font-mono text-2xl font-extrabold text-foreground">{Math.round(summary.completionRate * 100)}%</p>
        </div>
      </div>

      {/* Weekly revenue trend — single series, no legend needed */}
      <section>
        <h3 className="font-heading text-lg font-extrabold text-foreground mb-1">Weekly revenue</h3>
        <p className="text-xs text-muted-foreground mb-5">Completed jobs only, last 8 weeks.</p>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-end gap-3 h-44">
            {weeklyRevenue.map((w) => {
              const heightPct = Math.max(2, (w.revenue / maxWeekRevenue) * 100)
              return (
                <div key={w.weekStart} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <p className="text-[11px] font-mono font-bold text-foreground mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatPrice(w.revenue)}
                  </p>
                  <div
                    className="w-full max-w-6 rounded-t-[4px] bg-secondary transition-all"
                    style={{ height: `${heightPct}%` }}
                    title={`${formatPrice(w.revenue)} · ${w.count} job${w.count === 1 ? '' : 's'}`}
                  />
                  <p className="text-[10px] text-muted-foreground font-bold mt-2 whitespace-nowrap">{weekRangeLabel(w.weekStart)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Status breakdown */}
      <section>
        <h3 className="font-heading text-lg font-extrabold text-foreground mb-5">Booking mix</h3>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          {statusOrder.map((key) => {
            const count = statusCounts[key]
            const pct = Math.round((count / totalStatusCount) * 100)
            return (
              <div key={key} className="flex items-center gap-3">
                <Icon icon={STATUS_CHART_ICON[key]} style={{ color: STATUS_CHART_COLOR[key] }} className="text-lg shrink-0" />
                <span className="text-sm font-bold text-foreground w-40 shrink-0">{STATUS_CHART_LABEL[key]}</span>
                <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(count > 0 ? 2 : 0, pct)}%`, backgroundColor: STATUS_CHART_COLOR[key] }}
                  />
                </div>
                <span className="font-mono text-sm font-bold text-foreground w-10 text-right shrink-0">{count}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Cleaner leaderboard — magnitude by entity, identity via direct label not color */}
      <section>
        <h3 className="font-heading text-lg font-extrabold text-foreground mb-1">Cleaner leaderboard</h3>
        <p className="text-xs text-muted-foreground mb-5">Completed jobs, last 8 weeks.</p>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed jobs in this window yet.</p>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            {leaderboard.map((entry) => {
              const pct = Math.max(3, (entry.completedCount / maxLeaderboard) * 100)
              return (
                <div key={entry.cleanerId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-foreground">{entry.cleanerName}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.completedCount} job{entry.completedCount === 1 ? '' : 's'} &bull;{' '}
                      <span className="font-mono font-bold text-foreground">{formatPrice(entry.payout)}</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
