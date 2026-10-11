// Notification helpers — one place that turns marketplace events into
// emails. Every helper is best-effort: it never throws, so a failed email
// can't fail the claim, offer, decision, or cron run that triggered it.
// Successful sends are written to `events` so they show in the audit log.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { sendEmail, type EmailMessage } from './email.ts'
import { applicationDecisionEmail, gigOfferEmail, opsAlertEmail } from './emailTemplates.ts'

async function logEvent(supabase: SupabaseClient, bookingId: string | null, actorId: string | null, action: string) {
  await supabase.from('events').insert({ booking_id: bookingId, actor_type: 'system', actor_id: actorId, action })
}

export async function sendAndLog(
  supabase: SupabaseClient,
  msg: EmailMessage,
  log: { bookingId?: string | null; actorId?: string | null; action: string },
): Promise<boolean> {
  try {
    const sent = await sendEmail(msg)
    if (sent) await logEvent(supabase, log.bookingId ?? null, log.actorId ?? null, log.action)
    return sent
  } catch (err) {
    console.error('notification failed', log.action, err)
    return false
  }
}

export async function opsRecipients(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from('ops_users').select('email')
  return (data ?? []).map((o) => o.email as string).filter(Boolean)
}

/** Emails a cleaner about a new gig offer (auto-offer or manual ops offer). */
export async function notifyGigOffer(supabase: SupabaseClient, bookingId: string, cleanerId: string): Promise<void> {
  try {
    const [{ data: cleaner }, { data: gig }] = await Promise.all([
      supabase.from('cleaners').select('id, name, email').eq('id', cleanerId).single(),
      supabase.from('bookings').select('clean_type, service_date, time_window, city, quoted_price').eq('id', bookingId).single(),
    ])
    if (!cleaner?.email || !gig) return
    await sendAndLog(supabase, gigOfferEmail(cleaner.email, cleaner.name, gig), {
      bookingId,
      actorId: cleanerId,
      action: 'offer_email_sent',
    })
  } catch (err) {
    console.error('notifyGigOffer failed', bookingId, err)
  }
}

/** Emails a cleaner the outcome of their application. */
export async function notifyApplicationDecision(supabase: SupabaseClient, cleanerId: string, approved: boolean): Promise<void> {
  try {
    const { data: cleaner } = await supabase.from('cleaners').select('name, email').eq('id', cleanerId).single()
    if (!cleaner?.email) return
    await sendAndLog(supabase, applicationDecisionEmail(cleaner.email, cleaner.name, approved), {
      actorId: cleanerId,
      action: approved ? 'approval_email_sent' : 'decline_email_sent',
    })
  } catch (err) {
    console.error('notifyApplicationDecision failed', cleanerId, err)
  }
}

/** Sends an alert to every ops user. */
export async function notifyOps(
  supabase: SupabaseClient,
  alert: { subject: string; heading: string; intro: string; rows: [string, string][]; path: string },
  log: { bookingId?: string | null; actorId?: string | null; action: string },
): Promise<boolean> {
  const to = await opsRecipients(supabase)
  if (to.length === 0) return false
  return sendAndLog(supabase, opsAlertEmail(to, alert), log)
}
