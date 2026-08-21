import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { TextField } from '../components/TextField'
import { useAuth } from '../context/AuthContext'
import { isValidEmail } from '../lib/validation'

export function ForgotPassword() {
  const navigate = useNavigate()
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
          <Icon icon="solar:letter-bold" className="text-secondary text-3xl" />
        </div>
        <h2 className="font-heading text-xl font-extrabold text-foreground">Check your email</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          If an account exists for {email}, we've sent a link to reset your password.
        </p>
        <button type="button" onClick={() => navigate('/login')} className="text-sm font-bold text-secondary mt-2">
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground text-sm mt-2">Enter your email and we'll send you a link to reset it.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@munciemaids.com"
            autoComplete="email"
            error={error ?? undefined}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-full shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <button type="button" onClick={() => navigate('/login')} className="font-bold text-secondary">
            Back to Sign In
          </button>
        </p>
      </div>
    </div>
  )
}
