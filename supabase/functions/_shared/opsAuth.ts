import { getSupabaseAdmin } from './supabaseAdmin.ts'

export interface AuthedOps {
  id: string
  name: string
  email: string
  role: string
}

/**
 * Resolves the calling ops user from the request's bearer JWT. Returns null
 * if the caller isn't signed in, or is signed in but was never granted
 * ops_users access (see the handle_new_user bootstrap in migration 0005).
 */
export async function getAuthedOps(req: Request): Promise<AuthedOps | null> {
  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!jwt) return null

  const admin = getSupabaseAdmin()
  const {
    data: { user },
  } = await admin.auth.getUser(jwt)
  if (!user) return null

  const { data: opsUser } = await admin.from('ops_users').select('id, name, email, role').eq('id', user.id).single()

  return (opsUser as AuthedOps) ?? null
}
