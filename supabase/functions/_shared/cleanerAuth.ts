import { getSupabaseAdmin } from './supabaseAdmin.ts'

export interface AuthedCleaner {
  id: string
  status: string
  agreement_signed_at: string | null
  towns: string[]
}

/**
 * Resolves the calling cleaner from the request's bearer JWT. Uses the
 * service-role client's `getUser(jwt)` to verify the token directly rather
 * than round-tripping through the anon key, so this doesn't depend on
 * SUPABASE_ANON_KEY being present in the function's env.
 */
export async function getAuthedCleaner(req: Request): Promise<AuthedCleaner | null> {
  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!jwt) return null

  const admin = getSupabaseAdmin()
  const {
    data: { user },
  } = await admin.auth.getUser(jwt)
  if (!user) return null

  const { data: cleaner } = await admin
    .from('cleaners')
    .select('id, status, agreement_signed_at, towns')
    .eq('id', user.id)
    .single()

  return (cleaner as AuthedCleaner) ?? null
}

/** Active status + agreement signed unlocks the gig feed. */
export function isFeedUnlocked(cleaner: AuthedCleaner): boolean {
  return cleaner.status === 'active' && cleaner.agreement_signed_at != null
}
