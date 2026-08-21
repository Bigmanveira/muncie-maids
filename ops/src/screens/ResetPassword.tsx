import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { TextField } from '../components/TextField'
import { useAuth } from '../context/AuthContext'

export function ResetPassword() {
  const navigate = useNavigate()
  const { status, confirmPasswordReset } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (status === 'signed-out') {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <Icon icon="solar:danger-bold" className="text-destructive text-3xl" />
        <h2 className="font-heading text-xl font-extrabold text-foreground">Link expired</h2>
        <p className="text-muted-foreground text-sm max-w-xs">This password reset link is invalid or has expired. Request a new one.</p>
        <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm font-bold text-secondary mt-2">
          Back to Reset Password
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-chart-3/10 flex items-center justify-center">
          <Icon icon="solar:check-circle-bold" className="text-chart-3 text-3xl" />
        </div>
        <h2 className="font-heading text-xl font-extrabold text-foreground">Password updated</h2>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="bg-primary text-white font-bold px-6 py-3 rounded-full shadow-sm active:scale-[0.98] transition-all mt-2"
        >
          Continue
        </button>
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
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Choose a new password</h1>
          <p className="text-muted-foreground text-sm mt-2">Make it at least 8 characters.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
          <TextField id="password" label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <TextField id="confirm" label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />

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
            {submitting ? 'Saving…' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
