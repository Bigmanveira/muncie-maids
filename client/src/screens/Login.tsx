import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { SimpleHeader } from '../components/SimpleHeader'
import { TextField } from '../components/TextField'
import { AuthError, useAuth } from '../context/AuthContext'
import { isValidEmail } from '../lib/validation'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const { login, resendConfirmation } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email) || !password) {
      setError('Enter a valid email and your password.')
      return
    }
    setSubmitting(true)
    setError(null)
    setUnconfirmed(false)
    try {
      await login(email, password)
      navigate(from ?? '/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
      setUnconfirmed(err instanceof AuthError && err.code === 'EMAIL_NOT_CONFIRMED')
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

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SimpleHeader title="Sign In" />

      <form onSubmit={handleSubmit} className="px-6 flex-1 flex flex-col max-w-md mx-auto w-full">
        <div className="mb-8 mt-4">
          <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground text-sm">Sign in to see your bookings and manage your account.</p>
        </div>

        <div className="space-y-6">
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            autoComplete="email"
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm font-bold text-secondary -mt-2"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">{error}</p>
              {unconfirmed && (
                <button type="button" onClick={handleResend} className="text-sm font-bold text-secondary mt-2">
                  {resent ? 'Email resent' : 'Resend confirmation email'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1" />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-8"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-muted-foreground my-8">
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('/signup', { state: location.state })} className="font-bold text-secondary">
            Sign up
          </button>
        </p>
      </form>
    </div>
  )
}
