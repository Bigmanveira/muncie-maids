import { jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { signBookingId } from '../_shared/token.ts'
import { siteUrl } from '../_shared/email.ts'
import { CLEAN_TYPE_LABEL, formatDate, visitReminderEmail, type EmailBooking } from '../_shared/emailTemplates.ts'
import { notifyOps, sendAndLog } from '../_shared/notify.ts'
import { timeWindowStartHour } from '../_shared/timeWindows.ts'

// Time-based emails, run every 15 minutes by pg_cron (migration 0012):
//   1. Client reminder the day before a visit (sent 20–26h before start).
//   2. Ops alert when a gig escalates to needs_ops (no cleaner claimed it).
//   3. Ops alert when a cleaner finishes the application and needs review.
//
// Deliberately callable without auth (verify_jwt = false): every job is
// idempotent — each row is claimed with a guarded "is null" update before
// its email is sent — so an outside caller can only trigger the same sends
// the schedule would, never duplicates.

const TZ = 'America/Indiana/Indianapolis'
const REMINDER_MIN_HOURS = 20
const REMINDER_MAX_HOURS = 26

/** Converts a wall-clock time in Muncie to a UTC timestamp (DST-aware). */
function visitStartUtc(serviceDate: string, timeWindow: string): number {
  const [y, m, d] = serviceDate.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d, timeWindowStartHour(timeWindow))
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
      .formatToParts(new Date(guess))
      .map((p) => [p.type, p.value]),
  )
  const asLocal = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute)
  return guess - (asLocal - guess)
}

const BOOKING_FIELDS =
  'id, customer_name, customer_email, clean_type, service_date, time_window, address_line, city, zip, quoted_price'

Deno.serve(async () => {
  const supabase = getSupabaseAdmin()
  const now = Date.now()
  const result = { reminders: 0, needsOpsAlerts: 0, applicationAlerts: 0 }

  // 1. Day-before reminders. Only dates near "tomorrow" can qualify, so the
  // candidate query stays tiny; the exact 20–26h window is checked in code.
  const today = new Date(now).toISOString().slice(0, 10)
  const inThreeDays = new Date(now + 3 * 86_400_000).toISOString().slice(0, 10)
  const { data: upcoming } = await supabase
    .from('bookings')
    .select(BOOKING_FIELDS)
    .in('status', ['open', 'claimed', 'needs_ops'])
    .is('reminder_sent_at', null)
    .gte('service_date', today)
    .lte('service_date', inThreeDays)

  for (const b of upcoming ?? []) {
    const hoursUntil = (visitStartUtc(b.service_date, b.time_window) - now) / 3_600_000
    if (hoursUntil < REMINDER_MIN_HOURS || hoursUntil > REMINDER_MAX_HOURS) continue

    const { data: claimed } = await supabase
      .from('bookings')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', b.id)
      .is('reminder_sent_at', null)
      .select('id')
      .maybeSingle()
    if (!claimed) continue

    const manageUrl = `${siteUrl()}/booking/${b.id}?token=${await signBookingId(b.id)}`
    const sent = await sendAndLog(supabase, visitReminderEmail(b as EmailBooking, manageUrl), {
      bookingId: b.id,
      action: 'reminder_email_sent',
    })
    if (sent) result.reminders++
    else await supabase.from('bookings').update({ reminder_sent_at: null }).eq('id', b.id) // retry next run
  }

  // 2. Gigs nobody claimed in time.
  const { data: stuck } = await supabase
    .from('bookings')
    .select('id, customer_name, clean_type, service_date, time_window, city')
    .eq('status', 'needs_ops')
    .is('needs_ops_alerted_at', null)

  for (const g of stuck ?? []) {
    const { data: claimed } = await supabase
      .from('bookings')
      .update({ needs_ops_alerted_at: new Date().toISOString() })
      .eq('id', g.id)
      .is('needs_ops_alerted_at', null)
      .select('id')
      .maybeSingle()
    if (!claimed) continue

    const sent = await notifyOps(
      supabase,
      {
        subject: `No cleaner yet: ${g.city} job on ${formatDate(g.service_date)}`,
        heading: 'A job needs a cleaner',
        intro: 'No cleaner claimed this job, and the visit is less than 36 hours away. Offer it to a cleaner from the dashboard.',
        rows: [
          ['Client', g.customer_name],
          ['Job', CLEAN_TYPE_LABEL[g.clean_type] ?? g.clean_type],
          ['When', `${formatDate(g.service_date)}, ${g.time_window}`],
          ['Town', g.city],
        ],
        path: '/',
      },
      { bookingId: g.id, action: 'needs_ops_alert_sent' },
    )
    if (sent) result.needsOpsAlerts++
    else await supabase.from('bookings').update({ needs_ops_alerted_at: null }).eq('id', g.id)
  }

  // 3. Applications that are complete and waiting on ops review.
  const { data: ready } = await supabase
    .from('cleaners')
    .select('id, name, towns, years_experience')
    .eq('status', 'applied')
    .not('verification_submitted_at', 'is', null)
    .not('agreement_signed_at', 'is', null)
    .is('application_alerted_at', null)

  for (const c of ready ?? []) {
    const { data: claimed } = await supabase
      .from('cleaners')
      .update({ application_alerted_at: new Date().toISOString() })
      .eq('id', c.id)
      .is('application_alerted_at', null)
      .select('id')
      .maybeSingle()
    if (!claimed) continue

    const sent = await notifyOps(
      supabase,
      {
        subject: `New cleaner application: ${c.name}`,
        heading: 'A cleaner application is ready for review',
        intro: `${c.name} finished their application, identity verification, and agreement. Review their documents and record the background check result.`,
        rows: [
          ['Applicant', c.name],
          ['Towns', (c.towns as string[]).join(', ') || '—'],
          ['Experience', `${c.years_experience ?? 0} years`],
        ],
        path: '/cleaners',
      },
      { actorId: c.id, action: 'application_alert_sent' },
    )
    if (sent) result.applicationAlerts++
    else await supabase.from('cleaners').update({ application_alerted_at: null }).eq('id', c.id)
  }

  return jsonResponse(result)
})
