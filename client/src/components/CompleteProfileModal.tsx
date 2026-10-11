import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { TextField } from './TextField'
import { useAuth } from '../context/AuthContext'
import { isValidPhone } from '../lib/validation'

/** Collects what Google sign-in doesn't give us. Shown to any signed-in
 * client without a valid phone number — every new Google account, plus
 * anyone whose account came over from another app without one. The phone
 * is required (it's how the cleaning team and support reach the client on
 * visit day), so there is no close button: the only way out is saving or
 * signing out. */
export function CompleteProfileModal() {
  const { user, updateProfile, logout } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsProfile = Boolean(user) && !isValidPhone(user?.phone ?? '')

  useEffect(() => {
    if (needsProfile && user) {
      setName(user.name)
      setPhone('')
    }
    // Prefill once per user, not on every keystroke-driven re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsProfile, user?.id])

  if (!needsProfile || !user) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your full name.')
    if (!isValidPhone(phone)) return setError('Enter a valid 10-digit phone number.')
    setSaving(true)
    setError(null)
    try {
      await updateProfile({ name: name.trim(), phone })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="complete-profile-title">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-background rounded-t-[32px] sm:rounded-[32px] px-6 pt-8 pb-8 shadow-2xl"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Icon icon="solar:user-id-bold" className="text-primary text-2xl" />
        </div>
        <h2 id="complete-profile-title" className="font-heading text-2xl font-extrabold text-foreground mb-2">
          Finish setting up your account
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Add your phone number so your cleaning team can reach you on the day of your visit.
        </p>

        <div className="space-y-5">
          <TextField id="cp-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" />
          <TextField id="cp-phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(765) 555-0100" autoComplete="tel" />
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-white font-bold py-4 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
        >
          {saving ? 'Saving…' : 'Save and Continue'}
        </button>
        <button type="button" onClick={logout} className="w-full text-sm font-bold text-muted-foreground mt-4">
          Sign out instead
        </button>
      </form>
    </div>
  )
}
