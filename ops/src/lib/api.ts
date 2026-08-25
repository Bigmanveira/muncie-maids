import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

async function invoke<T>(fn: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body: body ?? {} })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const parsed = await error.context.json().catch(() => null)
      throw new ApiError(parsed?.code ?? 'UNKNOWN', parsed?.message ?? error.message)
    }
    throw new ApiError('UNKNOWN', error.message)
  }
  return data as T
}

export interface OpsUser {
  id: string
  name: string
  email: string
  role: 'owner' | 'staff'
}

export interface NeedsOpsGig {
  id: string
  serviceDate: string
  timeWindow: string
  cleanType: string
  city: string
  customerName: string
  quotedPrice: number
  hasOffer: boolean
}

export interface StalePendingBooking {
  id: string
  serviceDate: string
  timeWindow: string
  customerName: string
  customerEmail: string
  quotedPrice: number
  createdAt: string
}

export interface RecentRelease {
  id: string
  bookingId: string
  cleanerName: string
  serviceDate: string | null
  customerName: string | null
  releasedAt: string
}

export interface DashboardData {
  needsOps: NeedsOpsGig[]
  stalePending: StalePendingBooking[]
  recentReleases: RecentRelease[]
}

export function getDashboard() {
  return invoke<DashboardData>('ops-dashboard')
}

export interface OpsBooking {
  id: string
  status: string
  serviceDate: string
  timeWindow: string
  cleanType: string
  city: string
  zip: string
  quotedPrice: number
  customerName: string
  customerEmail: string
  customerPhone: string
  cleanerName: string | null
  offeredCleanerName: string | null
  payoutAmount: number | null
  payoutPaidAt: string | null
  createdAt: string
}

export function listBookings(params: { status?: string; search?: string } = {}) {
  return invoke<{ bookings: OpsBooking[] }>('ops-list-bookings', params)
}

export function offerGig(bookingId: string, cleanerId: string) {
  return invoke<{ status: 'offered' }>('ops-offer-gig', { bookingId, cleanerId })
}

export interface RankedCleaner {
  cleanerId: string
  name: string
  total: number
  factors: {
    reliability: number
    proximity: number
    fairness: number
    experience: number
    transportation: number
    equipment: number
  }
}

/** Full allocation-engine ranking for a booking (transparency view). */
export function rankCleaners(bookingId: string) {
  return invoke<{ ranked: RankedCleaner[] }>('ops-rank-cleaners', { bookingId })
}

/** One-click: offer the gig to the engine's top-ranked eligible cleaner. */
export function autoOffer(bookingId: string) {
  return invoke<{ status: 'offered'; cleaner: { id: string; name: string; score: number } }>('ops-auto-offer', { bookingId })
}

export function cancelBooking(bookingId: string) {
  return invoke<{ status: 'cancelled'; refundAmount: number }>('ops-cancel-booking', { bookingId })
}

export interface CleanerReference {
  name: string
  relationship: string
  phone: string
}

export type BgCheckStatus = 'not_started' | 'pending' | 'clear' | 'consider' | 'failed'

export interface OpsCleaner {
  id: string
  name: string
  email: string
  phone: string
  towns: string[]
  services: string[]
  yearsExperience: number | null
  hasOwnEquipment: boolean
  status: 'applied' | 'active' | 'declined' | 'deactivated'
  agreementSignedAt: string | null
  reliabilityCompleted: number
  reliabilityReleased: number
  createdAt: string
  // Vetting (0009)
  legalName: string | null
  dateOfBirth: string | null
  addressLine1: string | null
  addressCity: string | null
  addressState: string | null
  addressZip: string | null
  hasTransportation: boolean
  hasDriversLicense: boolean
  workEligibleAttestedAt: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  referenceContacts: CleanerReference[]
  hasIdDocument: boolean
  hasProfilePhoto: boolean
  bgCheckConsentedAt: string | null
  bgCheckStatus: BgCheckStatus
  bgCheckProvider: string | null
  bgCheckReference: string | null
  bgCheckCompletedAt: string | null
  verificationSubmittedAt: string | null
}

export function listCleaners() {
  return invoke<{ cleaners: OpsCleaner[] }>('ops-list-cleaners')
}

export function reviewApplication(cleanerId: string, decision: 'approve' | 'decline') {
  return invoke<{ status: string }>('ops-review-application', { cleanerId, decision })
}

export function getCleanerDocs(cleanerId: string) {
  return invoke<{ idDocumentUrl: string | null; profilePhotoUrl: string | null }>('ops-get-cleaner-docs', { cleanerId })
}

export function recordBgCheck(cleanerId: string, status: Exclude<BgCheckStatus, 'not_started'>, provider?: string, reference?: string) {
  return invoke<{ status: BgCheckStatus }>('ops-record-bg-check', { cleanerId, status, provider, reference })
}

export function setCleanerActive(cleanerId: string, active: boolean) {
  return invoke<{ status: string }>('ops-set-cleaner-active', { cleanerId, active })
}

export interface Payout {
  id: string
  serviceDate: string
  cleanType: string
  cleanerId: string | null
  cleanerName: string
  payoutAmount: number
  payoutPaidAt: string | null
  completedAt: string | null
}

export function listPayouts() {
  return invoke<{ payouts: Payout[] }>('ops-list-payouts')
}

export function markPaid(bookingIds: string[]) {
  return invoke<{ paidCount: number }>('ops-mark-paid', { bookingIds })
}

export function addOpsUser(email: string) {
  return invoke<{ status: 'added' }>('ops-add-ops-user', { email })
}

export interface AuditEvent {
  id: string
  action: string
  actorType: 'client' | 'cleaner' | 'ops' | 'system'
  actorName: string | null
  bookingId: string | null
  bookingCustomer: string | null
  bookingDate: string | null
  bookingCity: string | null
  createdAt: string
}

export function listEvents(before?: string) {
  return invoke<{ events: AuditEvent[]; hasMore: boolean }>('ops-list-events', before ? { before } : {})
}

export interface WeeklyRevenuePoint {
  weekStart: string
  revenue: number
  count: number
}

export interface StatusCounts {
  completed: number
  active: number
  needs_ops: number
  pending_payment: number
  cancelled: number
}

export interface LeaderboardEntry {
  cleanerId: string
  cleanerName: string
  completedCount: number
  payout: number
}

export interface AnalyticsData {
  weeklyRevenue: WeeklyRevenuePoint[]
  statusCounts: StatusCounts
  leaderboard: LeaderboardEntry[]
  summary: {
    monthRevenue: number
    monthBookingCount: number
    monthCompletedCount: number
    completionRate: number
  }
}

export function getAnalytics() {
  return invoke<AnalyticsData>('ops-analytics')
}

export interface BookingPhoto {
  id: string
  uploadedBy: 'client' | 'cleaner'
  url: string
  createdAt: string
}

export function getBookingPhotos(bookingId: string) {
  return invoke<{ photos: BookingPhoto[] }>('ops-get-booking-photos', { bookingId })
}
