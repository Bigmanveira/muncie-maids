import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { firstIncompleteRoute, useFunnel } from '../context/FunnelContext'
import { useAuth } from '../context/AuthContext'

/** Redirects to the earliest incomplete funnel step if this route's prerequisites are missing.
 * The guest checkout flow ends at payment — reaching /pay also requires an account, and an
 * unauthenticated visitor is sent to sign in/up first, resuming here afterward. */
export function FunnelGuard({
  requires,
  children,
}: {
  requires: 'schedule' | 'details' | 'photos' | 'pay'
  children: ReactNode
}) {
  const { state } = useFunnel()
  const { user } = useAuth()
  const location = useLocation()
  const incomplete = firstIncompleteRoute(state)

  const needsQuote = requires === 'schedule' || requires === 'details' || requires === 'photos' || requires === 'pay'
  const needsSchedule = requires === 'details' || requires === 'photos' || requires === 'pay'
  const needsDetails = requires === 'photos' || requires === 'pay'

  if (needsQuote && !state.quote && incomplete) return <Navigate to={incomplete} replace />
  if (needsSchedule && !state.schedule && incomplete) return <Navigate to={incomplete} replace />
  if (needsDetails && !state.details && incomplete) return <Navigate to={incomplete} replace />

  if (requires === 'pay' && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
