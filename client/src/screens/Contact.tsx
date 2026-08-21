import { useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { SimpleHeader } from '../components/SimpleHeader'
import { TextField } from '../components/TextField'
import { Footer } from '../components/Footer'
import { SERVICE_TOWNS } from '../lib/geolocation'
import { isValidEmail } from '../lib/validation'

const SUPPORT_EMAIL = 'support@munciemaids.com'

interface Channel {
  icon: string
  badgeClass: string
  title: string
  value: string
  href?: string
  to?: string
}

const CHANNELS: Channel[] = [
  {
    icon: 'solar:letter-bold',
    badgeClass: 'bg-chart-2/10 text-chart-2',
    title: 'Email us',
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: 'solar:chat-round-dots-bold',
    badgeClass: 'bg-chart-1/10 text-chart-1',
    title: 'Live chat',
    value: 'Instant answers, in the app',
    to: '/chat',
  },
]

export function Contact() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)

  const canSend = name.trim().length > 0 && isValidEmail(email) && message.trim().length > 0

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!canSend) return
    const subject = encodeURIComponent(`Message from ${name.trim()}`)
    const body = encodeURIComponent(`${message.trim()}\n\n— ${name.trim()} (${email.trim()})`)
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-dvh bg-background">
      <SimpleHeader title="Contact Us" />

      <div className="px-6 pt-4 pb-12 max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground mb-3 leading-tight">
            Talk to a real person
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
            Questions about a booking, your account, or your cleaning team — reach us any way that's easiest.
          </p>
          <div className="inline-flex items-center gap-2 mt-5 bg-chart-3/10 text-chart-3 rounded-full px-4 py-2">
            <Icon icon="solar:clock-circle-bold" className="text-base" />
            <span className="text-xs font-bold">Avg. reply time under 2 hours, Mon&ndash;Sat 8am&ndash;6pm</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {CHANNELS.map((channel) => {
            const to = channel.to
            return (
              <a
                key={channel.title}
                href={channel.href}
                onClick={
                  to
                    ? (e) => {
                        e.preventDefault()
                        navigate(to)
                      }
                    : undefined
                }
                className="bg-card rounded-[24px] p-5 border border-border shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform"
              >
                <div className={`w-12 h-12 rounded-2xl ${channel.badgeClass} flex items-center justify-center shrink-0`}>
                  <Icon icon={channel.icon} className="text-2xl" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-sm">{channel.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{channel.value}</p>
                </div>
              </a>
            )
          })}
        </div>

        <div className="bg-card rounded-[28px] p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Icon icon="solar:map-point-bold" className="text-secondary text-xl" />
            <h3 className="font-bold text-foreground text-sm">Serving Delaware County</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVICE_TOWNS.map((town) => (
              <span key={town.name} className="bg-secondary/5 text-secondary text-xs font-bold px-3 py-1.5 rounded-full">
                {town.name}, IN
              </span>
            ))}
          </div>
        </div>

        <section>
          <h2 className="font-heading text-xl font-bold mb-5">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <TextField
              id="contactName"
              label="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              error={touched && !name.trim() ? 'Enter your name' : undefined}
            />
            <TextField
              id="contactEmail"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              error={touched && !isValidEmail(email) ? 'Enter a valid email address' : undefined}
            />
            <div>
              <label htmlFor="contactMessage" className="block text-sm font-bold text-foreground mb-3 ml-1">
                Message
              </label>
              <textarea
                id="contactMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-card border border-border rounded-[24px] p-5 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none h-32 placeholder:text-muted-foreground/40 shadow-sm"
                placeholder="How can we help?"
              />
              {touched && !message.trim() && (
                <p className="text-[11px] text-destructive font-bold mt-2.5 ml-1">Enter a message</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Send Message
              <Icon icon="solar:arrow-right-bold" className="text-lg" />
            </button>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              This opens your email app with the message pre-filled, addressed to {SUPPORT_EMAIL}.
            </p>
          </form>
        </section>
      </div>

      <Footer />
    </div>
  )
}
