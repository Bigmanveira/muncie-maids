import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { OpsUser as ApiOpsUser } from '../lib/api'

export type OpsUser = ApiOpsUser

export interface SignupInput {
  name: string
  email: string
  password: string
}

export type AuthErrorCode = 'EMAIL_TAKEN' | 'EMAIL_NOT_CONFIRMED' | 'INVALID_CREDENTIALS' | 'UNKNOWN'

export class AuthError extends Error {
  code: AuthErrorCode
  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

type Status = 'loading' | 'signed-out' | 'unauthorized' | 'authorized'

interface AuthContextValue {
  status: Status
  opsUser: OpsUser | null
  signup: (input: SignupInput) => Promise<{ confirmEmail: boolean }>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  resendConfirmation: (email: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (newPassword: string) => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function translateAuthError(message: string): AuthError {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already exists')) {
    return new AuthError('EMAIL_TAKEN', 'An account with that email already exists. Try signing in instead.')
  }
  if (m.includes('email not confirmed')) {
    return new AuthError(
      'EMAIL_NOT_CONFIRMED',
      'Confirm your email before signing in — check your inbox for the link we sent.',
    )
  }
  if (m.includes('invalid login credentials')) {
    return new AuthError('INVALID_CREDENTIALS', 'We could not find an account with that email and password.')
  }
  return new AuthError('UNKNOWN', message)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [opsUser, setOpsUser] = useState<OpsUser | null>(null)

  async function checkAuthorization() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setStatus('signed-out')
      setOpsUser(null)
      return
    }
    const { data, error } = await supabase.functions.invoke('ops-me', { body: {} })
    if (error) {
      if (error instanceof FunctionsHttpError) {
        const parsed = await error.context.json().catch(() => null)
        if (parsed?.code === 'NOT_AUTHORIZED') {
          setStatus('unauthorized')
          setOpsUser(null)
          return
        }
      }
      setStatus('signed-out')
      setOpsUser(null)
      return
    }
    setOpsUser(data as OpsUser)
    setStatus('authorized')
  }

  useEffect(() => {
    let cancelled = false

    checkAuthorization().then(() => {
      if (cancelled) return
    })

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (cancelled) return
      checkAuthorization()
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signup(input: SignupInput) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { role: 'ops', name: input.name },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw translateAuthError(error.message)
    return { confirmEmail: !data.session }
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw translateAuthError(error.message)
    await checkAuthorization()
  }

  function logout() {
    void supabase.auth.signOut()
  }

  async function resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw translateAuthError(error.message)
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw translateAuthError(error.message)
  }

  async function confirmPasswordReset(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw translateAuthError(error.message)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        opsUser,
        signup,
        login,
        logout,
        resendConfirmation,
        requestPasswordReset,
        confirmPasswordReset,
        refresh: checkAuthorization,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
