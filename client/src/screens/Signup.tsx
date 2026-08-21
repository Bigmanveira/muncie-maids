import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { SimpleHeader } from '../components/SimpleHeader'
import { TextField } from '../components/TextField'
import { useAuth } from '../context/AuthContext'
import { isValidEmail, isValidPhone } from '../lib/validation'

export function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
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
        navigate(from ?? '/onboarding')
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
      <div className="min-h-dvh bg-background flex flex-col">
        <SimpleHeader title="Create Account" />
        <div className="px-6 flex-1 flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto w-full py-12">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <Icon icon="solar:letter-bold" className="text-secondary text-3xl" />
          </div>
          <h2 className="font-heading text-xl font-extrabold text-foreground">Check your email</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            We sent a confirmation link to {email}. Follow it to finish creating your account, then sign in.
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
    <div className="min-h-dvh bg-background flex flex-col">
      <SimpleHeader title="Create Account" />

      <form onSubmit={handleSubmit} className="px-6 flex-1 flex flex-col max-w-md mx-auto w-full pb-8">
        <div className="mb-8 mt-4">
          <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Join Muncie Maids</h2>
          <p className="text-muted-foreground text-sm">Save your details for faster booking next time.</p>
        </div>

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

        <p className="text-[11px] text-muted-foreground leading-relaxed mt-6">
          By creating an account you agree to our{' '}
          <button type="button" onClick={() => navigate('/terms')} className="font-bold text-secondary">
            Terms of Service
          </button>{' '}
          and{' '}
          <button type="button" onClick={() => navigate('/privacy')} className="font-bold text-secondary">
            Privacy Policy
          </button>
          .
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-8"
        >
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-muted-foreground my-8">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login', { state: location.state })} className="font-bold text-secondary">
            Sign in
          </button>
        </p>
      </form>
    </div>
  )
}
