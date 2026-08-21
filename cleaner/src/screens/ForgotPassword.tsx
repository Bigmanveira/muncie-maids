import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { SimpleHeader } from '../components/SimpleHeader'
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

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SimpleHeader title="Reset Password" fallback="/login" />

      <div className="px-6 flex-1 flex flex-col max-w-md mx-auto w-full">
        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-12">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <Icon icon="solar:letter-bold" className="text-secondary text-3xl" />
            </div>
            <h2 className="font-heading text-xl font-extrabold text-foreground">Check your email</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              If an account exists for {email}, we've sent a link to reset your password.
            </p>
            <button type="button" onClick={() => navigate('/login')} className="text-sm font-bold text-secondary mt-4">
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="mb-8 mt-4">
              <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Forgot your password?</h2>
              <p className="text-muted-foreground text-sm">Enter your email and we'll send you a link to reset it.</p>
            </div>

            <TextField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              error={error ?? undefined}
            />

            <div className="flex-1" />

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-8 mb-8"
            >
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
