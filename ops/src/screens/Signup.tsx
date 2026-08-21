import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { TextField } from '../components/TextField'
import { useAuth } from '../context/AuthContext'
import { isValidEmail } from '../lib/validation'

export function Signup() {
  const navigate = useNavigate()
  const { signup, resendConfirmation } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setSubmitting(true)
    setError(null)
    try {
      const { confirmEmail } = await signup({ name: name.trim(), email: email.trim(), password })
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
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
          <Icon icon="solar:letter-bold" className="text-secondary text-3xl" />
        </div>
        <h2 className="font-heading text-xl font-extrabold text-foreground">Check your email</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          We sent a confirmation link to {email}. Follow it, then sign in. If you're not the first ops account, an
          existing owner will need to grant you access before the dashboard unlocks.
        </p>
        <button type="button" onClick={handleResend} className="text-sm font-bold text-secondary mt-2">
          {resent ? 'Email resent' : "Didn't get it? Resend"}
        </button>
        <button type="button" onClick={() => navigate('/login')} className="text-sm font-bold text-foreground mt-6">
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-1">Muncie Maids</p>
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Create Ops Account</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
          <TextField id="name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" />
          <TextField id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@munciemaids.com" autoComplete="email" />
          <TextField id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
          <TextField id="confirm" label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" />

          {error && (
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
              <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
              <p className="text-sm text-foreground font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-full shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className="font-bold text-secondary">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
