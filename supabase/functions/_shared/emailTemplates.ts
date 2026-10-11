// Client-facing booking emails. Copy follows the brand rules in CLAUDE.md:
// warm and professional, active voice, "cleaning visit" / "cleaning team",
// and no promised outcomes. Inline styles only — email clients strip <style>.

import { cleanerAppUrl, opsAppUrl, siteUrl, type EmailMessage } from './email.ts'

const CLEAN_TYPE_LABEL: Record<string, string> = {
  standard: 'Standard Clean',
  deep: 'First Time Clean',
  moveout: 'Move-out Clean',
}

// Poppins loads in Apple Mail, iOS Mail and most Android clients; Gmail
// strips web fonts, so the stack falls back to Helvetica/Arial there.
const FONT = "'Poppins',Helvetica,Arial,sans-serif"

// Served from the client site's public folder (client/public/email-logo.png).
// Overridable so emails keep a working logo before the domain is live.
function logoUrl(): string {
  return Deno.env.get('EMAIL_LOGO_URL') ?? `${siteUrl()}/email-logo.png`
}

const BRAND = {
  primary: '#D65A5A',
  secondary: '#2C5282',
  background: '#FDFBF7',
  text: '#1A1C1E',
  muted: '#64748B',
  border: '#E9E4DB',
}

export interface EmailBooking {
  customer_name: string
  customer_email: string
  clean_type: string
  service_date: string // YYYY-MM-DD
  time_window: string
  address_line: string
  city: string
  zip: string
  quoted_price: number
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function money(n: number): string {
  return `$${Number(n).toFixed(2)}`
}

function firstName(full: string): string {
  return (full.trim().split(/\s+/)[0] || 'there')
}

function detailRows(rows: [string, string][]): string {
  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="font-family:${FONT};padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="font-family:${FONT};padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('')
}

function layout(opts: { preheader: string; heading: string; intro: string; rows: [string, string][]; cta?: { label: string; url: string }; footerNote: string }): string {
  const cta = opts.cta
    ? `<tr><td style="padding:24px 0 8px;">
         <a href="${opts.cta.url}" style="font-family:${FONT};display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px;">${escapeHtml(opts.cta.label)}</a>
       </td></tr>`
    : ''
  return `<!doctype html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'); body, table, td, a, p, span { font-family: ${FONT}; }</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:${FONT};">
  <span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};padding:32px 16px;">
    <tr><td align="center" style="padding-bottom:20px;">
      <img src="${logoUrl()}" width="96" height="96" alt="Muncie Maid Service" style="display:block;width:96px;height:96px;border:0;outline:none;text-decoration:none;">
    </td></tr>
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:24px;padding:32px;">
        <tr><td style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${BRAND.primary};padding-bottom:12px;">Muncie Maid Service</td></tr>
        <tr><td style="font-family:${FONT};font-size:24px;font-weight:700;color:${BRAND.text};line-height:1.25;padding-bottom:12px;">${escapeHtml(opts.heading)}</td></tr>
        <tr><td style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.6;padding-bottom:16px;">${opts.intro}</td></tr>
        ${opts.rows.length ? `<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(opts.rows)}</table></td></tr>` : ''}
        ${cta}
        <tr><td style="font-family:${FONT};font-size:13px;color:${BRAND.muted};line-height:1.6;padding-top:20px;">${opts.footerNote}</td></tr>
      </table>
      <p style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin:20px 0 4px;">Muncie Maid Service &middot; Serving Muncie, Yorktown, Gaston &amp; Albany, Indiana</p>
      <p style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin:0 0 4px;"><a href="${siteUrl()}" style="font-family:${FONT};color:${BRAND.secondary};text-decoration:none;">munciemaids.com</a></p>
      <p style="font-family:${FONT};font-size:11px;color:${BRAND.muted};margin:0;">&copy; ${new Date().getFullYear()} Muncie Maid Service. All rights reserved.</p>
    </td></tr>
  </table>
</body></html>`
}

function textDetails(rows: [string, string][]): string {
  return rows.map(([l, v]) => `${l}: ${v}`).join('\n')
}

export function bookingConfirmedEmail(b: EmailBooking, manageUrl: string): EmailMessage {
  const service = CLEAN_TYPE_LABEL[b.clean_type] ?? b.clean_type
  const date = formatDate(b.service_date)
  const rows: [string, string][] = [
    ['Service', service],
    ['Date', date],
    ['Arrival window', b.time_window],
    ['Address', `${b.address_line}, ${b.city}, IN ${b.zip}`],
    ['Total paid', money(b.quoted_price)],
  ]
  const name = firstName(b.customer_name)
  return {
    to: b.customer_email,
    subject: `Your cleaning visit is confirmed — ${date}`,
    html: layout({
      preheader: `${service} on ${date}, ${b.time_window}.`,
      heading: 'Your cleaning visit is booked',
      intro: `Hi ${escapeHtml(name)}, thanks for booking with us. We received your payment and scheduled your cleaning visit. Here are the details:`,
      rows,
      cta: { label: 'View or manage your booking', url: manageUrl },
      footerNote:
        'Need to change plans? You can cancel for a full refund up to 24 hours before your visit. Inside 24 hours, we refund 50%. Use the link above to manage your booking any time.',
    }),
    text: `Hi ${name},\n\nThanks for booking with Muncie Maid Service. We received your payment and scheduled your cleaning visit.\n\n${textDetails(rows)}\n\nView or manage your booking: ${manageUrl}\n\nYou can cancel for a full refund up to 24 hours before your visit. Inside 24 hours, we refund 50%.\n\nMuncie Maid Service`,
  }
}

export function bookingCancelledEmail(b: EmailBooking, refundAmount: number): EmailMessage {
  const service = CLEAN_TYPE_LABEL[b.clean_type] ?? b.clean_type
  const date = formatDate(b.service_date)
  const rows: [string, string][] = [
    ['Service', service],
    ['Was scheduled for', `${date}, ${b.time_window}`],
    ['Refund', refundAmount > 0 ? money(refundAmount) : 'No charge to refund'],
  ]
  const name = firstName(b.customer_name)
  const refundLine =
    refundAmount > 0
      ? 'Your refund goes back to your original payment method. Most banks post it within 5–10 business days.'
      : 'You have nothing more to do.'
  const bookUrl = siteUrl()
  return {
    to: b.customer_email,
    subject: `Your cleaning visit on ${date} is cancelled`,
    html: layout({
      preheader: refundAmount > 0 ? `We issued a refund of ${money(refundAmount)}.` : 'Your cleaning visit is cancelled.',
      heading: 'Your cleaning visit is cancelled',
      intro: `Hi ${escapeHtml(name)}, we cancelled your cleaning visit. ${refundLine}`,
      rows,
      cta: { label: 'Book another visit', url: bookUrl },
      footerNote: 'We hope to see you again soon.',
    }),
    text: `Hi ${name},\n\nWe cancelled your cleaning visit. ${refundLine}\n\n${textDetails(rows)}\n\nBook another visit: ${bookUrl}\n\nMuncie Maid Service`,
  }
}

// ── Client: reminder + thank-you ────────────────────────────────────────────

export function visitReminderEmail(b: EmailBooking, manageUrl: string): EmailMessage {
  const service = CLEAN_TYPE_LABEL[b.clean_type] ?? b.clean_type
  const date = formatDate(b.service_date)
  const rows: [string, string][] = [
    ['Service', service],
    ['Date', date],
    ['Arrival window', b.time_window],
    ['Address', `${b.address_line}, ${b.city}, IN ${b.zip}`],
  ]
  const name = firstName(b.customer_name)
  return {
    to: b.customer_email,
    subject: `Reminder: your cleaning visit is tomorrow, ${b.time_window}`,
    html: layout({
      preheader: `Your cleaning team arrives tomorrow between ${b.time_window}.`,
      heading: 'Your cleaning visit is tomorrow',
      intro: `Hi ${escapeHtml(name)}, a quick reminder: your cleaning team arrives tomorrow. If you left entry instructions, we pass them along to your team.`,
      rows,
      cta: { label: 'View your booking', url: manageUrl },
      footerNote: 'Plans changed? You can still cancel from the link above. Cancelling inside 24 hours of your visit refunds 50%.',
    }),
    text: `Hi ${name},\n\nA quick reminder: your cleaning team arrives tomorrow.\n\n${textDetails(rows)}\n\nView your booking: ${manageUrl}\n\nCancelling inside 24 hours of your visit refunds 50%.\n\nMuncie Maid Service`,
  }
}

export function visitCompletedEmail(b: EmailBooking): EmailMessage {
  const name = firstName(b.customer_name)
  const bookUrl = siteUrl()
  return {
    to: b.customer_email,
    subject: 'Thanks for choosing Muncie Maid Service',
    html: layout({
      preheader: 'Your cleaning team finished your visit today.',
      heading: 'Your cleaning visit is complete',
      intro: `Hi ${escapeHtml(name)}, your cleaning team finished your visit. Thank you for trusting us with your home.`,
      rows: [],
      cta: { label: 'Book your next visit', url: bookUrl },
      footerNote: 'Weekly and biweekly visits come with a discount, and you keep the same easy online booking.',
    }),
    text: `Hi ${name},\n\nYour cleaning team finished your visit. Thank you for trusting us with your home.\n\nBook your next visit: ${bookUrl}\n\nMuncie Maid Service`,
  }
}

// ── Cleaners ────────────────────────────────────────────────────────────────

export interface EmailGig {
  clean_type: string
  service_date: string
  time_window: string
  city: string
  quoted_price: number
}

export function gigOfferEmail(cleanerEmail: string, cleanerName: string, g: EmailGig): EmailMessage {
  const service = CLEAN_TYPE_LABEL[g.clean_type] ?? g.clean_type
  const date = formatDate(g.service_date)
  const payout = money(Math.round(Number(g.quoted_price) * 0.7 * 100) / 100)
  const rows: [string, string][] = [
    ['Job', service],
    ['Date', date],
    ['Arrival window', g.time_window],
    ['Town', g.city],
    ['Your payout', payout],
  ]
  const url = cleanerAppUrl()
  const name = firstName(cleanerName)
  return {
    to: cleanerEmail,
    subject: `New gig offer: ${service} in ${g.city}, ${date}`,
    html: layout({
      preheader: `${payout} payout. Accept or decline within 4 hours.`,
      heading: 'You have a new gig offer',
      intro: `Hi ${escapeHtml(name)}, we matched you with a job. Accept it or pass on it in the app. Declining never counts against you.`,
      rows,
      cta: { label: 'Open the cleaner app', url },
      footerNote: 'Offers stay open for 4 hours. After that, the job goes back to the open feed for any cleaner to claim.',
    }),
    text: `Hi ${name},\n\nWe matched you with a job. Accept it or pass on it in the app. Declining never counts against you.\n\n${textDetails(rows)}\n\nOpen the cleaner app: ${url}\n\nOffers stay open for 4 hours.\n\nMuncie Maid Service`,
  }
}

export function applicationDecisionEmail(cleanerEmail: string, cleanerName: string, approved: boolean): EmailMessage {
  const name = firstName(cleanerName)
  const url = cleanerAppUrl()
  if (approved) {
    return {
      to: cleanerEmail,
      subject: "You're approved — your gig feed is open",
      html: layout({
        preheader: 'Sign in to start claiming jobs near you.',
        heading: "Welcome aboard — you're approved",
        intro: `Hi ${escapeHtml(name)}, we finished reviewing your application and approved it. Your gig feed is now open: claim the jobs that fit your schedule and keep 70% of every job you complete.`,
        rows: [],
        cta: { label: 'Open your gig feed', url },
        footerNote: 'No minimum hours and no exclusivity. Work when it suits you.',
      }),
      text: `Hi ${name},\n\nWe approved your application. Your gig feed is now open: claim the jobs that fit your schedule and keep 70% of every job you complete.\n\nOpen your gig feed: ${url}\n\nMuncie Maid Service`,
    }
  }
  return {
    to: cleanerEmail,
    subject: 'An update on your Muncie Maid Service application',
    html: layout({
      preheader: 'We reviewed your application.',
      heading: 'An update on your application',
      intro: `Hi ${escapeHtml(name)}, thank you for applying. After reviewing your application, we can't move forward with it at this time.`,
      rows: [],
      footerNote: 'If a background check report played a part in this decision, the screening company sends you a copy of the report along with your rights to dispute it.',
    }),
    text: `Hi ${name},\n\nThank you for applying. After reviewing your application, we can't move forward with it at this time.\n\nIf a background check report played a part in this decision, the screening company sends you a copy of the report along with your rights to dispute it.\n\nMuncie Maid Service`,
  }
}

// ── Ops alerts ──────────────────────────────────────────────────────────────

export function opsAlertEmail(to: string[], opts: { subject: string; heading: string; intro: string; rows: [string, string][]; path: string }): EmailMessage {
  const url = `${opsAppUrl()}${opts.path}`
  return {
    to,
    subject: `[Ops] ${opts.subject}`,
    html: layout({
      preheader: opts.intro.replace(/<[^>]+>/g, ''),
      heading: opts.heading,
      intro: escapeHtml(opts.intro),
      rows: opts.rows,
      cta: { label: 'Open the ops portal', url },
      footerNote: 'You get this because you have ops access to Muncie Maid Service.',
    }),
    text: `${opts.intro}\n\n${textDetails(opts.rows)}\n\nOpen the ops portal: ${url}`,
  }
}

export { CLEAN_TYPE_LABEL, formatDate }
