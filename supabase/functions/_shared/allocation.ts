// Auto-allocation engine — scores every eligible cleaner for a booking and
// auto-OFFERS the job to the best match. Never a unilateral assignment: the
// cleaner accepts or declines, exactly like a manual ops offer (product plan
// §8 — IC classification requires offers, not pushes). On decline or expiry
// the next-best cleaner is offered; if nobody is left the gig simply stays
// in the open feed where every eligible cleaner can claim it.
//
// Deliberately NOT a factor: offer acceptance/decline history. Punishing
// cleaners for not taking gigs looks like employer control (§8).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export interface AllocBooking {
  id: string
  status: string
  city: string
  zip: string
  service_date: string
  clean_type: string
  offered_cleaner_id: string | null
}

export interface FactorBreakdown {
  reliability: number
  proximity: number
  fairness: number
  experience: number
  transportation: number
  equipment: number
}

export interface ScoredCleaner {
  cleanerId: string
  name: string
  total: number
  factors: FactorBreakdown
}

const BOOKING_FIELDS = 'id, status, city, zip, service_date, clean_type, offered_cleaner_id'

/**
 * Ranks all eligible cleaners for a booking, best first.
 *
 * Hard filters (a cleaner must pass ALL to be considered):
 *   - active + agreement signed (i.e. fully vetted and approved)
 *   - serves the booking's town
 *   - offers the booking's clean type
 *   - no claimed/completed job on the same date
 *   - has not already declined (or let expire) an offer for THIS booking
 *
 * Soft factors (weights sum to 100):
 *   reliability 30 — completed vs released, Laplace-smoothed so new cleaners
 *                    start neutral instead of at zero
 *   proximity   20 — home city match, then ZIP-prefix match
 *   fairness    20 — fewer upcoming claimed jobs ranks higher, spreading work
 *                    and giving new cleaners a real shot
 *   experience  15 — years cleaning + completed jobs on the platform
 *   transport   10 — reliable transportation on file
 *   equipment    5 — brings own equipment & supplies
 */
export async function rankCleanersForBooking(
  supabase: SupabaseClient,
  booking: AllocBooking,
): Promise<ScoredCleaner[]> {
  const [{ data: cleaners }, { data: sameDay }, { data: upcoming }, { data: priorOffers }] = await Promise.all([
    supabase
      .from('cleaners')
      .select(
        'id, name, status, agreement_signed_at, towns, services, years_experience, has_own_equipment, reliability_completed, reliability_released, address_city, address_zip, has_transportation',
      )
      .eq('status', 'active'),
    supabase
      .from('bookings')
      .select('cleaner_id')
      .eq('service_date', booking.service_date)
      .in('status', ['claimed', 'completed'])
      .not('cleaner_id', 'is', null),
    supabase
      .from('bookings')
      .select('cleaner_id')
      .eq('status', 'claimed')
      .gte('service_date', new Date().toISOString().slice(0, 10))
      .not('cleaner_id', 'is', null),
    supabase
      .from('events')
      .select('actor_id')
      .eq('booking_id', booking.id)
      .in('action', ['offer_declined', 'offer_expired']),
  ])

  const busySameDay = new Set((sameDay ?? []).map((b) => b.cleaner_id as string))
  const alreadyOffered = new Set((priorOffers ?? []).map((e) => e.actor_id as string).filter(Boolean))
  const upcomingLoad = new Map<string, number>()
  for (const b of upcoming ?? []) {
    const id = b.cleaner_id as string
    upcomingLoad.set(id, (upcomingLoad.get(id) ?? 0) + 1)
  }

  const zipPrefix = (booking.zip ?? '').slice(0, 3)
  const scored: ScoredCleaner[] = []

  for (const c of cleaners ?? []) {
    // Hard filters
    if (!c.agreement_signed_at) continue
    if (!(c.towns as string[]).includes(booking.city)) continue
    if (!(c.services as string[]).includes(booking.clean_type)) continue
    if (busySameDay.has(c.id)) continue
    if (alreadyOffered.has(c.id)) continue

    // Soft factors
    const completed = c.reliability_completed ?? 0
    const released = c.reliability_released ?? 0
    const reliability = Math.round(((completed + 1) / (completed + released + 2)) * 30)

    let proximity = 0
    if (c.address_city && c.address_city.toLowerCase() === booking.city.toLowerCase()) proximity = 20
    else if (c.address_zip && zipPrefix && (c.address_zip as string).startsWith(zipPrefix)) proximity = 12

    const load = upcomingLoad.get(c.id) ?? 0
    const fairness = load === 0 ? 20 : load === 1 ? 12 : load === 2 ? 6 : 0

    const years = Math.min(c.years_experience ?? 0, 10)
    const experience = Math.round((years / 10) * 8 + (Math.min(completed, 20) / 20) * 7)

    const transportation = c.has_transportation ? 10 : 0
    const equipment = c.has_own_equipment ? 5 : 0

    scored.push({
      cleanerId: c.id,
      name: c.name,
      total: reliability + proximity + fairness + experience + transportation + equipment,
      factors: { reliability, proximity, fairness, experience, transportation, equipment },
    })
  }

  scored.sort((a, b) => b.total - a.total)
  return scored
}

export async function loadAllocBooking(supabase: SupabaseClient, bookingId: string): Promise<AllocBooking | null> {
  const { data } = await supabase.from('bookings').select(BOOKING_FIELDS).eq('id', bookingId).single()
  return (data as AllocBooking) ?? null
}

/**
 * Offers the booking to the highest-scoring eligible cleaner. No-op (returns
 * null) when the booking isn't offerable, already carries an offer, or nobody
 * is eligible — in that last case the gig stays in the open feed, which every
 * eligible cleaner can claim from. Best-effort by design: callers treat a
 * null as "fine, the marketplace handles it".
 */
export async function autoOfferBest(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<ScoredCleaner | null> {
  const booking = await loadAllocBooking(supabase, bookingId)
  if (!booking) return null
  if (!['open', 'needs_ops'].includes(booking.status)) return null
  if (booking.offered_cleaner_id) return null

  const ranked = await rankCleanersForBooking(supabase, booking)
  const best = ranked[0]
  if (!best) return null

  // Guarded update: only place the offer if nobody else has in the meantime.
  const { data: updated } = await supabase
    .from('bookings')
    .update({ offered_cleaner_id: best.cleanerId, offered_at: new Date().toISOString() })
    .eq('id', booking.id)
    .is('offered_cleaner_id', null)
    .select('id')
    .single()
  if (!updated) return null

  await supabase.from('events').insert({
    booking_id: booking.id,
    actor_type: 'system',
    actor_id: null,
    action: 'auto_offered',
  })

  return best
}
