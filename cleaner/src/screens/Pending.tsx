import { Icon } from '@iconify/react'
import { useAuth, type CleanerStatus } from '../context/AuthContext'

const CONTENT: Record<Exclude<CleanerStatus, 'active'>, { icon: string; title: string; body: string }> = {
  applied: {
    icon: 'solar:hourglass-bold',
    title: 'Application submitted',
    body: "Our team is reviewing your application. We'll be in touch once you're approved — your gig feed will unlock automatically.",
  },
  declined: {
    icon: 'solar:close-circle-bold',
    title: "We can't move forward right now",
    body: "Your application wasn't approved this time. Reach out to our team if you think this was a mistake.",
  },
  deactivated: {
    icon: 'solar:pause-circle-bold',
    title: 'Your account is paused',
    body: 'Your access to the gig feed has been paused. Contact our team if you have questions.',
  },
}

export function Pending({ status }: { status: Exclude<CleanerStatus, 'active'> }) {
  const { logout } = useAuth()
  const { icon, title, body } = CONTENT[status]

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center text-center gap-4 px-6">
      <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
        <Icon icon={icon} className="text-secondary text-3xl" />
      </div>
      <h2 className="font-heading text-xl font-extrabold text-foreground">{title}</h2>
      <p className="text-muted-foreground text-sm max-w-xs">{body}</p>
      <button type="button" onClick={logout} className="text-sm font-bold text-secondary mt-4">
        Sign Out
      </button>
    </div>
  )
}
