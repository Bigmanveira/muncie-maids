import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { ApiError, listPayouts, markPaid, type Payout } from '../lib/api'
import { CLEAN_TYPE_LABEL, formatDateShort, formatPrice } from '../lib/format'
import { weekKey, weekLabel } from '../lib/weeks'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; payouts: Payout[] }

interface WeekGroup {
  key: string
  jobs: Payout[]
}

interface CleanerGroup {
  cleanerId: string | null
  cleanerName: string
  weeks: WeekGroup[]
}

function groupPayouts(payouts: Payout[]): CleanerGroup[] {
  const byCleaner = new Map<string, Payout[]>()
  for (const p of payouts) {
    const key = p.cleanerId ?? 'unassigned'
    if (!byCleaner.has(key)) byCleaner.set(key, [])
    byCleaner.get(key)!.push(p)
  }

  return [...byCleaner.entries()].map(([cleanerId, jobs]) => {
    const byWeek = new Map<string, Payout[]>()
    for (const job of jobs) {
      const wk = weekKey(job.serviceDate)
      if (!byWeek.has(wk)) byWeek.set(wk, [])
      byWeek.get(wk)!.push(job)
    }
    const weeks = [...byWeek.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, jobs]) => ({ key, jobs }))

    return {
      cleanerId: cleanerId === 'unassigned' ? null : cleanerId,
      cleanerName: jobs[0].cleanerName,
      weeks,
    }
  })
}

export function Payouts() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function refresh() {
    setLoad({ status: 'loading' })
    try {
      const { payouts } = await listPayouts()
      setLoad({ status: 'ready', payouts })
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Could not load payouts.' })
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleMarkWeekPaid(groupKey: string, jobs: Payout[]) {
    const unpaidIds = jobs.filter((j) => !j.payoutPaidAt).map((j) => j.id)
    if (unpaidIds.length === 0) return
    setBusyKey(groupKey)
    setActionError(null)
    try {
      await markPaid(unpaidIds)
      await refresh()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not mark this week paid.')
    } finally {
      setBusyKey(null)
    }
  }

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

  const groups = groupPayouts(load.payouts)
  const totalPending = load.payouts.filter((p) => !p.payoutPaidAt).reduce((sum, p) => sum + p.payoutAmount, 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-extrabold text-foreground">Payouts</h2>
        <p className="text-muted-foreground text-sm mt-1">Completed jobs, grouped by cleaner and week.</p>
      </div>

      <div className="bg-ink text-ink-foreground rounded-3xl p-6 inline-block">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-foreground/50 mb-1">Total Pending Payout</p>
        <p className="font-mono text-3xl font-extrabold text-primary">{formatPrice(totalPending)}</p>
      </div>

      {actionError && (
        <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
          <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
          <p className="text-sm text-foreground font-medium">{actionError}</p>
        </div>
      )}

      {groups.length === 0 && <p className="text-sm text-muted-foreground py-8">No completed jobs yet.</p>}

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.cleanerId ?? 'unassigned'}>
            <h3 className="font-heading text-lg font-extrabold text-foreground mb-4">{group.cleanerName}</h3>
            <div className="space-y-4">
              {group.weeks.map((week) => {
                const groupKey = `${group.cleanerId}-${week.key}`
                const unpaid = week.jobs.filter((j) => !j.payoutPaidAt)
                const weekTotal = week.jobs.reduce((sum, j) => sum + j.payoutAmount, 0)
                return (
                  <div key={week.key} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="font-bold text-foreground text-sm">{weekLabel(week.key)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {week.jobs.length} job{week.jobs.length === 1 ? '' : 's'} &bull; {formatPrice(weekTotal)} total
                        </p>
                      </div>
                      {unpaid.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleMarkWeekPaid(groupKey, week.jobs)}
                          disabled={busyKey === groupKey}
                          className="bg-secondary text-white font-bold px-4 py-2 rounded-full text-xs disabled:opacity-50"
                        >
                          {busyKey === groupKey ? 'Saving…' : `Mark Week Paid (${formatPrice(unpaid.reduce((s, j) => s + j.payoutAmount, 0))})`}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-chart-3 text-xs font-bold">
                          <Icon icon="solar:check-circle-bold" /> Fully paid
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-border/60">
                      {week.jobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-muted-foreground">
                            {formatDateShort(job.serviceDate)} &bull; {CLEAN_TYPE_LABEL[job.cleanType] ?? job.cleanType}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground">{formatPrice(job.payoutAmount)}</span>
                            <span className={`text-[10px] font-bold ${job.payoutPaidAt ? 'text-chart-3' : 'text-muted-foreground'}`}>
                              {job.payoutPaidAt ? 'PAID' : 'UNPAID'}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
