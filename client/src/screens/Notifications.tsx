import { useState } from 'react'
import { Icon } from '@iconify/react'
import { SimpleHeader } from '../components/SimpleHeader'

const NOTIFICATIONS = [
  {
    id: 'welcome',
    icon: 'solar:check-circle-bold',
    iconClass: 'text-chart-3',
    title: 'Welcome to Muncie Maids',
    body: 'Get an instant price and book your first cleaning in minutes.',
    fullBody:
      'Get an instant price and book your first cleaning in minutes. We proudly serve Muncie, Yorktown, Gaston, and Albany with background-checked, insured local cleaning teams. Your first clean is just a few taps away — tell us about your home and see your exact price instantly, no quotes or callbacks required.',
    time: 'Just now',
  },
  {
    id: 'reminder',
    icon: 'solar:calendar-bold',
    iconClass: 'text-secondary',
    title: 'Upcoming cleaning reminder',
    body: 'Your next visit is coming up — check the Bookings tab for details.',
    fullBody:
      'Your next visit is coming up. Check the Bookings tab for your arrival window and any updates from your cleaning team. Need to make a change? You can reschedule or cancel anytime from the booking details page — cancellations are free up to 24 hours before your visit.',
    time: '1 day ago',
  },
  {
    id: 'feedback',
    icon: 'solar:star-bold',
    iconClass: 'text-chart-4',
    title: 'How did we do?',
    body: 'Your last cleaning is complete. Let us know how it went.',
    fullBody:
      "Your last cleaning is complete! We hope your home is looking great. If anything wasn't up to standard, reach out through the Chat tab and our team will make it right. Your feedback also helps us match you with the best cleaning team next time.",
    time: '3 days ago',
  },
] as const

export function Notifications() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="min-h-dvh bg-background">
      <SimpleHeader title="Notifications" />
      <div className="px-6 py-6 space-y-3 max-w-xl mx-auto">
        {NOTIFICATIONS.map((n) => {
          const expanded = expandedId === n.id
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setExpandedId(expanded ? null : n.id)}
              aria-expanded={expanded}
              className="w-full text-left bg-card rounded-[24px] p-5 border border-border shadow-sm flex items-start gap-4 active:scale-[0.99] transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <Icon icon={n.icon} className={`${n.iconClass} text-xl`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-foreground text-sm">{n.title}</h3>
                  <Icon
                    icon="solar:alt-arrow-down-linear"
                    className={`text-muted-foreground text-base shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </div>
                <p className={`text-sm text-muted-foreground mt-0.5 ${expanded ? '' : 'line-clamp-2'}`}>
                  {expanded ? n.fullBody : n.body}
                </p>
                <p className="text-[11px] text-muted-foreground/70 font-bold uppercase tracking-wider mt-2">{n.time}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
