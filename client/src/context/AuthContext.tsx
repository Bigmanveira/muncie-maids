import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Bathrooms, Bedrooms, Frequency, SqftBand } from '../types'

export interface HomeProfile {
  avatarDataUrl: string | null
  bedrooms: Bedrooms | null
  bathrooms: Bathrooms | null
  sqftBand: SqftBand | null
  addressLine: string | null
  city: string | null
  zip: string | null
  entryNotes: string | null
  hasPets: boolean | null
  preferredFrequency: Frequency | null
  /** Wizard was finished (any mix of filled/skipped steps) at least once. */
  onboardingCompleted: boolean
  /** User explicitly bailed out of onboarding — don't force it on them again. */
  onboardingSkipped: boolean
}

export const DEFAULT_HOME_PROFILE: HomeProfile = {
  avatarDataUrl: null,
  bedrooms: null,
  bathrooms: null,
  sqftBand: null,
  addressLine: null,
  city: null,
  zip: null,
  entryNotes: null,
  hasPets: null,
  preferredFrequency: null,
  onboardingCompleted: false,
  onboardingSkipped: false,
}

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string
  homeProfile: HomeProfile
}

export interface SignupInput {
  name: string
  email: string
  phone: string
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

interface AuthContextValue {
  user: AuthUser | null
  /** True only while the initial session check is in flight (Supabase mode). */
  loading: boolean
  /** `confirmEmail: true` means a confirmation email was sent and there's no session yet. */
  signup: (input: SignupInput) => Promise<{ confirmEmail: boolean }>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  resendConfirmation: (email: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  /** Only valid once a recovery-link session is active (see ResetPassword screen). */
  confirmPasswordReset: (newPassword: string) => Promise<void>
  updateProfile: (input: { name: string; phone: string }) => Promise<void>
  updateHomeProfile: (input: Partial<HomeProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  return isSupabaseConfigured ? (
    <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
  ) : (
    <MockAuthProvider>{children}</MockAuthProvider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Real Supabase Auth ----------------------------------------------------

interface ProfileRow {
  id: string
  name: string
  phone: string
  avatar_url: string | null
  bedrooms: string | null
  bathrooms: string | null
  sqft_band: string | null
  address_line: string | null
  city: string | null
  zip: string | null
  entry_notes: string | null
  has_pets: boolean | null
  preferred_frequency: string | null
  onboarding_completed: boolean
  onboarding_skipped: boolean
}

function profileRowToHomeProfile(row: ProfileRow | null): HomeProfile {
  if (!row) return DEFAULT_HOME_PROFILE
  return {
    avatarDataUrl: row.avatar_url,
    bedrooms: row.bedrooms as Bedrooms | null,
    bathrooms: row.bathrooms as Bathrooms | null,
    sqftBand: row.sqft_band as SqftBand | null,
    addressLine: row.address_line,
    city: row.city,
    zip: row.zip,
    entryNotes: row.entry_notes,
    hasPets: row.has_pets,
    preferredFrequency: row.preferred_frequency as Frequency | null,
    onboardingCompleted: row.onboarding_completed,
    onboardingSkipped: row.onboarding_skipped,
  }
}

async function loadAuthUser(supabaseUser: User): Promise<AuthUser> {
  const { data } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).single()
  const row = data as ProfileRow | null
  return {
    id: supabaseUser.id,
    name: row?.name ?? (supabaseUser.user_metadata?.name as string | undefined) ?? '',
    email: supabaseUser.email ?? '',
    phone: row?.phone ?? (supabaseUser.user_metadata?.phone as string | undefined) ?? '',
    homeProfile: profileRowToHomeProfile(row),
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

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      setUser(session?.user ? await loadAuthUser(session.user) : null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return
      setUser(session?.user ? await loadAuthUser(session.user) : null)
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
        data: { name: input.name, phone: input.phone },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw translateAuthError(error.message)
    return { confirmEmail: !data.session }
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw translateAuthError(error.message)
    if (data.user) setUser(await loadAuthUser(data.user))
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

  async function updateProfile(input: { name: string; phone: string }) {
    if (!user) throw new AuthError('UNKNOWN', 'You must be signed in to update your profile.')
    const { error } = await supabase.from('profiles').update({ name: input.name, phone: input.phone }).eq('id', user.id)
    if (error) throw new AuthError('UNKNOWN', error.message)
    setUser({ ...user, name: input.name, phone: input.phone })
  }

  async function updateHomeProfile(input: Partial<HomeProfile>) {
    if (!user) throw new AuthError('UNKNOWN', 'You must be signed in to update your home details.')
    const next: HomeProfile = { ...user.homeProfile, ...input }
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: next.avatarDataUrl,
        bedrooms: next.bedrooms,
        bathrooms: next.bathrooms,
        sqft_band: next.sqftBand,
        address_line: next.addressLine,
        city: next.city,
        zip: next.zip,
        entry_notes: next.entryNotes,
        has_pets: next.hasPets,
        preferred_frequency: next.preferredFrequency,
        onboarding_completed: next.onboardingCompleted,
        onboarding_skipped: next.onboardingSkipped,
      })
      .eq('id', user.id)
    if (error) throw new AuthError('UNKNOWN', error.message)
    setUser({ ...user, homeProfile: next })
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
        user,
        loading,
        signup,
        login,
        logout,
        resendConfirmation,
        requestPasswordReset,
        confirmPasswordReset,
        updateProfile,
        updateHomeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Mock auth — local-only, no backend --------------------------------------
// Used only when VITE_SUPABASE_URL/ANON_KEY aren't set, so the app stays
// fully clickable without a Supabase project (see README).

interface StoredAccount extends AuthUser {
  password: string
}

const ACCOUNTS_KEY = 'muncie-maids-mock-accounts'
const SESSION_KEY = 'muncie-maids-mock-session'

function loadAccounts(): StoredAccount[] {
  try {
    const raw: StoredAccount[] = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]')
    return raw.map((a) => ({ ...a, homeProfile: a.homeProfile ?? DEFAULT_HOME_PROFILE }))
  } catch {
    return []
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as AuthUser
    return { ...user, homeProfile: user.homeProfile ?? DEFAULT_HOME_PROFILE }
  } catch {
    return null
  }
}

function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadSession)

  async function signup(input: SignupInput) {
    const accounts = loadAccounts()
    if (accounts.some((a) => a.email.toLowerCase() === input.email.toLowerCase())) {
      throw new AuthError('EMAIL_TAKEN', 'An account with that email already exists. Try signing in instead.')
    }
    const account: StoredAccount = { id: crypto.randomUUID(), ...input, homeProfile: DEFAULT_HOME_PROFILE }
    saveAccounts([...accounts, account])
    const nextUser: AuthUser = { id: account.id, name: input.name, email: input.email, phone: input.phone, homeProfile: DEFAULT_HOME_PROFILE }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return { confirmEmail: false }
  }

  async function login(email: string, password: string) {
    const accounts = loadAccounts()
    const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password)
    if (!account) {
      throw new AuthError('INVALID_CREDENTIALS', 'We could not find an account with that email and password.')
    }
    const nextUser: AuthUser = { id: account.id, name: account.name, email: account.email, phone: account.phone, homeProfile: account.homeProfile }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  async function resendConfirmation() {
    // No-op — mock accounts never require confirmation.
  }

  async function requestPasswordReset() {
    // No-op — nothing to email in demo mode.
  }

  async function confirmPasswordReset() {
    throw new AuthError('UNKNOWN', 'Password reset is not available in demo mode.')
  }

  async function updateProfile(input: { name: string; phone: string }) {
    if (!user) throw new AuthError('UNKNOWN', 'You must be signed in to update your profile.')
    const nextUser: AuthUser = { ...user, name: input.name, phone: input.phone }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)

    const accounts = loadAccounts()
    saveAccounts(accounts.map((a) => (a.id === user.id ? { ...a, name: input.name, phone: input.phone } : a)))
  }

  async function updateHomeProfile(input: Partial<HomeProfile>) {
    if (!user) throw new AuthError('UNKNOWN', 'You must be signed in to update your home details.')
    const nextHomeProfile: HomeProfile = { ...user.homeProfile, ...input }
    const nextUser: AuthUser = { ...user, homeProfile: nextHomeProfile }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)

    const accounts = loadAccounts()
    saveAccounts(accounts.map((a) => (a.id === user.id ? { ...a, homeProfile: nextHomeProfile } : a)))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        signup,
        login,
        logout,
        resendConfirmation,
        requestPasswordReset,
        confirmPasswordReset,
        updateProfile,
        updateHomeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
