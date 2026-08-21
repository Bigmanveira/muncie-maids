import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { TextField } from '../components/TextField'
import { SweepStripes } from '../components/SweepStripes'
import { useAuth } from '../context/AuthContext'
import { isValidEmail, isValidPhone } from '../lib/validation'

function Header() {
  const navigate = useNavigate()
  return (
    <div className="relative px-6 pt-8 pb-14 overflow-hidden">
      <SweepStripes />
      <div className="relative max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mb-8 active:scale-95 transition-transform"
        >
          <Icon icon="solar:arrow-left-linear" className="text-xl text-ink-foreground" />
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-2">Cleaner Portal</p>
        <h1 className="font-heading text-3xl font-extrabold text-ink-foreground">Join as a cleaner</h1>
      </div>
    </div>
  )
}

export function Signup() {
  const navigate = useNavigate()
  const { signup, resendConfirmation } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name.')
    if (!isValidEmail(email)) return setError('Enter a valid email address.')
    if (!isValidPhone(phone)) return setError('Enter a valid 10-digit phone number.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setSubmitting(true)
    setError(null)
    try {
      const { confirmEmail } = await signup({ name: name.trim(), email: email.trim(), phone, password })
      if (confirmEmail) {
        setAwaitingConfirmation(true)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setResent(false)
    try {
      await resendConfirmation(email.trim())
      setResent(true)
    } catch {
      // Resend failures aren't critical — the original email is likely still usable.
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="min-h-dvh bg-ink flex flex-col">
        <Header />
        <div className="flex-1 bg-background rounded-t-[36px] -mt-8 px-6 pt-14 pb-12 flex flex-col items-center text-center gap-4 max-w-md mx-auto w-full">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <Icon icon="solar:letter-bold" className="text-secondary text-3xl" />
          </div>
          <h2 className="font-heading text-xl font-extrabold text-foreground">Check your email</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            We sent a confirmation link to {email}. Follow it, then sign in to finish your application.
          </p>
          <button type="button" onClick={handleResend} className="text-sm font-bold text-secondary mt-2">
            {resent ? 'Email resent' : "Didn't get it? Resend"}
          </button>
          <button type="button" onClick={() => navigate('/login')} className="text-sm font-bold text-foreground mt-6">
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-ink flex flex-col">
      <Header />

      <div className="flex-1 bg-background rounded-t-[36px] -mt-8">
        <form onSubmit={handleSubmit} className="px-6 pt-10 flex-1 flex flex-col max-w-md mx-auto w-full pb-8">
          <p className="text-muted-foreground text-sm mb-8">Create your account — we'll ask about your towns and experience next.</p>

          <div className="space-y-6">
            <TextField id="name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" />
            <TextField id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" autoComplete="email" />
            <TextField id="phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(765) 555-0100" autoComplete="tel" />
            <TextField id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
            <TextField id="confirm" label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" />
          </div>

          {error && (
            <div className="mt-6 rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
              <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
              <p className="text-sm text-foreground font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-8"
          >
            {submitting ? 'Creating account…' : 'Continue'}
          </button>

          <p className="text-center text-sm text-muted-foreground my-8">
            Already applied?{' '}
            <button type="button" onClick={() => navigate('/login')} className="font-bold text-secondary">
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
