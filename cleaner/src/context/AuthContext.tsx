import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type CleanerStatus = 'applied' | 'active' | 'declined' | 'deactivated'

export interface Cleaner {
  id: string
  name: string
  email: string
  phone: string
  towns: string[]
  services: string[]
  yearsExperience: number | null
  hasOwnEquipment: boolean
  status: CleanerStatus
  agreementSignedAt: string | null
  reliabilityCompleted: number
  reliabilityReleased: number
}

export interface SignupInput {
  name: string
  email: string
  phone: string
  password: string
}

export interface ApplicationInput {
  towns: string[]
  services: string[]
  yearsExperience: number
  hasOwnEquipment: boolean
}

export type AuthErrorCode = 'EMAIL_TAKEN' | 'EMAIL_NOT_CONFIRMED' | 'INVALID_CREDENTIALS' | 'UNKNOWN'

export class AuthError extends Error {
  code: AuthErrorCode
  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

interface AuthContextValue {
  cleaner: Cleaner | null
  loading: boolean
  signup: (input: SignupInput) => Promise<{ confirmEmail: boolean }>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  resendConfirmation: (email: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (newPassword: string) => Promise<void>
  submitApplication: (input: ApplicationInput) => Promise<void>
  signAgreement: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

interface CleanerRow {
  id: string
  name: string
  email: string
  phone: string
  towns: string[]
  services: string[]
  years_experience: number | null
  has_own_equipment: boolean
  status: CleanerStatus
  agreement_signed_at: string | null
  reliability_completed: number
  reliability_released: number
}

function rowToCleaner(row: CleanerRow): Cleaner {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    towns: row.towns ?? [],
    services: row.services ?? [],
    yearsExperience: row.years_experience,
    hasOwnEquipment: row.has_own_equipment,
    status: row.status,
    agreementSignedAt: row.agreement_signed_at,
    reliabilityCompleted: row.reliability_completed,
    reliabilityReleased: row.reliability_released,
  }
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

async function loadCleaner(supabaseUser: User): Promise<Cleaner | null> {
  const { data } = await supabase.from('cleaners').select('*').eq('id', supabaseUser.id).single()
  return data ? rowToCleaner(data as CleanerRow) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cleaner, setCleaner] = useState<Cleaner | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      setCleaner(session?.user ? await loadCleaner(session.user) : null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return
      setCleaner(session?.user ? await loadCleaner(session.user) : null)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signup(input: SignupInput) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { role: 'cleaner', name: input.name, phone: input.phone },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw translateAuthError(error.message)
    return { confirmEmail: !data.session }
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw translateAuthError(error.message)
    if (data.user) setCleaner(await loadCleaner(data.user))
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

  async function submitApplication(input: ApplicationInput) {
    if (!cleaner) throw new AuthError('UNKNOWN', 'You must be signed in to apply.')
    const { error } = await supabase
      .from('cleaners')
      .update({
        towns: input.towns,
        services: input.services,
        years_experience: input.yearsExperience,
        has_own_equipment: input.hasOwnEquipment,
      })
      .eq('id', cleaner.id)
    if (error) throw new AuthError('UNKNOWN', error.message)
    setCleaner({
      ...cleaner,
      towns: input.towns,
      services: input.services,
      yearsExperience: input.yearsExperience,
      hasOwnEquipment: input.hasOwnEquipment,
    })
  }

  async function signAgreement() {
    if (!cleaner) throw new AuthError('UNKNOWN', 'You must be signed in to sign the agreement.')
    const now = new Date().toISOString()
    const { error } = await supabase.from('cleaners').update({ agreement_signed_at: now }).eq('id', cleaner.id)
    if (error) throw new AuthError('UNKNOWN', error.message)
    setCleaner({ ...cleaner, agreementSignedAt: now })
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        cleaner,
        loading,
        signup,
        login,
        logout,
        resendConfirmation,
        requestPasswordReset,
        confirmPasswordReset,
        submitApplication,
        signAgreement,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
