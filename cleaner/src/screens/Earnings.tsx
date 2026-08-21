import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/AuthContext'
import { SweepStripes } from '../components/SweepStripes'
import { supabase } from '../lib/supabase'
import { CLEAN_TYPE_ACCENT, CLEAN_TYPE_LABEL, formatDateShort, formatPrice } from '../lib/format'

interface EarningRow {
  id: string
  service_date: string
  clean_type: string
  payout_amount: number | null
  payout_paid_at: string | null
}

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; rows: EarningRow[] }

export function Earnings() {
  const { logout } = useAuth()
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    supabase
      .from('bookings')
      .select('id, service_date, clean_type, payout_amount, payout_paid_at')
      .eq('status', 'completed')
      .order('service_date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoad({ status: 'error' })
          return
        }
        setLoad({ status: 'ready', rows: (data ?? []) as EarningRow[] })
      })
  }, [])

  const rows = load.status === 'ready' ? load.rows : []
  const totalEarned = rows.reduce((sum, r) => sum + Number(r.payout_amount ?? 0), 0)
  const totalPending = rows.filter((r) => !r.payout_paid_at).reduce((sum, r) => sum + Number(r.payout_amount ?? 0), 0)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative px-6 pt-8 pb-8 overflow-hidden bg-ink rounded-b-[28px]">
        <SweepStripes />
        <div className="relative flex items-center justify-between mb-8">
          <p className="text-[10px] text-ink-foreground/60 font-bold uppercase tracking-[0.15em]">Earnings</p>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-ink-foreground active:scale-95 transition-transform"
          >
            <Icon icon="solar:logout-2-linear" className="text-lg" />
          </button>
        </div>
        <div className="relative grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] text-ink-foreground/50 font-bold uppercase tracking-[0.1em] mb-1">Total Earned</p>
            <p className="font-mono text-3xl font-extrabold text-ink-foreground">{formatPrice(totalEarned)}</p>
          </div>
          <div>
            <p className="text-[10px] text-ink-foreground/50 font-bold uppercase tracking-[0.1em] mb-1">Pending Payout</p>
            <p className="font-mono text-3xl font-extrabold text-primary">{formatPrice(totalPending)}</p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-start gap-3 mb-6">
          <Icon icon="solar:info-circle-bold" className="text-secondary text-lg shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Paid out weekly by manual transfer. Status below updates once a payout is recorded.
          </p>
        </div>

        {load.status === 'loading' && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
          </div>
        )}

        {load.status === 'error' && <p className="text-sm text-destructive font-bold text-center py-16">Could not load earnings.</p>}

        {load.status === 'ready' && rows.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 py-16">
            <Icon icon="solar:wallet-linear" className="text-muted-foreground text-4xl" />
            <p className="text-muted-foreground text-sm max-w-xs">Completed jobs and their payouts will show up here.</p>
          </div>
        )}

        <div className="space-y-3 pb-6">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`bg-card rounded-2xl p-4 border border-border border-l-4 shadow-sm flex items-center justify-between ${CLEAN_TYPE_ACCENT[row.clean_type] ?? 'border-l-border'}`}
            >
              <div>
                <p className="font-bold text-foreground text-sm">{CLEAN_TYPE_LABEL[row.clean_type] ?? row.clean_type}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDateShort(row.service_date)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-extrabold text-foreground">{formatPrice(Number(row.payout_amount ?? 0))}</p>
                <p className={`text-[11px] font-bold ${row.payout_paid_at ? 'text-chart-3' : 'text-muted-foreground'}`}>
                  {row.payout_paid_at ? 'Paid' : 'Unpaid'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
