import { useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { Navigate } from 'react-router-dom'
import { SimpleHeader } from '../components/SimpleHeader'
import { TextField } from '../components/TextField'
import { useAuth } from '../context/AuthContext'
import { isValidPhone } from '../lib/validation'

export function EditProfile() {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!user) {
    return <Navigate to="/profile" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name.')
    if (!isValidPhone(phone)) return setError('Enter a valid 10-digit phone number.')

    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateProfile({ name: name.trim(), phone })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SimpleHeader title="Edit Profile" fallback="/profile" />

      <form onSubmit={handleSubmit} className="px-6 flex-1 flex flex-col max-w-md mx-auto w-full pb-8">
        <div className="space-y-6 mt-4">
          <TextField id="name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField id="email" label="Email" value={user.email} disabled className="opacity-60" />
          <TextField id="phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{error}</p>
          </div>
        )}

        {saved && (
          <div className="mt-6 rounded-2xl bg-chart-3/10 border border-chart-3/20 p-4 flex items-start gap-3">
            <Icon icon="solar:check-circle-bold" className="text-chart-3 text-xl shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">Your changes have been saved.</p>
          </div>
        )}

        <div className="flex-1" />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-8"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
