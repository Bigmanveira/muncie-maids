import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { SimpleHeader } from '../components/SimpleHeader'
import { TextField } from '../components/TextField'
import { useAuth } from '../context/AuthContext'

/** Landed on from the password-reset email link, which establishes a recovery session. */
export function ResetPassword() {
  const navigate = useNavigate()
  const { user, confirmPasswordReset } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!user) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <SimpleHeader title="Reset Password" />
        <div className="px-6 flex-1 flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto w-full py-12">
          <Icon icon="solar:danger-bold" className="text-destructive text-3xl" />
          <h2 className="font-heading text-xl font-extrabold text-foreground">Link expired</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            This password reset link is invalid or has expired. Request a new one.
          </p>
          <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm font-bold text-secondary mt-2">
            Back to Reset Password
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <SimpleHeader title="Reset Password" />
        <div className="px-6 flex-1 flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto w-full py-12">
          <div className="w-16 h-16 rounded-full bg-chart-3/10 flex items-center justify-center">
            <Icon icon="solar:check-circle-bold" className="text-chart-3 text-3xl" />
          </div>
          <h2 className="font-heading text-xl font-extrabold text-foreground">Password updated</h2>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="bg-primary text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mt-2"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setSubmitting(true)
    setError(null)
    try {
      await confirmPasswordReset(password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SimpleHeader title="Reset Password" />

      <form onSubmit={handleSubmit} className="px-6 flex-1 flex flex-col max-w-md mx-auto w-full">
        <div className="mb-8 mt-4">
          <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">Choose a new password</h2>
          <p className="text-muted-foreground text-sm">Make it at least 8 characters.</p>
        </div>

        <div className="space-y-6">
          <TextField
            id="password"
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <TextField
            id="confirm"
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{error}</p>
          </div>
        )}

        <div className="flex-1" />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-8 mb-8"
        >
          {submitting ? 'Saving…' : 'Save New Password'}
        </button>
      </form>
    </div>
  )
}
