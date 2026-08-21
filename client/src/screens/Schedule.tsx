import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { StepHeader } from '../components/StepHeader'
import { SummaryBar } from '../components/SummaryBar'
import { DateCalendar } from '../components/DateCalendar'
import { useFunnel } from '../context/FunnelContext'
import { firstBookableDate, TIME_WINDOWS } from '../lib/dates'

export function Schedule() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, setSchedule } = useFunnel()
  const bannerMessage = (location.state as { message?: string } | null)?.message

  const [serviceDate, setServiceDate] = useState(state.schedule?.serviceDate ?? firstBookableDate())
  const [timeWindow, setTimeWindow] = useState(state.schedule?.timeWindow ?? '')

  function handleContinue() {
    if (!timeWindow) return
    setSchedule({ serviceDate, timeWindow })
    navigate('/details')
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <StepHeader step={2} />

      <div className="px-6 flex-1 space-y-10 pb-56 max-w-md mx-auto w-full">
        {bannerMessage && (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{bannerMessage}</p>
          </div>
        )}

        <section>
          <h3 className="font-bold text-foreground text-lg mb-5">Select Date</h3>
          <DateCalendar selectedDate={serviceDate} onSelect={setServiceDate} />
        </section>

        <section>
          <h3 className="font-bold text-foreground text-lg mb-5">Select Arrival Window</h3>
          <div className="space-y-4">
            {TIME_WINDOWS.map((window) => {
              const selected = timeWindow === window.value
              return (
                <button
                  key={window.value}
                  type="button"
                  onClick={() => setTimeWindow(window.value)}
                  className={`w-full p-6 flex items-center justify-between rounded-[24px] border transition-all ${
                    selected ? 'bg-secondary border-secondary shadow-lg shadow-secondary/10' : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selected ? 'bg-white/10' : 'bg-accent'}`}>
                      <Icon icon={window.icon} className={`text-2xl ${selected ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-bold ${selected ? 'text-white' : 'text-foreground'}`}>{window.label}</p>
                      <p className={`text-sm ${selected ? 'text-white/70' : 'text-muted-foreground'}`}>{window.range}</p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selected ? 'border-white bg-white' : 'border-border'
                    }`}
                  >
                    {selected && <div className="w-2.5 h-2.5 rounded-full bg-secondary" />}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-border z-20 transform-gpu">
        <div className="max-w-md mx-auto">
          <SummaryBar scheduleOverride={timeWindow ? { serviceDate, timeWindow } : null} />
          <button
            type="button"
            onClick={handleContinue}
            disabled={!timeWindow}
            className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
