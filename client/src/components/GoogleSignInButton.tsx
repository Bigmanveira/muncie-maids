import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/AuthContext'

/** "Continue with Google" plus an "or" divider above the email form.
 * Google never shares a phone number, so new Google users finish with the
 * CompleteProfileModal after they land back in the app. */
export function GoogleSignInButton({ returnTo, onError }: { returnTo?: string; onError: (message: string) => void }) {
  const { loginWithGoogle } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  async function handleClick() {
    setRedirecting(true)
    try {
      await loginWithGoogle(returnTo)
    } catch (err) {
      setRedirecting(false)
      onError(err instanceof Error ? err.message : 'Could not start Google sign-in.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={redirecting}
        className="w-full bg-card border border-border font-bold text-foreground py-4 rounded-full shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
      >
        <Icon icon="logos:google-icon" className="text-lg" />
        {redirecting ? 'Opening Google…' : 'Continue with Google'}
      </button>
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </>
  )
}
